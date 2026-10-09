import { useEffect, useState } from "react";
import { Alert, Button, Dropdown, Form, Input } from "antd";
import { LuCheck, LuLock, LuMonitor, LuMoon, LuSun, LuUser } from "react-icons/lu";

import { Link, Navigate, useNavigate } from "../components/NextRouter.jsx";
import { apiConfigurationError } from "../services/api.js";
import { useAuthStore } from "../stores/authStore.js";
import { useTheme } from "../theme/ThemeContext.jsx";

const usernamePattern = /^[a-z0-9._-]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);

  const [form] = Form.useForm();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => clearError, [clearError]);

  if (status === "authenticated") return <Navigate to="/" replace />;

  function handleNameChange(e) {
    const val = e.target.value;
    const currentUsername = form.getFieldValue("username");
    // If username hasn't been manually typed yet, auto-suggest from name
    if (!currentUsername && val) {
      // Convert English characters to clean username; if Khmer, keep blank for user to choose
      const sanitized = val
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9._-]/g, "");
      if (sanitized && sanitized.length >= 3) {
        form.setFieldsValue({ username: sanitized });
      }
    }
  }

  async function handleSubmit(values) {
    setFormError("");
    clearError();

    const username = values.username.trim().toLowerCase();
    if (values.password.length < 6) {
      setFormError("Password must be at least 6 characters (យ៉ាងតិច ៦ ខ្ទង់).");
      return;
    }

    const recoveryKey = (values.securityAnswer || "").trim();
    if (
      recoveryKey !== "Admin.snpis@2013" &&
      recoveryKey.toLowerCase() !== "admin.snpis@2013"
    ) {
      setFormError(
        "Recovery Key មិនត្រឹមត្រូវទេ! សូមទាក់ទងលោកគ្រូ ឬអ្នកគ្រូ។ (Invalid Recovery Key. Please contact your instructor.)",
      );
      return;
    }

    setIsSubmitting(true);
    const registration = {
      name: values.name.trim(),
      username,
      password: values.password,
      securityQuestion: "Recovery Key",
      securityAnswer: recoveryKey,
    };

    const registered = await register(registration);
    setIsSubmitting(false);

    if (registered) {
      sessionStorage.setItem("snp-just-logged-in", "true");
      navigate("/", { replace: true });
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
              Create Account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
              ចុះឈ្មោះគណនីថ្មី ដើម្បីចាប់ផ្តើមរៀនវាយអក្សរ
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

          {(formError || error) && (
            <Alert
              title={formError || error}
              type="error"
              showIcon
              closable
              onClose={() => {
                setFormError("");
                clearError();
              }}
              className="mb-5 rounded-lg"
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            {/* 1. Full Name */}
            <Form.Item
              label={<span className="font-semibold text-slate-700 dark:text-slate-300">Full Name (ឈ្មោះរបស់អ្នក)</span>}
              name="name"
              rules={[{ required: true, message: "Please enter your name (សូមបញ្ចូលឈ្មោះរបស់អ្នក)" }]}
            >
              <Input
                placeholder="ឧ. សុវណ្ណ គឹម ឬ Sovann Kim"
                size="large"
                onChange={handleNameChange}
              />
            </Form.Item>

            {/* 2. Username */}
            <Form.Item
              label={<span className="font-semibold text-slate-700 dark:text-slate-300">Username (ឈ្មោះគណនី)</span>}
              name="username"
              rules={[
                { required: true, message: "Please enter a username" },
                { min: 3, message: "Username must be at least 3 characters" },
                {
                  pattern: usernamePattern,
                  message: "Use lowercase letters, numbers, dots, or hyphens (ឧ. sovann)",
                },
              ]}
              extra={
                <span className="text-xs text-slate-400">
                  ប្រើអក្សរតូច ឬលេខ សម្រាប់ Login (ឧ. sovann)
                </span>
              }
            >
              <Input
                prefix={<LuUser className="text-slate-400 mr-1" />}
                placeholder="sovann"
                size="large"
                autoCapitalize="none"
              />
            </Form.Item>

            {/* 3. Password */}
            <Form.Item
              label={<span className="font-semibold text-slate-700 dark:text-slate-300">Password (លេខសម្ងាត់)</span>}
              name="password"
              rules={[
                { required: true, message: "Please enter a password" },
                { min: 6, message: "Password must be at least 6 characters (យ៉ាងតិច ៦ ខ្ទង់)" },
              ]}
            >
              <Input.Password
                prefix={<LuLock className="text-slate-400 mr-1" />}
                placeholder="យ៉ាងតិច ៦ ខ្ទង់ (At least 6 characters)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-slate-700 dark:text-slate-300">Recovery Key (ពាក្យគន្លឹះបង្កើត និងសង្គ្រោះគណនី)</span>}
              name="securityAnswer"
              rules={[
                { required: true, message: "Please enter the recovery key (សូមបញ្ចូលពាក្យគន្លឹះ)" },
                {
                  validator: (_, value) => {
                    const key = (value || "").trim();
                    if (!key || key === "Admin.snpis@2013" || key.toLowerCase() === "admin.snpis@2013") {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Recovery Key មិនត្រឹមត្រូវទេ! សូមទាក់ទងលោកគ្រូ ឬអ្នកគ្រូ។")
                    );
                  },
                },
              ]}
              extra={
                <span className="text-xs text-slate-400">
                  សូមសួរលោកគ្រូ ឬអ្នកគ្រូ ដើម្បីទទួលបាន Recovery Key សម្រាប់បង្កើតគណនី និងសង្គ្រោះលេខសម្ងាត់។
                </span>
              }
            >
              <Input.Password
                prefix={<LuLock className="text-slate-400 mr-1" />}
                placeholder="បញ្ចូល Recovery Key (ផ្ដល់ដោយលោកគ្រូ/អ្នកគ្រូ)"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="mt-4 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSubmitting}
                disabled={Boolean(apiConfigurationError)}
                className="w-full font-semibold h-11 text-base"
              >
                Create Account (ចុះឈ្មោះ)
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="m-0 text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#52c41a] hover:underline"
              >
                Sign In (ចូលប្រើ)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
