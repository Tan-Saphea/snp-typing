"use client";

import DashboardPage from "@/screens/DashboardPage.jsx";
import TeacherDashboardPage from "@/screens/TeacherDashboardPage.jsx";
import { useAuthStore } from "@/stores/authStore.js";

export default function RoleHome() {
  const role = useAuthStore((state) => state.user?.role);
  return role === "admin" || role === "teacher"
    ? <TeacherDashboardPage />
    : <DashboardPage />;
}
