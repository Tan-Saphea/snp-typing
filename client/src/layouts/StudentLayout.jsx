import { useEffect, useMemo, useState } from "react";
import {
  LuBell,
  LuBookOpen,
  LuChartBar,
  LuChevronRight,
  LuClipboardCheck,
  LuDumbbell,
  LuFileText,
  LuGamepad2,
  LuInfo,
  LuKeyboard,
  LuLanguages,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMonitor,
  LuSchool,
  LuSettings,
  LuSparkles,
  LuTimer,
  LuTrophy,
  LuUser,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { NavLink, useLocation, useNavigate } from "../components/NextRouter.jsx";

import Brand from "../components/Brand.jsx";
import { useAuthStore } from "../stores/authStore.js";

const studentNavigation = [
  { to: "/", icon: LuLayoutDashboard, label: "Dashboard" },
  { to: "/english", icon: LuKeyboard, label: "English Typing" },
  { to: "/khmer", icon: LuLanguages, label: "Khmer Typing" },
  { to: "/practice", icon: LuDumbbell, label: "Practice" },
  { to: "/typing-test", icon: LuTimer, label: "Typing Test" },
  { to: "/games", icon: LuGamepad2, label: "Typing Games" },
  { to: "/computer-skills", icon: LuMonitor, label: "Computer Skills" },
  { to: "/progress", icon: LuChartBar, label: "My Progress" },
  { to: "/leaderboard", icon: LuTrophy, label: "Leaderboard" },
];

const staffNavigation = [
  { to: "/", icon: LuLayoutDashboard, label: "Teacher Dashboard" },
  { to: "/students", icon: LuUsers, label: "Students" },
  { to: "/classes", icon: LuSchool, label: "Classes" },
  { to: "/lesson-manager", icon: LuBookOpen, label: "Lessons" },
  { to: "/assignments", icon: LuClipboardCheck, label: "Assignments" },
  { to: "/reports", icon: LuFileText, label: "Reports" },
  { to: "/english", icon: LuKeyboard, label: "English Curriculum" },
  { to: "/khmer", icon: LuLanguages, label: "Khmer Curriculum" },
  { to: "/leaderboard", icon: LuTrophy, label: "Leaderboard" },
];

const bottomNavigation = [
  { to: "/settings", icon: LuSettings, label: "Settings" },
];

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      className={({ isActive }) => `snp-nav-key group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-all ${isActive ? "snp-nav-key-active" : "text-slate-600 hover:text-primary-700"}`}
      end={item.to === "/"}
      onClick={onNavigate}
      to={item.to}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 transition group-hover:scale-105" aria-hidden="true"><Icon size={19} strokeWidth={2.2} /></span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <LuChevronRight className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" size={15} />
    </NavLink>
  );
}

function Sidebar({ mainNavigation, onClose, onLogout, onShowAbout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[88px] items-center justify-between border-b border-white/10 px-5"><Brand inverse /><button className="snp-sidebar-close lg:hidden" aria-label="Close menu" onClick={onClose} type="button"><LuX size={21} /></button></div>
      <div className="px-5 pb-2 pt-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Workspace</p></div>
      <nav className="snp-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {mainNavigation.map((item) => <SidebarLink item={item} key={item.to} onNavigate={onClose} />)}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        {bottomNavigation.map((item) => <SidebarLink item={item} key={item.to} onNavigate={onClose} />)}
        <button className="snp-nav-key group flex min-h-11 w-full items-center gap-3 px-3 py-2 text-sm font-bold text-slate-400 transition" onClick={() => { onClose(); onShowAbout(); }} type="button"><span className="grid h-8 w-8 place-items-center rounded-xl" aria-hidden="true"><LuInfo size={19} /></span>About Creator</button>
        <button className="snp-nav-key group flex min-h-11 w-full items-center gap-3 px-3 py-2 text-sm font-bold text-rose-300 transition" onClick={onLogout} type="button"><span className="grid h-8 w-8 place-items-center rounded-xl" aria-hidden="true"><LuLogOut size={19} /></span>Sign out</button>
      </div>
    </div>
  );
}

