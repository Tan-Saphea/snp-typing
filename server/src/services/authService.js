import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { env } from "../config/env.js";
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
      "This account is not active. Contact support for help.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return createSession(user, requestContext);
}

const REQUIRED_RECOVERY_KEY = "Admin.snpis@2013";

export async function register(data, requestContext) {
  const providedRecoveryKey = (data.securityAnswer || "").trim();
  if (
    providedRecoveryKey !== REQUIRED_RECOVERY_KEY &&
    providedRecoveryKey.toLowerCase() !== REQUIRED_RECOVERY_KEY.toLowerCase()
  ) {
    throw new ApiError(
      400,
      "INVALID_RECOVERY_KEY",
      "Recovery Key មិនត្រឹមត្រូវទេ! សូមទាក់ទងលោកគ្រូ ឬអ្នកគ្រូ។ (The recovery key is incorrect. Please contact your instructor.)",
    );
  }

  const username = data.username.toLowerCase().trim();
  const existingUser = await User.exists({ username });

  if (existingUser) {
    throw new ApiError(409, "USERNAME_TAKEN", "That username is already in use. Choose another one.");
  }

  const rawName = (data.name || data.firstName || "").trim();
  const isKhmer = /[\u1780-\u17FF]/.test(rawName);
  const firstName = rawName || "Learner";
  const lastName = data.lastName ? data.lastName.trim() : "";
  const khmerName = data.khmerName ? data.khmerName.trim() : (isKhmer ? rawName : "");

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
  let user;

  try {
    user = await User.create({
      username,
      passwordHash,
      firstName,
      lastName,
      khmerName,
      gender: data.gender || "unspecified",
      securityQuestion: (data.securityQuestion && data.securityQuestion.trim()) || "Recovery Key",
      securityAnswer: await bcrypt.hash(
        data.securityAnswer.trim().toLowerCase(),
        env.BCRYPT_ROUNDS,
      ),
      status: "active",
      lastLoginAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "USERNAME_TAKEN", "That username is already in use. Choose another one.");
    }
    throw error;
  }

  return createSession(user, requestContext);
}

export async function findUsername(criteria = {}) {
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const orConditions = [];

  const searchText = (criteria.query || criteria.firstName || criteria.name || "").trim();
  if (searchText) {
    const reg = new RegExp(escapeRegex(searchText), "i");
    orConditions.push({ username: reg });
    orConditions.push({ firstName: reg });
    orConditions.push({ lastName: reg });
    orConditions.push({ khmerName: reg });
  }
  if (criteria.khmerName && criteria.khmerName.trim()) {
    orConditions.push({ khmerName: new RegExp(escapeRegex(criteria.khmerName.trim()), "i") });
  }
  if (criteria.lastName && criteria.lastName.trim()) {
    orConditions.push({ lastName: new RegExp(escapeRegex(criteria.lastName.trim()), "i") });
  }

  if (orConditions.length === 0) {
    throw new ApiError(400, "MISSING_CRITERIA", "Please enter a name or username to search.");
  }

  const matches = await User.find({
    status: "active",
    $or: orConditions,
  })
    .select("username firstName lastName khmerName")
    .limit(10);

  return matches.map((u) => ({
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName || "",
    khmerName: u.khmerName || "",
  }));
}

export async function getAccountVerificationInfo(username) {
  const user = await User.findOne({
    username: username.toLowerCase().trim(),
    status: "active",
  }).select("username firstName securityQuestion");

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "No active account found with this username.");
  }

  return {
    username: user.username,
    firstName: user.firstName,
    securityQuestion: user.securityQuestion || "Recovery Key",
    hasSecurityQuestion: Boolean(user.securityAnswer?.trim() || user.securityQuestion?.trim()),
  };
}

export async function resetPassword({ username, newPassword, securityAnswer }) {
  const user = await User.findOne({
    username: username.toLowerCase().trim(),
    status: "active",
  }).select("+passwordHash +securityAnswer");

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "No active account found with this username.");
  }

  if (!user.securityAnswer?.trim()) {
    throw new ApiError(
      409,
      "RECOVERY_NOT_CONFIGURED",
      "Password recovery is not configured for this account.",
    );
  }

  const storedAnswer = user.securityAnswer.trim();
  const providedAnswer = securityAnswer.trim().toLowerCase();
  const answerMatches = storedAnswer.startsWith("$2")
    ? await bcrypt.compare(providedAnswer, storedAnswer)
    : storedAnswer.toLowerCase() === providedAnswer;

  if (!answerMatches) {
    throw new ApiError(
      400,
      "SECURITY_ANSWER_INCORRECT",
      "The recovery key is incorrect (ពាក្យគន្លឹះសង្គ្រោះគណនីមិនត្រឹមត្រូវទេ)។",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.passwordHash = passwordHash;
  user.passwordChangedAt = new Date();
  await user.save();

  await revokeAllUserSessions(user.id);

  return {
    message: "Password reset successfully. Please sign in with your new password.",
  };
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
