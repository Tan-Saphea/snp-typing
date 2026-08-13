"use client";

import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import StudentLayout from "@/layouts/StudentLayout.jsx";

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <StudentLayout>{children}</StudentLayout>
    </ProtectedRoute>
  );
}
