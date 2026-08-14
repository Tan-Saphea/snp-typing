import { useEffect, useState } from "react";
import { LuActivity, LuGauge, LuMedal, LuSparkles, LuStar, LuTarget, LuTrophy, LuUsers } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLeaderboard } from "../services/leaderboardService.js";

const periods = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"]];
const categories = [
  ["english-wpm", "English WPM", LuGauge],
  ["khmer-cpm", "Khmer CPM", LuActivity],
  ["accuracy", "Accuracy", LuTarget],
  ["score", "Total score", LuTrophy],
  ["stars", "Stars", LuStar],
];

function valueLabel(category, value) {
  const rounded = Math.round(value);
  if (category === "english-wpm") return `${rounded} WPM`;
  if (category === "khmer-cpm") return `${rounded} CPM`;
  if (category === "accuracy") return `${rounded}%`;
  if (category === "stars") return `${rounded} stars`;
  return rounded.toLocaleString();
}

function LearnerName({ student }) {
  const name = [student.firstName, student.lastName].filter(Boolean).join(" ") || "SNP Learner";
  return <><p className="truncate font-black">{name}</p>{student.khmerName && <p className="truncate text-xs font-bold text-slate-400">{student.khmerName}</p>}</>;
}

const podiumTones = [
  "bg-amber-300 text-amber-950 shadow-[0_4px_0_0_#f59e0b]",
  "bg-slate-200 text-slate-800 shadow-[0_4px_0_0_#94a3b8]",
  "bg-orange-200 text-orange-900 shadow-[0_4px_0_0_#fb923c]",
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("week");
  const [category, setCategory] = useState("score");
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    getLeaderboard({ period, category })
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((error) => setState({ loading: false, data: null, error: getApiErrorMessage(error) }));
  }, [category, period]);

  const selectedCategory = categories.find(([value]) => value === category);
  const entries = state.data?.entries ?? [];

  return (
    <div className="space-y-6">
      <PageHero
        badges={[
          { icon: LuUsers, label: "All learners" },
          { icon: LuSparkles, label: "Celebrate progress" },
        ]}
        description="Compare friendly scores across speed, accuracy, effort, and stars. Every completed activity can move you forward."
        eyebrow="Learning community"
        icon={LuTrophy}
        title="Leaderboard"
        tone="ink"
      />

      <section className="snp-filter-bar grid gap-4 xl:grid-cols-[auto_1fr] xl:items-end">
        <div><span className="snp-filter-label">Time period</span><div className="snp-segmented">{periods.map(([value, label]) => <button className={`snp-segment ${period === value ? "snp-segment-active" : ""}`} aria-pressed={period === value} key={value} onClick={() => setPeriod(value)} type="button">{label}</button>)}</div></div>
        <div><span className="snp-filter-label">Ranking category</span><div className="snp-segmented">{categories.map(([value, label, Icon]) => <button className={`snp-segment inline-flex items-center gap-2 ${category === value ? "snp-segment-active" : ""}`} aria-pressed={category === value} key={value} onClick={() => setCategory(value)} type="button"><Icon size={15} />{label}</button>)}</div></div>
      </section>

      {state.loading ? <PageLoader message="Updating the rankings…" /> : state.error ? <PageError message={state.error} /> : entries.length ? (
        <>
          <section className="grid gap-4 md:grid-cols-3" aria-label="Top three learners">
            {entries.slice(0, 3).map((entry, index) => (
              <article className="snp-card relative overflow-hidden p-5" key={entry.student.id}>
                <div className="absolute -right-5 -top-7 text-8xl font-black text-slate-900/[0.035]">{index + 1}</div>
                <div className="relative flex items-center gap-4">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 text-2xl ${podiumTones[index]}`}><LuMedal /></span>
                  <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">#{index + 1} learner</p><LearnerName student={entry.student} /></div>
                </div>
                <div className="relative mt-5 flex items-end justify-between gap-3 border-t border-slate-200 pt-4"><div><p className="text-2xl font-black tracking-tight text-primary-700">{valueLabel(category, entry.value)}</p><p className="mt-1 text-xs font-bold text-slate-400">{selectedCategory?.[1]}</p></div><p className="text-right text-xs font-bold text-slate-500">{entry.attempts}<br />attempts</p></div>
              </article>
            ))}
          </section>

          <section className="snp-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b-2 border-slate-900 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Full ranking</p><h2 className="mt-1 text-xl font-black">{selectedCategory?.[1]}</h2></div><span className="rounded-xl border-2 border-slate-900 bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800 shadow-[0_2px_0_0_#10b981]">{periods.find(([value]) => value === period)?.[1]}</span></div>
            <div className="divide-y divide-slate-200">
              {entries.map((entry, index) => (
                <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[52px_minmax(0,1fr)_110px_150px] sm:gap-5 sm:p-5" key={entry.student.id}>
                  <span className={`grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-900 font-black shadow-[0_2px_0_0_#cbd5e1] ${index < 3 ? podiumTones[index] : "bg-white text-slate-600"}`}>{index < 3 ? <LuMedal /> : index + 1}</span>
                  <div className="min-w-0"><LearnerName student={entry.student} /></div>
                  <p className="hidden text-center text-sm font-bold text-slate-500 sm:block">{entry.attempts} attempts</p>
                  <div className="text-right"><p className="text-lg font-black text-primary-700 sm:text-xl">{valueLabel(category, entry.value)}</p><p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:hidden">{selectedCategory?.[1]}</p></div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="snp-card p-10 text-center"><LuTrophy className="mx-auto text-slate-300" size={48} /><h2 className="mt-4 text-xl font-black">The podium is ready</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">No results match these filters yet. Complete an activity to place the first score.</p></section>
      )}
    </div>
  );
}
