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

  if (saving) return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="status"><div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-8"><div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" /><h2 className="mt-5 text-xl font-black">Saving your result…</h2><p className="mt-2 text-sm text-slate-500">Keeping your progress safe.</p></div></div>;
  if (saveError) return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="alert"><div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-8"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-xl text-red-700"><LuTriangleAlert /></div><h2 className="mt-5 text-2xl font-black">Result not saved</h2><p className="mt-2 text-slate-600">{saveError}</p><button className="snp-button-primary mt-6 w-full" onClick={onRetrySave} type="button"><LuRefreshCw />Try saving again</button></div></div>;
  if (!result) return null;

  const passed = result.passed;
  const continueDisabled = !passed || !hasNext || Boolean(comprehension?.question && !selectedAnswer);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="result-heading">
      <div className="snp-scrollbar max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-2.5rem)] sm:p-7">
        <div className="text-center"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl text-3xl ${passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{passed ? <LuCircleCheckBig /> : <LuRotateCcw />}</div><h2 className="mt-4 text-2xl font-black sm:text-3xl" id="result-heading">{passed ? "Great Job!" : "Keep Practicing!"}</h2><p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{passed ? "Lesson complete. Your hard work is paying off." : "Reach 70% accuracy to unlock the next lesson."}</p><p className="mt-3"><Stars count={result.stars} size={28} /></p></div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">{[["WPM", Math.round(result.wpm)], ["CPM", Math.round(result.cpm)], ["Accuracy", `${Math.round(result.accuracy)}%`], ["Errors", result.errors], ["Time", formatTime(result.duration)], ["Score", result.score]].map(([label, value]) => <div className="rounded-2xl bg-slate-50 p-3 text-center" key={label}><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</p><p className="mt-1 text-lg font-black text-ink">{value}</p></div>)}</div>
        {comprehension?.question && <section className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 sm:p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-primary-700">Comprehension Question</p><h3 className="mt-2 text-lg font-black">{comprehension.question}</h3><div className="mt-4 grid gap-2">{comprehension.options.map((option) => <button className={`rounded-xl border px-4 py-3 text-left font-bold transition ${selectedAnswer === option ? "border-primary-500 bg-white text-primary-700 ring-2 ring-primary-100" : "border-primary-100 bg-white/70 hover:bg-white"}`} onClick={() => setSelectedAnswer(option)} type="button" key={option}>{option}</button>)}</div>{selectedAnswer && <p className={`mt-3 font-black ${selectedAnswer === comprehension.answer ? "text-emerald-700" : "text-amber-700"}`}>{selectedAnswer === comprehension.answer ? "Correct! You understood the story." : `Good try. The answer is: ${comprehension.answer}`}</p>}</section>}
        <div className="mt-7 grid gap-3 sm:grid-cols-3"><button className="snp-button-secondary" onClick={onTryAgain} type="button"><LuRotateCcw />Try Again</button><button className="snp-button-secondary" onClick={onBack} type="button"><LuBookOpen />Back to Lessons</button><button className="snp-button-primary" disabled={continueDisabled} onClick={onNext} type="button">{hasNext ? comprehension?.question && !selectedAnswer ? "Answer to Continue" : "Next Lesson" : "Level Complete"}{hasNext && <LuArrowRight />}</button></div>
      </div>
    </div>
  );
}
