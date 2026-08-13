"use client";

import RoleGuard from "@/components/RoleGuard.jsx";

export default function StaffLayout({ children }) {
  return <RoleGuard allow={["admin", "teacher"]}>{children}</RoleGuard>;
}
