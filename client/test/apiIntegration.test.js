import { afterEach, expect, test } from "vitest";

import { api, configureApiSession } from "../src/services/api.js";
import { loginRequest } from "../src/services/authService.js";

const integrationEnabled = process.env.SNP_INTEGRATION_API === "true";

afterEach(() => {
  configureApiSession(null);
});

test.skipIf(!integrationEnabled)(
  "frontend API service logs in and accesses a protected route",
  async () => {
    const session = await loginRequest({
      username: process.env.SNP_INTEGRATION_USERNAME ?? "dara",
      password: process.env.SNP_INTEGRATION_PASSWORD,
    });

    expect(session.user.username).toBe(
      process.env.SNP_INTEGRATION_USERNAME ?? "dara",
    );
    expect(session.accessToken).toBeTypeOf("string");
    expect(session.refreshToken).toBeUndefined();

    configureApiSession({
      getAccessToken: () => session.accessToken,
      refresh: () => Promise.reject(new Error("Unexpected refresh")),
      expire: () => Promise.resolve(),
    });

    const response = await api.get("/auth/me");

    expect(response.data.data.user.id).toBe(session.user.id);
    expect(response.data.data.user.username).toBe(session.user.username);
  },
);
