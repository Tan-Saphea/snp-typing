import axios from "axios";

import { isDesktopApp, requestDesktopApi } from "./desktopBridge.js";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";
const isDesktopBuild = process.env.NEXT_PUBLIC_DESKTOP_BUILD === "true";
const developmentApiUrl = !isProduction
  ? "http://localhost:5001/api"
  : "";

export const apiConfigurationError = isDesktopApp || isDesktopBuild || configuredApiUrl
  ? null
  : isProduction
    ? "NEXT_PUBLIC_API_URL was not configured for this build."
    : null;

let sessionAdapter = null;
let refreshPromise = null;

const clientOptions = {
  baseURL: configuredApiUrl || developmentApiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-SNP-Client": isDesktopApp ? "electron" : "browser",
  },
};

function createDesktopClient(authenticated) {
  async function request(method, url, data, config = {}) {
    const response = await requestDesktopApi({
      method,
      path: url,
      data: data ?? {},
      params: config.params ?? {},
      accessToken: authenticated ? sessionAdapter?.getAccessToken() : null,
    });

    if (!response.ok) {
      const error = new Error(response.body?.error?.message || "The offline request failed.");
      error.response = { status: response.status, data: response.body };
      throw error;
    }

    return { data: response.body, status: response.status };
  }

  return {
    get: (url, config) => request("GET", url, null, config),
    post: (url, data, config) => request("POST", url, data, config),
    patch: (url, data, config) => request("PATCH", url, data, config),
    put: (url, data, config) => request("PUT", url, data, config),
    delete: (url, config) => request("DELETE", url, null, config),
  };
}

const networkPublicApi = axios.create(clientOptions);
const networkApi = axios.create(clientOptions);

export const publicApi = isDesktopApp ? createDesktopClient(false) : networkPublicApi;
export const api = isDesktopApp ? createDesktopClient(true) : networkApi;

export function configureApiSession(adapter) {
  sessionAdapter = adapter;
}

if (!isDesktopApp) {
  networkApi.interceptors.request.use((config) => {
    const accessToken = sessionAdapter?.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  networkApi.interceptors.response.use(
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
        return networkApi(request);
      } catch (refreshError) {
        await sessionAdapter.expire();
        throw refreshError;
      } finally {
        refreshPromise = null;
      }
    },
  );
}

export function getApiErrorMessage(error) {
  if (error.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  if (!error.response) {
    return "SNP Typing cannot reach the application server. Check the connection and try again.";
  }

  const apiError = error.response.data?.error;
  const firstDetail = apiError?.details?.find((detail) => detail?.message);

  if (firstDetail) {
    const field = firstDetail.field?.split(".").at(-1);
    const labels = {
      firstName: "First name",
      lastName: "Last name",
      khmerName: "Khmer name",
      username: "Username",
      password: "Password",
    };
    return field && labels[field]
      ? `${labels[field]}: ${firstDetail.message}`
      : firstDetail.message;
  }

  return apiError?.message ?? "Something went wrong. Please try again.";
}
