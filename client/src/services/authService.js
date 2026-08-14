import { publicApi } from "./api.js";

export async function loginRequest(credentials) {
  const response = await publicApi.post("/auth/login", credentials);
  return response.data.data;
}

export async function registerRequest(profile) {
  const response = await publicApi.post("/auth/register", profile);
  return response.data.data;
}

export async function refreshRequest(refreshToken) {
  const response = await publicApi.post(
    "/auth/refresh",
    refreshToken ? { refreshToken } : {},
  );
  return response.data.data;
}

export async function restoreSessionRequest() {
  const response = await publicApi.post("/auth/session");
  return response.data.data;
}

export async function logoutRequest(refreshToken) {
  await publicApi.post(
    "/auth/logout",
    refreshToken ? { refreshToken } : {},
  );
}
