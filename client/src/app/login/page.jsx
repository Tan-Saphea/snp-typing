"use client";

import { Suspense } from "react";

import FullPageLoader from "@/components/FullPageLoader.jsx";
import LoginPage from "@/screens/LoginPage.jsx";

export default function LoginRoute() {
  return (
    <Suspense fallback={<FullPageLoader message="Opening sign in…" />}>
      <LoginPage />
    </Suspense>
  );
}
