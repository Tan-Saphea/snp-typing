import { useEffect, useState } from "react";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLeaderboard } from "../services/leaderboardService.js";
import { listClasses } from "../services/managementService.js";
import { useAuthStore } from "../stores/authStore.js";

const periods = [["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["all", "All Time"]];
const categories = [["english-wpm", "English WPM"], ["khmer-cpm", "Khmer CPM"], ["accuracy", "Accuracy"], ["score", "Total Score"], ["stars", "Stars"]];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("week");
  const [category, setCategory] = useState("score");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const user = useAuthStore((store) => store.user);
  const visibility = useAuthStore((store) => store.schoolSettings.leaderboardVisibility);
  const ownClassId = typeof user?.class === "string" ? user.class : user?.class?.id || user?.class?._id;

  useEffect(() => {
    if (["admin", "teacher"].includes(user?.role)) listClasses().then(setClasses).catch(() => setClasses([]));
  }, [user?.role]);
  useEffect(() => {
    if (user?.role === "student" && visibility === "class" && ownClassId) setClassId(ownClassId);
  }, [ownClassId, user?.role, visibility]);
  useEffect(() => {
    if (user?.role === "student" && visibility === "hidden") return;
    setState((current) => ({ ...current, loading: true }));
    getLeaderboard({ period, category, ...(classId ? { class: classId } : {}) })
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((error) => setState({ loading: false, data: null, error: getApiErrorMessage(error) }));
  }, [category, classId, period, user?.role, visibility]);

  if (user?.role === "student" && visibility === "hidden") {
    return <div className="snp-card mx-auto max-w-2xl p-8 text-center"><div className="text-5xl">♛</div><h1 className="mt-4 text-2xl font-black">Leaderboard Hidden</h1><p className="mt-2 text-slate-600">Your teacher has hidden rankings. Your personal progress is still available.</p></div>;
  }

  const classOptions = user?.role === "student" ? (ownClassId ? [{ id: ownClassId, name: "My Class" }] : []) : classes.map((item) => ({ id: item.id ?? item._id, name: item.name }));
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-600">School Rankings</p><h1 className="mt-2 text-3xl font-black">Leaderboard</h1><p className="mt-2 text-slate-600">Celebrate accuracy, effort, speed, and stars.</p></div><select className="snp-input max-w-56" disabled={user?.role === "student" && visibility === "class"} onChange={(event) => setClassId(event.target.value)} value={classId}>{visibility !== "class" && <option value="">Whole School</option>}{classOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="mt-6 flex flex-wrap gap-2">{periods.map(([value, label]) => <button className={`rounded-xl border-2 border-slate-800 px-4 py-2 text-sm font-black transition-all ${period === value ? "bg-[#059669] text-white shadow-[0_2px_0_0_#065f46] -translate-y-0.5" : "bg-white text-slate-700 hover:bg-slate-50 shadow-[0_2px_0_0_#334155] hover:shadow-[0_4px_0_0_#334155] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none duration-75"}`} onClick={() => setPeriod(value)} type="button" key={value}>{label}</button>)}</div><div className="mt-3 flex flex-wrap gap-2">{categories.map(([value, label]) => <button className={`rounded-xl border-2 border-slate-800 px-4 py-2 text-sm font-black transition-all ${category === value ? "bg-slate-800 text-white shadow-[0_2px_0_0_#0f172a] -translate-y-0.5" : "bg-white text-slate-700 hover:bg-slate-50 shadow-[0_2px_0_0_#334155] hover:shadow-[0_4px_0_0_#334155] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none duration-75"}`} onClick={() => setCategory(value)} type="button" key={value}>{label}</button>)}</div>{state.loading ? <div className="mt-6"><PageLoader /></div> : state.error ? <div className="mt-6"><PageError message={state.error} /></div> : <section className="snp-card mt-6 overflow-hidden"><div className="divide-y divide-slate-100">{state.data.entries.length ? state.data.entries.map((entry, index) => <div className="flex items-center gap-5 p-5" key={entry.student.id}><div className={`grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-800 text-lg font-black shadow-[0_2px_0_0_#334155] ${index < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate font-black">{entry.student.firstName} {entry.student.lastName}</p><p className="text-sm text-slate-500">{entry.student.studentId} · {entry.attempts} attempts</p></div><div className="text-right"><p className="text-2xl font-black text-primary-700">{Math.round(entry.value)}</p><p className="text-xs font-bold text-slate-400">{categories.find(([value]) => value === category)?.[1]}</p></div></div>) : <p className="p-10 text-center text-slate-500">No results match these filters yet.</p>}</div></section>}</div>;
}
