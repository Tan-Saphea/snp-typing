"use client";

import { useEffect } from "react";

import AppErrorBoundary from "@/app/AppErrorBoundary.jsx";
import FullPageLoader from "@/components/FullPageLoader.jsx";
import { useAuthStore } from "@/stores/authStore.js";

export default function ClientProviders({ children }) {
  const initialize = useAuthStore((state) => state.initialize);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <AppErrorBoundary>
      {status === "idle" || status === "restoring"
        ? <FullPageLoader message="Opening your learning space…" />
        : children}
    </AppErrorBoundary>
  );
}
