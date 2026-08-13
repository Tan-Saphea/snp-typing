import { useCallback, useEffect, useState } from "react";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";

function SummaryCard({ label, value, note }) {
  return <article className="snp-card p-5"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-ink">{value}</p><p className="mt-2 text-xs font-semibold text-slate-400">{note}</p></article>;
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
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-600">Learning Report</p><h1 className="mt-2 text-3xl font-black">My Progress</h1><p className="mt-2 text-slate-600">Every accurate key brings you closer to your goal.</p></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Lessons Completed" value={progress.stats.lessonsCompleted} note="Passed with 70% or higher" /><SummaryCard label="Best English Speed" value={`${Math.round(progress.stats.bestWpm)} WPM`} note={`Average ${Math.round(progress.stats.averageWpm)} WPM`} /><SummaryCard label="Best Khmer Speed" value={`${Math.round(progress.stats.bestCpm)} CPM`} note="Measured with Khmer graphemes" /><SummaryCard label="Average Accuracy" value={`${Math.round(progress.stats.averageAccuracy)}%`} note={`Best ${Math.round(progress.stats.bestAccuracy)}%`} /><SummaryCard label="Total Stars" value={`★ ${progress.stats.stars}`} note="Best stars from each lesson" /><SummaryCard label="Typing Tests" value={progress.stats.testsCompleted} note="Saved timed assessments" /><SummaryCard label="Daily Streak" value={`${progress.stats.dailyStreak} days`} note="Practice regularly to keep it growing" /><SummaryCard label="Current Levels" value={`EN ${progress.stats.currentEnglishLevel} · KM ${progress.stats.currentKhmerLevel}`} note="Next curriculum levels" /></section>
      <section className="grid gap-5 lg:grid-cols-2"><article className="snp-card p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-primary-700">English Typing</p><h2 className="mt-1 text-xl font-black">{progress.languages.en.completedLessons} of {progress.languages.en.totalLessons} lessons</h2></div><span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-800 bg-sky-100 text-xl font-black text-sky-700 shadow-[0_2px_0_0_#334155]">A</span></div><div className="mt-6"><ProgressBar value={progress.languages.en.percent} /></div><Link className="snp-button-secondary mt-6 w-full" to="/english">Open English lessons</Link></article><article className="snp-card p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-violet-700">Khmer Typing</p><h2 className="mt-1 text-xl font-black">{progress.languages.km.completedLessons} of {progress.languages.km.totalLessons} lessons</h2></div><span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-800 bg-violet-100 text-xl font-black text-violet-700 shadow-[0_2px_0_0_#334155]">ក</span></div><div className="mt-6"><ProgressBar color="bg-violet-600" value={progress.languages.km.percent} /></div><Link className="snp-button-secondary mt-6 w-full" to="/khmer">Open Khmer lessons</Link></article></section>
      <section className="snp-card p-6"><h2 className="text-xl font-black">Recent Results</h2>{progress.recent.length ? <div className="mt-4 overflow-hidden rounded-xl border-2 border-slate-800 shadow-[0_3px_0_0_#334155]"><table className="w-full text-left"><thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Lesson</th><th className="px-5 py-3">Speed</th><th className="px-5 py-3">Accuracy</th><th className="px-5 py-3">Stars</th><th className="px-5 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{progress.recent.map((item) => <tr key={item.id}><td className="px-5 py-4 font-bold">{item.lesson?.title || "Archived lesson"}</td><td className="px-5 py-4 text-sm font-semibold text-slate-600">{item.lesson?.language === "km" ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}</td><td className="px-5 py-4 text-sm font-semibold text-slate-600">{Math.round(item.accuracy)}%</td><td className="px-5 py-4 font-black text-amber-500">{"★".repeat(item.stars)}<span className="text-slate-200">{"★".repeat(3 - item.stars)}</span></td><td className="px-5 py-4 text-sm text-slate-500">{new Date(item.completedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">Your completed lesson results will appear here.</p>}</section>
    </div>
  );
}
