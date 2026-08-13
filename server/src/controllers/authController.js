import { env } from "../config/env.js";
import * as authService from "../services/authService.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function requestContext(request) {
  return {
    ip: request.ip,
    userAgent: request.get("user-agent"),
  };
}

function readRefreshToken(request) {
  return request.validated?.body?.refreshToken || request.cookies[env.COOKIE_NAME];
}

function setRefreshCookie(response, session) {
  response.cookie(env.COOKIE_NAME, session.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    expires: session.refreshExpiresAt,
  });
}

function clearRefreshCookie(response) {
  response.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
}

function sessionPayload(request, session) {
  return {
    user: session.user,
    accessToken: session.accessToken,
    ...(request.get("x-snp-client") === "electron"
      ? { refreshToken: session.refreshToken }
      : {}),
  };
}

export const login = asyncHandler(async (request, response) => {
  const session = await authService.login(
    request.validated.body,
    requestContext(request),
  );
  setRefreshCookie(response, session);
  response.status(200).json({ data: sessionPayload(request, session) });
});

export const refresh = asyncHandler(async (request, response) => {
  const refreshToken = readRefreshToken(request);

  if (!refreshToken) {
    throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again.");
  }

  const session = await authService.refresh(
    refreshToken,
    requestContext(request),
  );
  setRefreshCookie(response, session);
  response.status(200).json({ data: sessionPayload(request, session) });
});

export const restoreSession = asyncHandler(async (request, response) => {
  const refreshToken = request.cookies[env.COOKIE_NAME];

  if (!refreshToken) {
    response.status(200).json({ data: null });
    return;
  }

  try {
    const session = await authService.refresh(
      refreshToken,
      requestContext(request),
    );
    setRefreshCookie(response, session);
    response.status(200).json({ data: sessionPayload(request, session) });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearRefreshCookie(response);
      response.status(200).json({ data: null });
      return;
    }

    throw error;
  }
});

export const logout = asyncHandler(async (request, response) => {
  await authService.logout(readRefreshToken(request));
  clearRefreshCookie(response);
  response.status(204).send();
});

export const me = asyncHandler(async (request, response) => {
  response.status(200).json({ data: { user: request.auth.user.toJSON() } });
});
