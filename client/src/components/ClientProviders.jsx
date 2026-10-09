"use client";

import { useEffect, useMemo } from "react";
import { App as AntApp, ConfigProvider } from "antd";

import AppErrorBoundary from "@/app/AppErrorBoundary.jsx";
import FullPageLoader from "@/components/FullPageLoader.jsx";
import { useAuthStore } from "@/stores/authStore.js";
import { getThemeConfig } from "@/theme/themeConfig.js";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext.jsx";

function AntdThemedApp({ children }) {
  const status = useAuthStore((state) => state.status);
  const { resolvedTheme, largeText } = useTheme();

  const antdTheme = useMemo(
    () => getThemeConfig(resolvedTheme, largeText),
    [resolvedTheme, largeText]
  );

  return (
    <ConfigProvider theme={antdTheme}>
      <AntApp>
        {status === "idle" || status === "restoring" ? (
          <FullPageLoader message="Opening your learning space…" />
        ) : (
          children
        )}
      </AntApp>
    </ConfigProvider>
  );
}

export default function ClientProviders({ children }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AntdThemedApp>{children}</AntdThemedApp>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
