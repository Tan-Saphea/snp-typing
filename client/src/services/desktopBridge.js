const desktopBridge =
  typeof window === "undefined" ? null : (window.snpDesktop ?? null);

export const isDesktopApp = Boolean(desktopBridge);

export async function readDesktopRefreshToken() {
  return desktopBridge?.auth.getRefreshToken() ?? null;
}

export async function saveDesktopRefreshToken(token) {
  if (desktopBridge) {
    await desktopBridge.auth.setRefreshToken(token);
  }
}

export async function clearDesktopRefreshToken() {
  if (desktopBridge) {
    await desktopBridge.auth.clearRefreshToken();
  }
}

export async function getDesktopAppInfo() {
  return desktopBridge?.app.getInfo() ?? {
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "development",
    platform: "browser",
  };
}
