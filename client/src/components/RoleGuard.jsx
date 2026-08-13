"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import FullPageLoader from "./FullPageLoader.jsx";
import { useAuthStore } from "../stores/authStore.js";

export default function RoleGuard({ allow, children }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const isAllowed = allow.includes(role);

  useEffect(() => {
    if (!isAllowed) router.replace("/unauthorized");
  }, [isAllowed, router]);

  if (!isAllowed) {
    return <FullPageLoader message="Checking access…" />;
  }

  return children;
}
