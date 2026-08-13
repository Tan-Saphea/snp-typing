const apiUrl = process.env.SNP_SMOKE_API_URL ?? "http://127.0.0.1:5010/api";
const username = process.env.SNP_SMOKE_USERNAME ?? "dara";
const password = process.env.SNP_SMOKE_PASSWORD;
const browserOrigin =
  process.env.SNP_SMOKE_BROWSER_ORIGIN ?? "http://127.0.0.1:5174";

if (!password) {
  throw new Error("SNP_SMOKE_PASSWORD is required.");
}

async function apiRequest(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-SNP-Client": "electron",
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(
      `${options.method ?? "GET"} ${path} returned ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

const login = await apiRequest("/auth/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
});
const firstSession = login.data;

if (!firstSession.accessToken || !firstSession.refreshToken) {
  throw new Error("Login did not return the Electron session tokens.");
}

const currentUser = await apiRequest("/auth/me", {
  headers: { Authorization: `Bearer ${firstSession.accessToken}` },
});

if (currentUser.data.user.username !== username) {
  throw new Error("Protected user response does not match the login account.");
}

const refreshed = await apiRequest("/auth/refresh", {
  method: "POST",
  body: JSON.stringify({ refreshToken: firstSession.refreshToken }),
});
const secondSession = refreshed.data;

if (secondSession.refreshToken === firstSession.refreshToken) {
  throw new Error("Refresh token rotation did not occur.");
}

await apiRequest(
  "/auth/refresh",
  {
    method: "POST",
    body: JSON.stringify({ refreshToken: firstSession.refreshToken }),
  },
  401,
);

await apiRequest(
  "/auth/logout",
  {
    method: "POST",
    body: JSON.stringify({ refreshToken: secondSession.refreshToken }),
  },
  204,
);

await apiRequest(
  "/auth/refresh",
  {
    method: "POST",
    body: JSON.stringify({ refreshToken: secondSession.refreshToken }),
  },
  401,
);

const health = await apiRequest("/health");

if (health.data.status !== "healthy") {
  throw new Error("Health endpoint did not report a healthy API.");
}

const malformedJson = await fetch(`${apiUrl}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{",
});
const malformedJsonPayload = await malformedJson.json();

if (
  malformedJson.status !== 400 ||
  malformedJsonPayload.error?.code !== "INVALID_JSON"
) {
  throw new Error("Malformed JSON did not return the expected API error.");
}

const missingRoute = await apiRequest("/does-not-exist", {}, 404);

if (missingRoute.error?.code !== "ROUTE_NOT_FOUND") {
  throw new Error("Unknown API routes do not return the expected error.");
}

await apiRequest(
  "/auth/login",
  {
    method: "POST",
    body: JSON.stringify({ username, password: "Incorrect123!" }),
  },
  401,
);

const preflight = await fetch(`${apiUrl}/auth/login`, {
  method: "OPTIONS",
  headers: {
    Origin: browserOrigin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type,x-snp-client",
  },
});

if (
  preflight.status !== 204 ||
  preflight.headers.get("access-control-allow-origin") !== browserOrigin ||
  preflight.headers.get("access-control-allow-credentials") !== "true"
) {
  throw new Error("Browser CORS preflight did not allow the configured frontend.");
}

const anonymousSessionResponse = await fetch(`${apiUrl}/auth/session`, {
  method: "POST",
  headers: {
    Origin: browserOrigin,
    "X-SNP-Client": "browser",
  },
});
const anonymousSession = await anonymousSessionResponse.json();

if (anonymousSessionResponse.status !== 200 || anonymousSession.data !== null) {
  throw new Error("Anonymous browser session restore did not return cleanly.");
}

const browserLoginResponse = await fetch(`${apiUrl}/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: browserOrigin,
    "X-SNP-Client": "browser",
  },
  body: JSON.stringify({ username, password }),
});
const browserLogin = await browserLoginResponse.json();
const firstCookie = browserLoginResponse.headers.get("set-cookie")?.split(";", 1)[0];

if (
  browserLoginResponse.status !== 200 ||
  !firstCookie ||
  browserLogin.data.refreshToken
) {
  throw new Error("Browser login did not use an HttpOnly cookie-only refresh session.");
}

const browserRefreshResponse = await fetch(`${apiUrl}/auth/session`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: firstCookie,
    Origin: browserOrigin,
    "X-SNP-Client": "browser",
  },
  body: "{}",
});
const browserRefresh = await browserRefreshResponse.json();
const secondCookie = browserRefreshResponse.headers
  .get("set-cookie")
  ?.split(";", 1)[0];

if (
  browserRefreshResponse.status !== 200 ||
  !secondCookie ||
  secondCookie === firstCookie ||
  browserRefresh.data.refreshToken
) {
  throw new Error("Browser cookie refresh did not rotate securely.");
}

const blockedOrigin = await fetch(`${apiUrl}/health`, {
  headers: { Origin: "https://untrusted.example" },
});

if (blockedOrigin.status !== 403) {
  throw new Error("The API did not reject an unconfigured browser origin.");
}

await fetch(`${apiUrl}/auth/logout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: secondCookie,
    Origin: browserOrigin,
    "X-SNP-Client": "browser",
  },
  body: "{}",
});

console.log("API and authentication smoke tests passed.");
