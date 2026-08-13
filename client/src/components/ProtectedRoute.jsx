"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import FullPageLoader from "./FullPageLoader.jsx";
import { useAuthStore } from "../stores/authStore.js";

export default function ProtectedRoute({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`/login${next}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return <FullPageLoader message="Returning to sign in…" />;
  }

  return children;
}
