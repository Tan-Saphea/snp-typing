import { create } from "zustand";

import {
  clearDesktopRefreshToken,
  isDesktopApp,
  readDesktopRefreshToken,
  saveDesktopRefreshToken,
} from "../services/desktopBridge.js";
import {
  configureApiSession,
  getApiErrorMessage,
} from "../services/api.js";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  restoreSessionRequest,
} from "../services/authService.js";

async function persistRefreshToken(refreshToken) {
  if (isDesktopApp && refreshToken) {
    await saveDesktopRefreshToken(refreshToken);
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: "idle",
  error: null,
  setUser: (user) => set({ user }),

  initialize: async () => {
    if (get().status !== "idle") {
      return;
    }

    set({ status: "restoring", error: null });

    try {
      if (isDesktopApp) {
        const storedToken = await readDesktopRefreshToken();

        if (!storedToken) {
          set({ status: "anonymous" });
          return;
        }

        await get().refresh();
        return;
      }

      const session = await restoreSessionRequest();

      if (!session) {
        set({ status: "anonymous" });
        return;
      }

      set({
        user: session.user,
        accessToken: session.accessToken,
        status: "authenticated",
      });
    } catch {
      await clearDesktopRefreshToken();
      set({
        user: null,
        accessToken: null,
        status: "anonymous",
      });
    }
  },

  login: async (credentials) => {
    set({ error: null });

    try {
      const session = await loginRequest(credentials);
      await persistRefreshToken(session.refreshToken);
      set({
        user: session.user,
        accessToken: session.accessToken,
        status: "authenticated",
      });
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), status: "anonymous" });
      return false;
    }
  },

  register: async (profile) => {
    set({ error: null });

    try {
      const session = await registerRequest(profile);
      await persistRefreshToken(session.refreshToken);
      set({
        user: session.user,
        accessToken: session.accessToken,
        status: "authenticated",
      });
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), status: "anonymous" });
      return false;
    }
  },

  refresh: async () => {
    const storedToken = await readDesktopRefreshToken();
    const session = await refreshRequest(storedToken);
    await persistRefreshToken(session.refreshToken);
    set({
      user: session.user,
      accessToken: session.accessToken,
      status: "authenticated",
      error: null,
    });
    return session.accessToken;
  },

  logout: async () => {
    const storedToken = await readDesktopRefreshToken();

    try {
      await logoutRequest(storedToken);
    } finally {
      await clearDesktopRefreshToken();
      set({
        user: null,
        accessToken: null,
        status: "anonymous",
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

configureApiSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refresh: () => useAuthStore.getState().refresh(),
  expire: async () => {
    await clearDesktopRefreshToken();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      status: "anonymous",
    });
  },
});
