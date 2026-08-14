import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  }

  let decoded;

  try {
    decoded = verifyAccessToken(authorization.slice(7));
  } catch {
    throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Your session has expired. Please sign in again.");
  }

  const user = await User.findOne({ _id: decoded.sub, status: "active" });

  if (!user) {
    throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Your account is unavailable.");
  }

  if (
    user.passwordChangedAt &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Your password changed. Please sign in again.");
  }

  request.auth = { user, userId: user.id };
  next();
});
