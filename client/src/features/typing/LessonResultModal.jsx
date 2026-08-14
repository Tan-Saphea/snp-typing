import { useEffect, useState } from "react";
import { LuArrowRight, LuBookOpen, LuCircleCheckBig, LuRefreshCw, LuRotateCcw, LuTriangleAlert } from "react-icons/lu";

import Stars from "../../components/Stars.jsx";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export default function LessonResultModal({ result, saving, saveError, onRetrySave, onTryAgain, onNext, onBack, hasNext, comprehension }) {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  useEffect(() => { setSelectedAnswer(""); }, [result?.id]);

  if (saving) return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="status"><div className="snp-result-dialog w-full max-w-md p-7 text-center sm:p-8"><div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" /><h2 className="mt-5 text-xl font-black">Saving your result…</h2><p className="mt-2 text-sm text-slate-500">Keeping your progress safe.</p></div></div>;
  if (saveError) return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="alert"><div className="snp-result-dialog w-full max-w-md p-7 text-center sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-red-700 bg-red-100 text-xl text-red-700 shadow-[0_4px_0_0_#fca5a5]"><LuTriangleAlert /></div><h2 className="mt-5 text-2xl font-black">Result not saved</h2><p className="mt-2 text-slate-600">{saveError}</p><button className="snp-button-primary mt-6 w-full" onClick={onRetrySave} type="button"><LuRefreshCw />Try saving again</button></div></div>;
  if (!result) return null;

  const passed = result.passed;
  const continueDisabled = !passed || !hasNext || Boolean(comprehension?.question && !selectedAnswer);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="result-heading">
      <div className="snp-result-dialog snp-scrollbar max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto p-5 sm:max-h-[calc(100vh-2.5rem)] sm:p-7">
        <div className="text-center"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl border-2 border-slate-900 text-3xl ${passed ? "bg-emerald-200 text-emerald-800 shadow-[0_5px_0_0_#10b981]" : "bg-amber-200 text-amber-800 shadow-[0_5px_0_0_#f59e0b]"}`}>{passed ? <LuCircleCheckBig /> : <LuRotateCcw />}</div><p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-primary-600">{passed ? "Mission complete" : "Practice round"}</p><h2 className="mt-2 text-2xl font-black sm:text-3xl" id="result-heading">{passed ? "Great job!" : "Keep practicing!"}</h2><p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{passed ? "Lesson complete. Your focused practice is paying off." : "Aim for at least 70% accuracy, then try again."}</p><p className="mt-3"><Stars count={result.stars} size={28} /></p></div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">{[["WPM", Math.round(result.wpm)], ["CPM", Math.round(result.cpm)], ["Accuracy", `${Math.round(result.accuracy)}%`], ["Errors", result.errors], ["Time", formatTime(result.duration)], ["Score", result.score]].map(([label, value]) => <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3 text-center shadow-[0_2px_0_0_#cbd5e1]" key={label}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p><p className="mt-1 text-lg font-black text-ink">{value}</p></div>)}</div>
        {comprehension?.question && <section className="mt-6 rounded-2xl border-2 border-primary-600 bg-primary-50/60 p-4 shadow-[0_4px_0_0_#7167f6] sm:p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-primary-700">Comprehension question</p><h3 className="mt-2 text-lg font-black">{comprehension.question}</h3><div className="mt-4 grid gap-2">{comprehension.options.map((option) => <button className={`rounded-xl border-2 border-slate-900 px-4 py-3 text-left font-bold transition ${selectedAnswer === option ? "-translate-y-0.5 bg-white text-primary-700 shadow-[0_3px_0_0_#7167f6]" : "bg-white/70 shadow-[0_2px_0_0_#cbd5e1] hover:-translate-y-0.5"}`} onClick={() => setSelectedAnswer(option)} type="button" key={option}>{option}</button>)}</div>{selectedAnswer && <p className={`mt-3 font-black ${selectedAnswer === comprehension.answer ? "text-emerald-700" : "text-amber-700"}`}>{selectedAnswer === comprehension.answer ? "Correct! You understood the story." : `Good try. The answer is: ${comprehension.answer}`}</p>}</section>}
        <div className="mt-7 grid gap-3 sm:grid-cols-3"><button className="snp-button-secondary" onClick={onTryAgain} type="button"><LuRotateCcw />Try Again</button><button className="snp-button-secondary" onClick={onBack} type="button"><LuBookOpen />Back to Lessons</button><button className="snp-button-primary" disabled={continueDisabled} onClick={onNext} type="button">{hasNext ? comprehension?.question && !selectedAnswer ? "Answer to Continue" : "Next Lesson" : "Level Complete"}{hasNext && <LuArrowRight />}</button></div>
      </div>
    </div>
  );
}
