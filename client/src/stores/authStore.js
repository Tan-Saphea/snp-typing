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
  restoreSessionRequest,
} from "../services/authService.js";
import { getSchoolSettings } from "../services/settingsService.js";

const defaultSchoolSettings = { minimumPassingAccuracy: 70, showLiveWpm: true, allowTypingGames: true, lessonUnlocking: true, leaderboardVisibility: "school" };

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
  schoolSettings: defaultSchoolSettings,
  setUser: (user) => set({ user }),
  setSchoolSettings: (schoolSettings) => set({ schoolSettings }),
  loadSchoolSettings: async () => {
    try { set({ schoolSettings: await getSchoolSettings() }); }
    catch { set({ schoolSettings: defaultSchoolSettings }); }
  },

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
        await get().loadSchoolSettings();
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
      await get().loadSchoolSettings();
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
      await get().loadSchoolSettings();
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
        schoolSettings: defaultSchoolSettings,
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
      schoolSettings: defaultSchoolSettings,
    });
  },
});
