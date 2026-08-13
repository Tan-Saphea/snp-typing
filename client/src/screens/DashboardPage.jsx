import { useCallback, useEffect, useState } from "react";
import {
  LuArrowRight,
  LuCalendarDays,
  LuClock3,
  LuGauge,
  LuKeyboard,
  LuLanguages,
  LuPlay,
  LuSparkles,
  LuTarget,
  LuTrophy,
  LuTrendingUp,
} from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { curriculumLevels } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";
import { useAuthStore } from "../stores/authStore.js";

function formatPracticeTime(seconds) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function StatCard({ accent, icon: Icon, label, note, value }) {
  return (
    <article className="snp-card snp-stat-card flex min-w-0 items-center gap-4 p-4 sm:p-5">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-slate-900 text-xl shadow-[0_3px_0_0_#cbd5e1] ${accent}`}>
        <Icon aria-hidden="true" size={24} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <div className="mt-1 flex items-end gap-2">
          <p className="text-2xl font-black tracking-[-0.04em] text-ink">{value}</p>
          {note && <span className="mb-1 hidden text-[11px] font-bold text-slate-400 2xl:inline">{note}</span>}
        </div>
      </div>
    </article>
  );
}

function LearningCard({ language, summary }) {
  const isKhmer = language === "km";
  const levelNumber = summary.continueLesson?.level ?? 1;
  const level = curriculumLevels[language].find((item) => item.level === levelNumber);
  const Icon = isKhmer ? LuLanguages : LuKeyboard;

  return (
    <article className={`group rounded-2xl border-2 p-5 transition-all duration-150 hover:-translate-y-0.5 ${
      isKhmer 
        ? "border-violet-900 bg-violet-50 text-violet-900 shadow-[0_5px_0_0_#c4b5fd]" 
        : "border-sky-900 bg-sky-50 text-sky-900 shadow-[0_5px_0_0_#7dd3fc]"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold opacity-75">{isKhmer ? "Khmer Typing" : "English Typing"}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-black sm:text-xl">Level {levelNumber} — {level?.title}</h3>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_0_rgba(15,23,42,0.25)] ${
          isKhmer ? "bg-violet-600 text-white" : "bg-sky-600 text-white"
        }`}>
          <Icon aria-hidden="true" size={21} />
        </span>
      </div>
      <div className="mt-5">
        <ProgressBar color={isKhmer ? "bg-violet-600" : "bg-sky-600"} value={summary.percent} />
      </div>
      <Link 
        className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-black text-white transition-all duration-100 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
          isKhmer 
            ? "border-violet-800 bg-violet-600 shadow-[0_3px_0_0_#5b21b6]" 
            : "border-sky-800 bg-sky-600 shadow-[0_3px_0_0_#0369a1]"
        }`}
        to={summary.continueLesson ? `/lessons/${summary.continueLesson.id}` : `/${isKhmer ? "khmer" : "english"}`}
      >
        <LuPlay fill="currentColor" size={16} />
        {summary.continueLesson ? "Continue lesson" : "View lessons"}
        <LuArrowRight className="ml-auto" />
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, progress: null, error: "" });
  const [showWelcome, setShowWelcome] = useState(false);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, progress: await getMyProgress(), error: "" }); }
    catch (error) { setState({ loading: false, progress: null, error: getApiErrorMessage(error) }); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (user && sessionStorage.getItem("snp-just-logged-in") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("snp-just-logged-in");
    }
  }, [user]);

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="snp-modal-card w-full max-w-md p-7 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-900 bg-emerald-200 text-3xl text-emerald-900 shadow-[0_4px_0_0_#34d399]">
            👋
          </div>
          <h2 className="mt-5 text-2xl font-black text-ink">Welcome back, {user?.firstName || user?.username}!</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ready to improve your typing speed today? Confident typing in English and Khmer starts with one key at a time.
          </p>
          <div className="mt-6">
            <button
              className="snp-button-primary w-full py-3 text-base flex justify-center items-center gap-2"
              onClick={() => setShowWelcome(false)}
              type="button"
            >
              <LuSparkles /> Let's Practice!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.loading) return <PageLoader message="Preparing your dashboard…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const challengeLesson = progress.languages.en.continueLesson ?? progress.languages.km.continueLesson;
  const maxMinutes = Math.max(...progress.weekly.map((day) => day.minutes), 1);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <section className="snp-dashboard-hero relative overflow-hidden p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[44px] border-primary-400/20" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              <LuSparkles />Student Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              Hello, {user?.firstName || user?.username}!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Ready to improve your typing today? Continue a lesson and keep your learning streak moving.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-2xl border-2 border-white/20 bg-white px-4 py-3 text-slate-900 shadow-[0_5px_0_0_#34d399]">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300 bg-amber-100 text-amber-700">
              <LuTrophy size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stars earned</p>
              <p className="text-xl font-black text-ink">{progress.stats.stars}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent="bg-sky-100 text-sky-700" icon={LuClock3} label="Typing Time" note="total practice" value={formatPracticeTime(progress.stats.totalPracticeSeconds)} />
        <StatCard accent="bg-emerald-100 text-emerald-700" icon={LuGauge} label="English WPM" note="personal best" value={Math.round(progress.stats.bestWpm)} />
        <StatCard accent="bg-violet-100 text-violet-700" icon={LuKeyboard} label="Khmer CPM" note="personal best" value={Math.round(progress.stats.bestCpm)} />
        <StatCard accent="bg-amber-100 text-amber-700" icon={LuTarget} label="Accuracy" note="average" value={`${Math.round(progress.stats.averageAccuracy)}%`} />
      </section>

      {/* Main Track Selection & Today's Challenge */}
      <section className="grid items-stretch gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">Continue Learning</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Pick up where you left off</h2>
            </div>
            <Link className="inline-flex items-center gap-1 text-sm font-black text-primary-700 hover:underline" to="/english">
              All levels <LuArrowRight />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <LearningCard language="en" summary={progress.languages.en} />
            <LearningCard language="km" summary={progress.languages.km} />
          </div>
        </div>
        
        {/* Today's Challenge */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-violet-600 p-6 text-white shadow-[0_6px_0_0_#172033]">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-fuchsia-300/25 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-violet-100">
              <LuTarget />Today’s Challenge
            </span>
            <h2 className="mt-5 text-2xl font-black sm:text-3xl">Accuracy Challenge</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-violet-100">
              {challengeLesson ? `Complete “${challengeLesson.title}” with 90% accuracy.` : "Choose your first lesson and begin learning."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">+30 points</span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                <LuTrophy />Star reward
              </span>
            </div>
            {challengeLesson ? (
              <Link className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-5 py-3 font-black text-slate-900 shadow-[0_4px_0_0_#0f172a] transition-all duration-100 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none" to={`/lessons/${challengeLesson.id}`}>
                <LuPlay fill="currentColor" />Start Challenge
              </Link>
            ) : (
              <Link className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-5 py-3 font-black text-slate-900 shadow-[0_4px_0_0_#0f172a] transition-all duration-100 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none" to="/english">
                <LuKeyboard />Choose a lesson
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Recent Activity & Chart Cards */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="snp-card min-w-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Latest activity</p>
              <h2 className="mt-1 text-xl font-black">Recent Lessons</h2>
            </div>
            <Link className="inline-flex items-center gap-1 text-sm font-black text-primary-700 hover:underline" to="/progress">
              View progress <LuArrowRight />
            </Link>
          </div>
          {progress.recent.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {progress.recent.slice(0, 4).map((item) => (
                <div className="flex items-center gap-3 py-4 sm:gap-4" key={item.id}>
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_0_#cbd5e1] ${
                    item.lesson?.language === "km" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                  }`}>
                    {item.lesson?.language === "km" ? <LuLanguages /> : <LuKeyboard />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-ink">{item.lesson?.title || "Archived lesson"}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-slate-500">
                      <LuCalendarDays className="shrink-0" />
                      {new Date(item.completedAt).toLocaleDateString()} · {item.lesson?.language === "km" ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Stars count={item.stars} />
                    <p className="mt-1 text-xs font-bold text-slate-500">{Math.round(item.accuracy)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
              Complete your first lesson to see it here.
            </p>
          )}
        </div>
        
        <div className="snp-card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Last 7 days</p>
              <h2 className="mt-1 text-xl font-black">Weekly Progress</h2>
              <p className="mt-1 text-sm text-slate-500">Practice minutes per day</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
              <LuTrendingUp />
            </span>
          </div>
          <div className="mt-7 flex h-48 items-end justify-between gap-2" role="img" aria-label="Weekly practice minutes bar chart">
            {progress.weekly.map((day) => (
              <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" key={day.date} title={`${day.label}: ${day.minutes} minutes`}>
                <span className="text-[10px] font-bold text-slate-500 sm:text-xs">{day.minutes || ""}</span>
                <div 
                  className="w-full max-w-10 rounded-t-xl border-2 border-slate-900 bg-emerald-400 transition-all" 
                  style={{ height: `${Math.max(day.minutes ? 12 : 4, (day.minutes / maxMinutes) * 130)}px` }} 
                />
                <span className="text-[10px] font-bold text-slate-500 sm:text-xs">{day.label.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
