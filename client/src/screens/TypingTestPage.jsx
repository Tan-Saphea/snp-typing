import { useEffect, useMemo, useState } from "react";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import StandaloneTypingRunner from "../features/typing/StandaloneTypingRunner.jsx";
import { buildTargetText } from "../features/typing/typingContent.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const durations = [[30, "30 Seconds"], [60, "1 Minute"], [180, "3 Minutes"], [300, "5 Minutes"]];

export default function TypingTestPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);
  useEffect(() => { listLessons({ type: "test" }).then(setLessons).catch((value) => setError(getApiErrorMessage(value))).finally(() => setLoading(false)); }, []);
  const lesson = useMemo(() => lessons.find((item) => item.language === language), [language, lessons]);
  if (loading) return <PageLoader />;
  if (error) return <PageError message={error} />;
  if (running && lesson) {
    const base = buildTargetText(lesson);
    return <StandaloneTypingRunner lesson={lesson} targetText={Array(30).fill(base).join(" ")} mode="test" duration={duration} onExit={() => setRunning(false)} />;
  }
  return <div className="mx-auto max-w-5xl"><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-600">Timed Assessment</p><h1 className="mt-2 text-3xl font-black">Typing Test</h1><p className="mt-2 text-slate-600">Choose your language and duration. Every result is saved.</p><section className="snp-card mt-6 p-6"><h2 className="text-lg font-black">Language</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["en", "English Test", "WPM and CPM"], ["km", "Khmer Test", "Grapheme-aware CPM"]].map(([value, label, note]) => <button className={`rounded-xl border-2 transition-all p-5 text-left ${language === value ? "border-slate-800 bg-[#ecfdf5] text-[#047857] shadow-[0_3px_0_0_#059669] -translate-y-0.5" : "border-slate-800 bg-white hover:bg-slate-50 shadow-[0_2px_0_0_#334155] hover:shadow-[0_4px_0_0_#334155] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none duration-75"}`} onClick={() => setLanguage(value)} type="button" key={value}><p className="font-black">{label}</p><p className="mt-1 text-sm text-slate-500">{note}</p></button>)}</div><h2 className="mt-6 text-lg font-black">Duration</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{durations.map(([value, label]) => <button className={`rounded-xl border-2 border-slate-800 px-4 py-4 font-black transition-all ${duration === value ? "bg-[#059669] text-white shadow-[0_3px_0_0_#065f46] -translate-y-0.5" : "bg-white text-slate-700 hover:bg-slate-50 shadow-[0_2px_0_0_#334155] hover:shadow-[0_4px_0_0_#334155] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none duration-75"}`} onClick={() => setDuration(value)} type="button" key={value}>{label}</button>)}</div><button className="snp-button-primary mt-7" disabled={!lesson} onClick={() => setRunning(true)} type="button">Start Test</button></section></div>;
}
