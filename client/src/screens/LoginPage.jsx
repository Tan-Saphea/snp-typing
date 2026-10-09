import { useEffect, useState } from "react";
import { Alert, Button, Dropdown, Form, Input } from "antd";
import { LuCheck, LuLock, LuMonitor, LuMoon, LuSun, LuUser } from "react-icons/lu";
import { useSearchParams } from "next/navigation";

import { Link, Navigate, useNavigate } from "../components/NextRouter.jsx";
import { apiConfigurationError } from "../services/api.js";
import { useAuthStore } from "../stores/authStore.js";
import { useTheme } from "../theme/ThemeContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);

  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedDestination = searchParams.get("next");
  const destination =
    requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//")
      ? requestedDestination
      : "/";

  useEffect(() => clearError, [clearError]);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function handleSubmit(values) {
    setIsSubmitting(true);
    const authenticated = await login(values);
    setIsSubmitting(false);
    if (authenticated) {
      sessionStorage.setItem("snp-just-logged-in", "true");
      navigate(destination, { replace: true });
    }
  }

  const { theme, resolvedTheme, systemDark, setTheme } = useTheme();

  const themeMenuItems = [
    {
      key: "light",
      label: (
        <div className="flex items-center justify-between gap-4 px-1 py-1 font-bold">
          <span className="flex items-center gap-2">
            <LuSun size={15} className="text-amber-500" />
            <span>Light Mode</span>
          </span>
          {theme === "light" && <LuCheck size={14} className="text-[#52c41a]" />}
        </div>
      ),
      onClick: () => setTheme("light"),
    },
    {
      key: "dark",
      label: (
        <div className="flex items-center justify-between gap-4 px-1 py-1 font-bold">
          <span className="flex items-center gap-2">
            <LuMoon size={15} className="text-indigo-400" />
            <span>Dark Mode</span>
          </span>
          {theme === "dark" && <LuCheck size={14} className="text-[#52c41a]" />}
        </div>
      ),
      onClick: () => setTheme("dark"),
    },
    {
      key: "system",
      label: (
        <div className="flex items-center justify-between gap-4 px-1 py-1 font-bold">
          <span className="flex items-center gap-2">
            <LuMonitor size={15} className="text-slate-400" />
            <span>System ({systemDark ? "Dark" : "Light"})</span>
          </span>
          {theme === "system" && <LuCheck size={14} className="text-[#52c41a]" />}
        </div>
      ),
      onClick: () => setTheme("system"),
    },
  ];

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <Dropdown menu={{ items: themeMenuItems }} trigger={["click"]} placement="bottomRight">
          <Button
            shape="circle"
            icon={
              resolvedTheme === "dark" ? (
                <LuMoon size={16} className="text-indigo-400" />
              ) : (
                <LuSun size={16} className="text-amber-500" />
              )
            }
            className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            aria-label="Toggle theme mode"
          />
        </Dropdown>
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="SNP Typing"
              className="h-20 w-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0">
              Sign In
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
              Enter your credentials to continue to SNP Typing
            </p>
          </div>

          {apiConfigurationError && (
            <Alert
              title="Configuration Error"
              description={apiConfigurationError}
              type="warning"
              showIcon
              className="mb-5 rounded-lg"
            />
          )}

          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              className="mb-5 rounded-lg"
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={() => error && clearError()}
            requiredMark={false}
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter your username" }]}
            >
              <Input
                prefix={<LuUser className="text-slate-400 mr-1" />}
                placeholder="Username"
                size="large"
                autoComplete="username"
                autoCapitalize="none"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LuLock className="text-slate-400 mr-1" />}
                placeholder="Password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mt-2 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSubmitting}
                disabled={Boolean(apiConfigurationError)}
                className="w-full font-semibold h-11"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <p className="m-0 text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-[#52c41a] hover:underline"
              >
                Create Account
              </Link>
            </p>
            <p className="m-0 text-xs">
              <Link
                to="/forgot-password"
                className="text-slate-500 hover:text-[#52c41a] dark:text-slate-400 dark:hover:text-emerald-400"
              >
                Forgot your username or password? (ភ្លេចឈ្មោះ ឬលេខសម្ងាត់?)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
