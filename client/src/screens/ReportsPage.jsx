import { useCallback, useEffect, useMemo, useState } from "react";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getReport, listClasses, listStudents } from "../services/managementService.js";

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({ student: "", class: "", language: "", level: "", from: "", to: "" });
  const [state, setState] = useState({ loading: true, data: null, classes: [], students: [], error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "").map(([key, value]) => [key, ["from", "to"].includes(key) ? new Date(`${value}${key === "from" ? "T00:00:00" : "T23:59:59"}`).toISOString() : value]));
      const [data, classes, students] = await Promise.all([getReport(query), listClasses(), listStudents(filters.class ? { class: filters.class } : {})]);
      setState({ loading: false, data, classes, students, error: "" });
    } catch (error) { setState((current) => ({ ...current, loading: false, error: getApiErrorMessage(error) })); }
  }, [filters]);
  useEffect(() => { void load(); }, [load]);
  const rows = useMemo(() => state.data?.results || [], [state.data]);
  function exportCsv() {
    const headers = ["Student", "Student ID", "Lesson", "Language", "Level", "Mode", "WPM", "CPM", "Accuracy", "Errors", "Score", "Stars", "Completed"];
    const content = [headers, ...rows.map((item) => [`${item.student?.firstName || ""} ${item.student?.lastName || ""}`.trim(), item.student?.studentId, item.lesson?.title, item.language, item.lesson?.level, item.mode, item.wpm, item.cpm, item.accuracy, item.errors, item.score, item.stars, item.completedAt])].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `snp-typing-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  if (state.loading && !state.data) return <PageLoader message="Building the class report…" />;
  if (state.error && !state.data) return <PageError message={state.error} onRetry={load} />;
  const summary = state.data.summary;
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-extrabold uppercase tracking-wider text-[#047857]">Real Student Data</p><h1 className="mt-2 text-3xl font-black">Reports</h1><p className="mt-2 text-slate-600">Filter, print, or export typing performance.</p></div><div className="flex gap-3 print:hidden"><button className="snp-button-secondary" onClick={() => window.print()} type="button">Print</button><button className="snp-button-primary" disabled={!rows.length} onClick={exportCsv} type="button">Export CSV</button></div></div>
    <section className="snp-card mt-6 grid gap-3 p-4 print:hidden md:grid-cols-3 xl:grid-cols-6"><select className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, class: event.target.value, student: "" }))} value={filters.class}><option value="">All classes</option>{state.classes.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</select><select className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, student: event.target.value }))} value={filters.student}><option value="">All students</option>{state.students.map((item) => <option value={item.id} key={item.id}>{item.firstName} {item.lastName}</option>)}</select><select className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, language: event.target.value }))} value={filters.language}><option value="">All languages</option><option value="en">English</option><option value="km">Khmer</option></select><select className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))} value={filters.level}><option value="">All levels</option>{[1,2,3,4,5,6,7].map((value) => <option key={value}>{value}</option>)}</select><input className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} /><input className="snp-input" onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} /></section>
    {state.error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{state.error}</p>}
    <section className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">{[["Students", summary.students], ["Results", summary.results], ["Accuracy", `${Math.round(summary.averageAccuracy)}%`], ["English WPM", Math.round(summary.averageWpm)], ["Khmer CPM", Math.round(summary.averageCpm)], ["Stars", summary.totalStars]].map(([label, value]) => <article className="snp-card p-5" key={label}><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</section>
    <section className="snp-brutal-card-slate mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b-2 border-slate-800"><tr><th className="px-5 py-4">Student</th><th className="px-5 py-4">Lesson</th><th className="px-5 py-4">Mode</th><th className="px-5 py-4">Speed</th><th className="px-5 py-4">Accuracy</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-black">{item.student?.firstName} {item.student?.lastName}</p><p className="text-xs text-slate-500">{item.student?.studentId}</p></td><td className="px-5 py-4 font-bold">{item.lesson?.title || "Archived lesson"}</td><td className="px-5 py-4 text-sm font-bold capitalize">{item.mode}</td><td className="px-5 py-4 font-black text-[#047857]">{item.language === "km" ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}</td><td className="px-5 py-4 font-bold">{Math.round(item.accuracy)}%</td><td className="px-5 py-4 font-bold">{item.score} · {"★".repeat(item.stars)}</td><td className="px-5 py-4 text-sm text-slate-500">{new Date(item.completedAt).toLocaleString()}</td></tr>)}</tbody></table></div>{!rows.length && <p className="p-10 text-center font-bold text-slate-500">No saved results match these filters.</p>}</section>
  </div>;
}
