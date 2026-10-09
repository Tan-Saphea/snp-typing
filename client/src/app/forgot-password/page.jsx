"use client";

import { Suspense } from "react";

import FullPageLoader from "@/components/FullPageLoader.jsx";
import ForgotPasswordPage from "@/screens/ForgotPasswordPage.jsx";

export default function ForgotPasswordRoute() {
  return (
    <Suspense fallback={<FullPageLoader message="Opening account recovery…" />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
