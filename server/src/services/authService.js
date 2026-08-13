import mongoose from "mongoose";

import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import {
  createRefreshTokenValue,
  getRefreshTokenExpiry,
  hashRefreshToken,
  signAccessToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const invalidCredentialsError = () =>
  new ApiError(401, "INVALID_CREDENTIALS", "The username or password is incorrect.");

function sessionContext(requestContext = {}) {
  return {
    createdByIp: requestContext.ip ?? "",
    userAgent: requestContext.userAgent?.slice(0, 500) ?? "",
  };
}

async function createStoredRefreshToken(user, requestContext) {
  const refreshToken = createRefreshTokenValue(user.id);
  const tokenHash = hashRefreshToken(refreshToken);

  await RefreshToken.create({
    user: user.id,
    tokenHash,
    expiresAt: getRefreshTokenExpiry(refreshToken),
    ...sessionContext(requestContext),
  });

  return { refreshToken, tokenHash };
}

async function createSession(user, requestContext) {
  const { refreshToken } = await createStoredRefreshToken(user, requestContext);

  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
    refreshToken,
    refreshExpiresAt: getRefreshTokenExpiry(refreshToken),
  };
}

export async function login({ username, password }, requestContext) {
  const user = await User.findOne({ username: username.toLowerCase() }).select(
    "+passwordHash",
  );

  if (!user || !(await user.verifyPassword(password))) {
    throw invalidCredentialsError();
  }

  if (user.status !== "active") {
    throw new ApiError(
      403,
      "ACCOUNT_INACTIVE",
      "This account is not active. Ask an administrator for help.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return createSession(user, requestContext);
}

export async function refresh(refreshToken, requestContext) {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again.");
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();
  const storedToken = await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { revokedAt: now } },
    { new: false },
  );

  if (!storedToken || storedToken.user.toString() !== decoded.sub) {
    throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again.");
  }

  const user = await User.findOne({ _id: storedToken.user, status: "active" });

  if (!user) {
    throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again.");
  }

  const replacement = await createStoredRefreshToken(user, requestContext);
  storedToken.replacedByTokenHash = replacement.tokenHash;
  await storedToken.save();

  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
    refreshToken: replacement.refreshToken,
    refreshExpiresAt: getRefreshTokenExpiry(replacement.refreshToken),
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  await RefreshToken.updateOne(
    { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllUserSessions(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    return;
  }

  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
