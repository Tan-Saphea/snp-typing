import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Dropdown,
  Layout,
  Modal,
  Popover,
  Tooltip,
  Typography,
} from "antd";
import {
  LuBell,
  LuBriefcase,
  LuChartBar,
  LuCheck,
  LuCode,
  LuDumbbell,
  LuFileText,
  LuGamepad2,
  LuInfo,
  LuKeyboard,
  LuLanguages,
  LuLaptop,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMonitor,
  LuMoon,
  LuRocket,
  LuSettings,
  LuSparkles,
  LuSun,
  LuTimer,
  LuTrophy,
  LuUser,
} from "react-icons/lu";

import Brand from "../components/Brand.jsx";
import { useLocation, useNavigate } from "../components/NextRouter.jsx";
import { useAuthStore } from "../stores/authStore.js";
import { useTheme } from "../theme/ThemeContext.jsx";

const { Header, Sider, Content } = Layout;

const navigationGroups = [
  {
    title: "Learning Tracks",
    items: [
      { key: "/", icon: LuLayoutDashboard, label: "Dashboard", badge: "Hub" },
      { key: "/english", icon: LuKeyboard, label: "English Typing", badge: "EN" },
      { key: "/khmer", icon: LuLanguages, label: "Khmer Typing", badge: "ខ្មែរ" },
      { key: "/computer-skills", icon: LuMonitor, label: "Computer Skills" },
    ],
  },
  {
    title: "Practice & Challenges",
    items: [
      { key: "/practice", icon: LuDumbbell, label: "Practice Mode" },
      { key: "/typing-test", icon: LuTimer, label: "Speed Test" },
      { key: "/games", icon: LuGamepad2, label: "Typing Games" },
    ],
  },
  {
    title: "Performance & Stats",
    items: [
      { key: "/progress", icon: LuChartBar, label: "My Progress" },
      { key: "/report", icon: LuFileText, label: "A4 Report" },
      { key: "/leaderboard", icon: LuTrophy, label: "Leaderboard" },
    ],
  },
];

const allNavItems = navigationGroups.flatMap((group) => group.items);

