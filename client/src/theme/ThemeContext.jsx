"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore.js";
import { savePreferences } from "@/services/settingsService.js";

const STORAGE_KEY = "snp-learner-settings";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  isDarkMode: false,
  systemDark: false,
  largeText: false,
  setTheme: () => {},
  toggleTheme: () => {},
  setLargeText: () => {},
});

function getStoredSettings() {
  if (typeof window === "undefined") {
    return { theme: "system", largeText: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { theme: "system", largeText: false };
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme || "system",
      largeText: Boolean(parsed.largeText),
    };
  } catch {
    return { theme: "system", largeText: false };
  }
}

export function ThemeProvider({ children }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [storedSettings, setStoredSettings] = useState(getStoredSettings);
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Monitor system OS color scheme changes
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);

    const handleChange = (e) => {
      setSystemDark(e.matches);
    };

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Listen for storage changes across tabs or custom dispatch
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredSettings(getStoredSettings());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("snp-settings-changed", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("snp-settings-changed", handleStorageChange);
    };
  }, []);

  // Preferred theme priority: user preference -> localStorage settings -> system
  const currentTheme = user?.preferences?.theme || storedSettings.theme || "system";

  // Large text priority: user preference -> localStorage settings
  const isLargeText = Boolean(
    user?.preferences?.fontSize === "large" || storedSettings.largeText
  );

  // Compute resolved theme
  const resolvedTheme = useMemo(() => {
    if (currentTheme === "dark") return "dark";
    if (currentTheme === "light") return "light";
    return systemDark ? "dark" : "light";
  }, [currentTheme, systemDark]);

  const isDarkMode = resolvedTheme === "dark";

  // Apply classes and colorScheme to root element
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.classList.toggle("dark", isDarkMode);
    root.classList.toggle("snp-dark", isDarkMode);
    root.classList.toggle("snp-large-text", isLargeText);
    root.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode, isLargeText]);

  // Handle setting new theme
  const setTheme = useCallback(
    async (nextTheme) => {
      const validTheme = ["light", "dark", "system"].includes(nextTheme)
        ? nextTheme
        : "system";

      // 1. Update localStorage
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        const updated = { ...prev, theme: validTheme };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setStoredSettings(updated);
        window.dispatchEvent(new Event("snp-settings-changed"));
      } catch {
        // Fallback for private browsing
      }

      // 2. Update user state in authStore if logged in
      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            theme: validTheme,
          },
        };
        setUser(updatedUser);

        // Background sync to backend API
        try {
          await savePreferences({ theme: validTheme });
        } catch {
          // Keep local changes even if offline
        }
      }
    },
    [user, setUser]
  );

  // Toggle theme helper (cycles: light -> dark, or dark -> light)
  const toggleTheme = useCallback(() => {
    if (currentTheme === "system") {
      setTheme(isDarkMode ? "light" : "dark");
    } else if (currentTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [currentTheme, isDarkMode, setTheme]);

  // Handle large text toggle
  const setLargeText = useCallback(
    async (nextLarge) => {
      const isLarge = Boolean(nextLarge);
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        const updated = { ...prev, largeText: isLarge };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setStoredSettings(updated);
        window.dispatchEvent(new Event("snp-settings-changed"));
      } catch {
        // Fallback
      }

      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            fontSize: isLarge ? "large" : "normal",
          },
        };
        setUser(updatedUser);
        try {
          await savePreferences({ fontSize: isLarge ? "large" : "normal" });
        } catch {
          // Keep local
        }
      }
    },
    [user, setUser]
  );

  const value = useMemo(
    () => ({
      theme: currentTheme,
      resolvedTheme,
      isDarkMode,
      systemDark,
      largeText: isLargeText,
      mounted,
      setTheme,
      toggleTheme,
      setLargeText,
    }),
    [
      currentTheme,
      resolvedTheme,
      isDarkMode,
      systemDark,
      isLargeText,
      mounted,
      setTheme,
      toggleTheme,
      setLargeText,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
