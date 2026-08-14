import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  delete globalThis.window;
  vi.resetModules();
});

test("desktop API requests use the embedded IPC service instead of HTTP", async () => {
  const request = vi.fn(async (payload) => ({
    ok: true,
    status: 200,
    body: { data: { echoed: payload } },
  }));
  globalThis.window = {
    snpDesktop: {
      app: { getInfo: vi.fn() },
      auth: {
        getRefreshToken: vi.fn(),
        setRefreshToken: vi.fn(),
        clearRefreshToken: vi.fn(),
      },
      offline: { request },
    },
  };

  const { api, configureApiSession } = await import("../src/services/api.js");
  configureApiSession({ getAccessToken: () => "offline-access-token" });
  const response = await api.get("/lessons", { params: { language: "km" } });

  expect(response.data.data.echoed).toMatchObject({
    method: "GET",
    path: "/lessons",
    params: { language: "km" },
    accessToken: "offline-access-token",
  });
  expect(request).toHaveBeenCalledOnce();
});