export default function StudentLayout({ children }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const { theme, resolvedTheme, systemDark, setTheme } = useTheme();

  const themeMenuItems = useMemo(
    () => [
      {
        key: "light",
        label: (
          <div className="flex items-center justify-between gap-4 px-1 py-1 font-bold">
            <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LuSun size={16} className="text-amber-500" />
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
            <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LuMoon size={16} className="text-indigo-400" />
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
            <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <LuMonitor size={16} className="text-slate-400" />
              <span>System ({systemDark ? "Dark" : "Light"})</span>
            </span>
            {theme === "system" && <LuCheck size={14} className="text-[#52c41a]" />}
          </div>
        ),
        onClick: () => setTheme("system"),
      },
    ],
    [theme, systemDark, setTheme]
  );

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Learner";

  const currentKey = useMemo(() => {
    if (location.pathname === "/") return "/";
    const found = allNavItems.find(
      (item) => item.key !== "/" && location.pathname.startsWith(item.key)
    );
    if (found) return found.key;
    if (location.pathname.startsWith("/settings")) return "/settings";
    return location.pathname;
  }, [location.pathname]);

  const currentLabel = useMemo(() => {
    const found = allNavItems.find(
      (item) => item.key === "/" ? location.pathname === "/" : location.pathname.startsWith(item.key)
    );
    if (found) return found.label;
    if (location.pathname.startsWith("/settings")) return "Settings";
    if (location.pathname.startsWith("/lessons/")) return "Typing Lesson";
    return "SNP Typing";
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleNavigate(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white select-none border-r border-slate-200/80 dark:border-slate-800">
      {/* Top Header & Brand */}
      <div className="flex flex-col">
        <div className="flex h-[72px] items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-1.5 flex items-center justify-center shadow-sm">
              <img
                src="/logo.png"
                alt="SNP Typing"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  SNP Typing
                </span>
                <span className="rounded-full bg-[#52c41a]/15 px-2 py-0.5 text-[9px] font-black uppercase text-[#52c41a] border border-[#52c41a]/20">
                  PRO
                </span>
              </div>
              <p className="m-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                Educational Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Group Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-sidebar-scroll">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentKey === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigate(item.key)}
                      type="button"
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 text-left cursor-pointer ${
                        isActive
                          ? "bg-[#52c41a] text-white shadow-md shadow-emerald-500/25 font-bold scale-[1.01]"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex items-center justify-center ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile & Developer Showcase Card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] space-y-2.5">
        {/* Developer Showcase Card */}
        <div
          onClick={() => setShowAbout(true)}
          className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                <LuCode size={16} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#52c41a] ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0 text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition whitespace-nowrap block truncate">
                Creator & Developer
              </span>
              <p className="m-0 text-[10px] font-medium text-slate-400 truncate">
                Click to view profile
              </p>
            </div>
          </div>
          <LuInfo className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition" size={16} />
        </div>

        {/* User Mini Profile & Quick Actions */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          {/* User Profile */}
          <div
            onClick={() => handleNavigate("/settings")}
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
            role="button"
            tabIndex={0}
          >
            <Avatar
              size={28}
              className={`font-black shrink-0 text-xs ${
                user?.gender === "male"
                  ? "bg-sky-500 text-white"
                  : user?.gender === "female"
                  ? "bg-rose-500 text-white"
                  : "bg-[#52c41a] text-white"
              }`}
            >
              {user?.firstName?.slice(0, 1)?.toUpperCase() || <LuUser size={14} />}
            </Avatar>
            <div className="min-w-0">
              <p className="m-0 truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                {displayName}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip title="Settings">
              <Button
                type="text"
                shape="circle"
                icon={<LuSettings size={15} />}
                onClick={() => handleNavigate("/settings")}
                className={`flex items-center justify-center h-7 w-7 p-0 ${
                  currentKey === "/settings"
                    ? "text-[#52c41a] bg-emerald-500/10"
                    : "text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              />
            </Tooltip>
            <Tooltip title="Sign Out">
              <Button
                type="text"
                shape="circle"
                icon={<LuLogOut size={15} />}
                onClick={handleLogout}
                className="flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 w-7 p-0"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );

  const notificationContent = (
    <div className="max-w-xs p-2">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-[#fa8c16]">
          <LuSparkles size={20} />
        </div>
        <div>
          <p className="m-0 font-bold text-slate-900 dark:text-white">Daily streak</p>
          <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
            Complete at least one lesson today to keep your streak glowing!
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
      {/* Desktop Sider */}
      <Sider
        width={264}
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 overflow-auto bg-white dark:bg-[#0f172a] shadow-sm border-r border-slate-200/80 dark:border-slate-800"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          background: "transparent",
        }}
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
        styles={{ body: { padding: 0 } }}
        size={280}
        className="lg:hidden"
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Layout className="lg:ml-[264px] min-h-screen flex flex-col bg-transparent">
        <Header
          className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"
          style={{
            height: "70px",
            lineHeight: "normal",
            padding: "0 24px",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="text"
              icon={<LuMenu size={20} />}
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center p-0 h-10 w-10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            />
            <div className="min-w-0 flex flex-col justify-center">
              <h2 className="m-0 truncate text-lg font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                {currentLabel}
              </h2>
              <p className="m-0 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 leading-normal">
                <LuSparkles className="text-[#52c41a]" />
                <span>Learn accurately. Grow confidently.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Mode Switcher */}
            <Dropdown menu={{ items: themeMenuItems }} trigger={["click"]} placement="bottomRight">
              <Tooltip
                title={
                  theme === "system"
                    ? `Theme: System (${systemDark ? "Dark" : "Light"})`
                    : theme === "dark"
                    ? "Theme: Dark Mode"
                    : "Theme: Light Mode"
                }
              >
                <Button
                  shape="circle"
                  icon={
                    resolvedTheme === "dark" ? (
                      <LuMoon size={18} className="text-indigo-400" />
                    ) : (
                      <LuSun size={18} className="text-amber-500" />
                    )
                  }
                  className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white h-10 w-10 p-0"
                  aria-label="Toggle theme mode"
                />
              </Tooltip>
            </Dropdown>

            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
            >
              <Badge dot color="#fa8c16" offset={[-2, 6]}>
                <Button
                  shape="circle"
                  icon={<LuBell size={18} />}
                  className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white h-10 w-10 p-0"
                  aria-label="Notifications"
                />
              </Badge>
            </Popover>

            <div
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 pr-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition select-none"
              role="button"
              tabIndex={0}
            >
              <Avatar
                size={34}
                className={`font-black flex-shrink-0 flex items-center justify-center ${
                  user?.gender === "male"
                    ? "bg-sky-500 text-white"
                    : user?.gender === "female"
                    ? "bg-rose-500 text-white"
                    : "bg-[#52c41a] text-white"
                }`}
              >
                {user?.firstName?.slice(0, 1)?.toUpperCase() || <LuUser size={16} />}
              </Avatar>
              <div className="hidden sm:flex flex-col justify-center text-left">
                <p className="m-0 max-w-[140px] truncate text-xs font-black text-slate-900 dark:text-white leading-tight">
                  {displayName}
                </p>
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                  Learner
                </p>
              </div>
            </div>
          </div>
        </Header>

        <Content className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto" id="main-content">
          {children}
        </Content>
      </Layout>

      {/* About Creator Modal */}
      <Modal
        open={showAbout}
        onCancel={() => setShowAbout(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setShowAbout(false)}
            className="w-full font-bold h-11 text-sm rounded-xl"
          >
            បិទ (Close)
          </Button>,
        ]}
        centered
        width={640}
      >
        <div className="text-center pt-2">
          <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-3 border-[#52c41a] shadow-xl mb-4 bg-slate-100 dark:bg-slate-800 ring-4 ring-emerald-50 dark:ring-emerald-950/40">
            <img
              src="/creator.jpg"
              alt="Tan Saphea (តាន់ សាភា)"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="m-0 text-2xl font-black text-slate-900 dark:text-white">
            តាន់ សាភា
          </h2>
          <p className="m-0 mt-0.5 text-sm font-normal text-slate-500 dark:text-slate-400">
            Tan Saphea
          </p>

          <Divider className="my-4 border-slate-200/80 dark:border-slate-700/80" />

          <div className="mt-5 space-y-2.5 text-left text-sm">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50 dark:bg-slate-800/80 p-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <LuBriefcase size={16} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="m-0 text-xs sm:text-sm font-bold text-slate-900 dark:text-white sm:whitespace-nowrap">
                  ការងារ៖ ប្រធានផ្នែកព័ត៌មានវិទ្យា និងទីផ្សារឌីជីថល នៅសាលាអន្តរជាតិ អេស អ៊ិន ភី
                </p>
                <p className="m-0 text-[11px] sm:text-xs font-light text-slate-500 dark:text-slate-400 sm:whitespace-nowrap">
                  Work: Computer Management & Digital Marketing at SNP International School
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50 dark:bg-slate-800/80 p-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <LuRocket size={16} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="m-0 text-xs sm:text-sm font-bold text-slate-900 dark:text-white sm:whitespace-nowrap">
                  ស្ថាបនិក៖ ភូមិកូដ (Phumcode Academy)
                </p>
                <p className="m-0 text-[11px] sm:text-xs font-light text-slate-500 dark:text-slate-400 sm:whitespace-nowrap">
                  Founder: Phumcode Academy
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <LuLaptop size={16} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="m-0 text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  ជាអ្នកបង្កើតកម្មវិធី SNP Typing នេះឡើង
                </p>
                <p className="m-0 text-[11px] sm:text-xs font-light text-emerald-700 dark:text-emerald-400">
                  Creator & Lead Developer of SNP Typing
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