export default function StudentLayout({ children }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username;
  const isStaff = user?.role === "admin" || user?.role === "teacher";
  const mainNavigation = isStaff ? staffNavigation : studentNavigation;
  const currentLabel = useMemo(() => {
    const items = [...mainNavigation, ...bottomNavigation];
    return items.find((item) => item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to))?.label ?? (location.pathname.startsWith("/lessons/") ? "Typing Lesson" : "SNP Typing");
  }, [location.pathname, mainNavigation]);

  useEffect(() => {
    try {
      const local = JSON.parse(window.localStorage.getItem("snp-student-settings")) || {};
      const fontSize = user?.preferences?.fontSize ?? (local.largeText ? "large" : "normal");
      const theme = user?.preferences?.theme ?? local.theme ?? "light";
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("snp-large-text", fontSize === "large");
      document.documentElement.classList.toggle("snp-dark", theme === "dark" || (theme === "system" && prefersDark));
    } catch {
      document.documentElement.classList.remove("snp-large-text", "snp-dark");
    }
  }, [user?.preferences?.fontSize, user?.preferences?.theme]);

  useEffect(() => { setSidebarOpen(false); setShowNotifications(false); }, [location.pathname]);
  useEffect(() => {
    function closeOnEscape(event) { if (event.key === "Escape") setSidebarOpen(false); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="snp-app-canvas min-h-screen text-ink">
      <a className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-xl bg-primary-700 px-4 py-2 font-bold text-white transition focus:translate-y-0" href="#main-content">Skip to content</a>
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} type="button" />}
      <aside className={`snp-sidebar fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-200 lg:z-30 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}><Sidebar mainNavigation={mainNavigation} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} onShowAbout={() => setShowAbout(true)} /></aside>

      <div className="min-h-screen lg:ml-[280px]">
        <header className="snp-topbar sticky top-0 z-30 flex h-[80px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><button className="snp-icon-button lg:hidden" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} type="button"><LuMenu size={22} /></button><div className="min-w-0"><p className="truncate text-base font-black tracking-tight text-ink sm:text-lg">{currentLabel}</p><p className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 sm:flex"><LuSparkles className="text-primary-500" /> Learn accurately. Grow confidently.</p></div></div>
          <div className="relative flex items-center gap-2 sm:gap-3">
            <button className="snp-icon-button relative" aria-expanded={showNotifications} aria-label="Notifications" onClick={() => setShowNotifications((value) => !value)} type="button"><LuBell size={20} /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>
            {showNotifications && <div className="snp-popover absolute right-0 top-14 w-[min(21rem,calc(100vw-2rem))] p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 bg-amber-200 text-amber-800 shadow-[0_2px_0_0_#0f172a]"><LuSparkles /></span><div><p className="font-black text-ink">Today’s reminder</p><p className="mt-1 text-sm leading-6 text-slate-600">Complete one lesson to keep your learning streak active.</p></div></div></div>}
            <NavLink className="snp-user-chip" to="/settings" aria-label="Open settings">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 font-black ${
                user?.gender === "male" ? "bg-sky-200 text-sky-900" :
                user?.gender === "female" ? "bg-rose-200 text-rose-900" :
                "bg-emerald-400 text-emerald-950"
              }`}>
                {user?.gender === "male" ? <span className="text-[17px]">♂️</span> : user?.gender === "female" ? <span className="text-[17px]">♀️</span> : <LuUser size={19} strokeWidth={2.5} />}
              </span>
              <span className="hidden min-w-0 text-left sm:block"><span className="block max-w-36 truncate text-sm font-black text-ink">{displayName}</span><span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{user?.role}</span></span>
            </NavLink>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8" id="main-content" tabIndex="-1">{children}</main>
      </div>

      {showAbout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="snp-modal-card relative w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 active:translate-y-[1px] font-black" onClick={() => setShowAbout(false)} type="button">×</button>
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-3xl border-2 border-slate-900 bg-slate-100 shadow-[0_5px_0_0_#334155]">
              <img src="/creator.jpg" alt="Tan Saphea" className="h-full w-full object-cover" />
            </div>
            <h2 className="mt-4 text-2xl font-black text-ink">Tan Saphea (តាន់ សាភា)</h2>
            <div className="mt-5 space-y-2.5 text-left">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
                💼 <b>Role:</b> Computer management & digital marketing at snpis
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
                🚀 <b>Founder:</b> Phumcode Academy
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-bold leading-relaxed">
                💻 ជាអ្នកបង្កើតកម្មវិធីនេះឡើង (Creator & Developer)
              </div>
            </div>
            <button className="snp-button-primary mt-6 w-full py-2.5 text-sm" onClick={() => setShowAbout(false)} type="button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
