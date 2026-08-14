import { useCallback, useEffect, useState } from "react";
import { LuArrowRight, LuBookOpenCheck, LuCalendarDays, LuClock3, LuFileText, LuFlame, LuGauge, LuKeyboard, LuLanguages, LuMedal, LuSparkles, LuStar, LuTarget, LuTimer, LuTrendingUp } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHero from "../components/PageHero.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";

function formatPracticeTime(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function LearningProgressCard({ language, summary }) {
  const khmer = language === "km";
  return (
    <article className="snp-card overflow-hidden">
      <div className={`h-2 ${khmer ? "bg-violet-500" : "bg-sky-500"}`} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className={`text-xs font-black uppercase tracking-[0.13em] ${khmer ? "text-violet-700" : "text-sky-700"}`}>{khmer ? "ខ្មែរ" : "English"}</p><h2 className="mt-1 text-xl font-black">{khmer ? "Khmer Typing" : "English Typing"}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{summary.completedLessons} of {summary.totalLessons} lessons completed</p></div>
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-slate-900 text-xl font-black shadow-[0_3px_0_0_#334155] ${khmer ? "bg-violet-200 text-violet-900" : "bg-sky-200 text-sky-900"}`}>{khmer ? "ក" : "A"}</span>
        </div>
        <div className="mt-6"><ProgressBar color={khmer ? "bg-violet-600" : "bg-sky-600"} label="Course progress" value={summary.percent} /></div>
        <Link className="snp-button-secondary mt-6 w-full" to={khmer ? "/khmer" : "/english"}>{khmer ? <LuLanguages /> : <LuKeyboard />}Open {khmer ? "Khmer" : "English"} lessons<LuArrowRight /></Link>
      </div>
    </article>
  );
}

function ResultRow({ item }) {
  const khmer = item.lesson?.language === "km";
  return (
    <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.5fr)_0.6fr_0.55fr_0.65fr] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 shadow-[0_2px_0_0_#334155] ${khmer ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>{khmer ? <LuLanguages /> : <LuKeyboard />}</span>
        <div className="min-w-0"><p className="truncate font-black">{item.lesson?.title || "Archived lesson"}</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-400"><LuCalendarDays />{new Date(item.completedAt).toLocaleDateString()}</p></div>
      </div>
      <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">Speed</p><p className="font-black text-slate-700">{khmer ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}</p></div>
      <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">Accuracy</p><p className="font-black text-emerald-700">{Math.round(item.accuracy)}%</p></div>
      <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">Stars</p><Stars count={item.stars} /></div>
    </div>
  );
}

export default function ProgressPage() {
  const [state, setState] = useState({ loading: true, progress: null, error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, progress: await getMyProgress(), error: "" }); }
    catch (error) { setState({ loading: false, progress: null, error: getApiErrorMessage(error) }); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (state.loading) return <PageLoader message="Calculating your progress…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const maxMinutes = Math.max(...progress.weekly.map((day) => day.minutes), 1);
  const totalWeekMinutes = progress.weekly.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <div className="space-y-6">
      <PageHero
        actions={<Link className="snp-button-primary" to="/report"><LuFileText />Open A4 report</Link>}
        badges={[
          { icon: LuFlame, label: `${progress.stats.dailyStreak} day streak` },
          { icon: LuStar, label: `${progress.stats.stars} stars earned` },
        ]}
        description="See the practice behind your progress, compare both keyboards, and choose the next skill to strengthen."
        eyebrow="Learning report"
        icon={LuTrendingUp}
        title="Your progress, one key at a time"
        tone="violet"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={LuBookOpenCheck} label="Lessons completed" note="70% accuracy or higher" tone="emerald" value={progress.stats.lessonsCompleted} />
        <MetricCard icon={LuGauge} label="Best English speed" note={`${Math.round(progress.stats.averageWpm)} WPM average`} tone="sky" value={`${Math.round(progress.stats.bestWpm)} WPM`} />
        <MetricCard icon={LuKeyboard} label="Best Khmer speed" note="Grapheme-aware score" tone="violet" value={`${Math.round(progress.stats.bestCpm)} CPM`} />
        <MetricCard icon={LuTarget} label="Average accuracy" note={`${Math.round(progress.stats.bestAccuracy)}% personal best`} tone="amber" value={`${Math.round(progress.stats.averageAccuracy)}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <article className="snp-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-primary-600">Last 7 days</p><h2 className="mt-1 text-2xl font-black">Practice rhythm</h2><p className="mt-1 text-sm font-semibold text-slate-500">{Math.round(totalWeekMinutes)} minutes practiced this week</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-900 bg-emerald-200 text-emerald-900 shadow-[0_3px_0_0_#10b981]"><LuTrendingUp /></span>
          </div>
          <div className="mt-7 flex h-56 items-end justify-between gap-2" role="img" aria-label="Practice minutes for the last seven days">
            {progress.weekly.map((day) => (
              <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" key={day.date} title={`${day.label}: ${day.minutes} minutes`}>
                <span className="text-[10px] font-black text-slate-500">{day.minutes || ""}</span>
                <div className="relative w-full max-w-12 overflow-hidden rounded-t-xl border-2 border-slate-900 bg-slate-100" style={{ height: `${Math.max(day.minutes ? 18 : 7, (day.minutes / maxMinutes) * 160)}px` }}><div className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-emerald-300" /></div>
                <span className="text-[10px] font-black uppercase text-slate-500 sm:text-xs">{day.label.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard icon={LuClock3} label="Total typing time" note="Across every activity" tone="sky" value={formatPracticeTime(progress.stats.totalPracticeSeconds)} />
          <MetricCard icon={LuTimer} label="Timed tests" note="Saved assessments" tone="rose" value={progress.stats.testsCompleted} />
          <MetricCard icon={LuFlame} label="Daily streak" note="Practice today to keep it" tone="amber" value={`${progress.stats.dailyStreak} days`} />
          <MetricCard icon={LuMedal} label="Current levels" note="Unlocked learning steps" tone="violet" value={`EN ${progress.stats.currentEnglishLevel} · KM ${progress.stats.currentKhmerLevel}`} />
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-primary-600">Learning paths</p><h2 className="mt-1 text-2xl font-black">Course completion</h2></div>
        <div className="grid gap-5 lg:grid-cols-2"><LearningProgressCard language="en" summary={progress.languages.en} /><LearningProgressCard language="km" summary={progress.languages.km} /></div>
      </section>

      <section className="snp-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 px-5 py-4">
          <div><p className="text-xs font-black uppercase tracking-[0.13em] text-slate-400">Latest activity</p><h2 className="mt-1 text-xl font-black">Recent results</h2></div>
          <Link className="snp-button-secondary min-h-10 px-4 py-2 text-sm" to="/practice"><LuSparkles />Practice now</Link>
        </div>
        {progress.recent.length ? (
          <div className="divide-y divide-slate-200">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_0.6fr_0.55fr_0.65fr] gap-3 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.13em] text-slate-500 sm:grid"><span>Activity</span><span>Speed</span><span>Accuracy</span><span>Stars</span></div>
            {progress.recent.map((item) => <ResultRow item={item} key={item.id} />)}
          </div>
        ) : (
          <div className="p-8 text-center"><LuBookOpenCheck className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-black">Your results will appear here</p><p className="mt-1 text-sm text-slate-500">Complete a lesson, test, or game to start your report.</p></div>
        )}
      </section>
    </div>
  );
}
