import axios from "axios";

import { isDesktopApp } from "./desktopBridge.js";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";
const developmentApiUrl = !isProduction
  ? "http://localhost:5001/api"
  : "";

export const apiConfigurationError = configuredApiUrl
  ? null
  : isProduction
    ? "NEXT_PUBLIC_API_URL was not configured for this build."
    : null;

const clientOptions = {
  baseURL: configuredApiUrl || developmentApiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-SNP-Client": isDesktopApp ? "electron" : "browser",
  },
};

export const publicApi = axios.create(clientOptions);
export const api = axios.create(clientOptions);

let sessionAdapter = null;
let refreshPromise = null;

export function configureApiSession(adapter) {
  sessionAdapter = adapter;
}

api.interceptors.request.use((config) => {
  const accessToken = sessionAdapter?.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      request &&
      !request._snpRetried &&
      !request.url?.startsWith("/auth/") &&
      sessionAdapter;

    if (!shouldRefresh) {
      throw error;
    }

    request._snpRetried = true;

    try {
      refreshPromise ??= sessionAdapter.refresh();
      const accessToken = await refreshPromise;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request);
    } catch (refreshError) {
      await sessionAdapter.expire();
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  },
);

export function getApiErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  if (!error.response) {
    return "SNP Typing cannot reach the school server. Check the connection and try again.";
  }

  return (
    error.response.data?.error?.message ??
    "Something went wrong. Please try again."
  );
}
