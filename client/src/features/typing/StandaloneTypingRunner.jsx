import { useCallback, useEffect, useRef, useState } from "react";
import { LuArrowLeft, LuClock3, LuGauge, LuKeyboard, LuTarget } from "react-icons/lu";

import LessonResultModal from "./LessonResultModal.jsx";
import TypingAdventureHud from "./TypingAdventureHud.jsx";
import TypingText from "./TypingText.jsx";
import { buildResultPayload } from "./typingContent.js";
import { useTypingEngine } from "./useTypingEngine.js";
import VirtualKeyboard from "./VirtualKeyboard.jsx";
import { getApiErrorMessage } from "../../services/api.js";
import { saveLessonResult } from "../../services/resultService.js";
import { useAuthStore } from "../../stores/authStore.js";

function clock(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.max(0, Math.ceil(seconds % 60)).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function StandaloneTypingRunner({ lesson, targetText, mode = "practice", duration = 0, onExit }) {
  const showVirtualKeyboard = useAuthStore((store) => store.user?.preferences?.virtualKeyboard !== false);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);
  const [remaining, setRemaining] = useState(duration);
  const [resultState, setResultState] = useState({ saving: false, result: null, error: "" });
  const engine = useTypingEngine({ targetText, language: lesson.language, allowBackspace: true });
  const timedOut = duration > 0 && remaining <= 0 && Boolean(engine.startedAt);

  useEffect(() => { inputRef.current?.focus(); }, [engine.resetVersion]);
  useEffect(() => {
    if (!duration || !engine.startedAt || resultState.result || resultState.saving) return undefined;
    const timer = window.setInterval(() => setRemaining(Math.max(0, duration - (Date.now() - engine.startedAt.getTime()) / 1000)), 200);
    return () => window.clearInterval(timer);
  }, [duration, engine.startedAt, resultState.result, resultState.saving]);

  const save = useCallback(async () => {
    if (submittedRef.current || engine.totalTyped === 0) return;
    submittedRef.current = true;
    setResultState({ saving: true, result: null, error: "" });
    try {
      const payload = buildResultPayload({ lesson, engine, targetText, mode, duration: timedOut ? duration : engine.elapsedTime });
      const saved = await saveLessonResult(payload);
      setResultState({ saving: false, result: saved.result, error: "" });
    } catch (error) {
      submittedRef.current = false;
      setResultState({ saving: false, result: null, error: getApiErrorMessage(error) });
    }
  }, [duration, engine, lesson, mode, targetText, timedOut]);

  useEffect(() => {
    if ((engine.isComplete || timedOut) && !submittedRef.current) void save();
  }, [engine.isComplete, save, timedOut]);

  function reset() {
    submittedRef.current = false;
    setRemaining(duration);
    setResultState({ saving: false, result: null, error: "" });
    engine.reset();
  }

  function typeVirtualKey(value) {
    engine.inputVirtualKey(value);
    inputRef.current?.focus();
  }

  const progress = engine.targetSegments.length ? (engine.currentIndex / engine.targetSegments.length) * 100 : 0;

  return (
    <div className="relative mx-auto max-w-[1380px] space-y-4">
      <textarea {...engine.inputHandlers} aria-label="Typing input" autoCapitalize="none" autoComplete="off" className="snp-typing-input-proxy" ref={inputRef} spellCheck="false" value={engine.rawInput} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><button className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" onClick={onExit} type="button"><LuArrowLeft />Exit activity</button><p className="mt-4 text-xs font-black uppercase tracking-[0.15em] text-emerald-700">{mode === "test" ? "Timed typing test" : "Practice mission"}</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{lesson.title}</h1><p className="mt-1 text-sm font-semibold text-slate-500">{lesson.language === "km" ? "ក្ដារចុចខ្មែរ NIDA · Khmer grapheme scoring" : "English QWERTY · Standard WPM scoring"}</p></div>
        {duration > 0 && engine.startedAt && <button className="snp-button-primary min-h-10 px-4 py-2 text-sm" onClick={save} type="button">Finish now</button>}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [duration ? "Remaining" : "Time", clock(duration ? remaining : engine.elapsedTime), LuClock3, "bg-sky-100 text-sky-700"],
          [lesson.language === "km" ? "CPM" : "WPM", Math.round(lesson.language === "km" ? engine.cpm : engine.wpm), LuGauge, "bg-violet-100 text-violet-700"],
          ["Accuracy", `${Math.round(engine.accuracy)}%`, LuTarget, "bg-emerald-100 text-emerald-700"],
          ["Errors", engine.errors, LuKeyboard, "bg-rose-100 text-rose-700"],
        ].map(([label, value, Icon, tone]) => <div className="snp-card flex items-center gap-3 p-3 sm:p-4" key={label}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 shadow-[0_2px_0_0_#334155] ${tone}`}><Icon /></span><div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p><p className="mt-0.5 truncate text-xl font-black">{value}</p></div></div>)}
      </div>
      <TypingAdventureHud engine={engine} language={lesson.language} />
      <button className="snp-card block min-h-72 w-full cursor-text overflow-hidden p-0 text-left" onClick={() => inputRef.current?.focus()} type="button"><div className="flex items-center justify-between gap-3 border-b-2 border-slate-900 bg-slate-50 px-5 py-3"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Typing area</p><p className="text-xs font-black text-primary-700">{Math.round(progress)}% complete</p></div><div className="h-2 bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div><div className="p-6 sm:p-8"><TypingText currentIndex={engine.currentIndex} hasCurrentError={engine.hasCurrentError} language={lesson.language} targetSegments={engine.targetSegments} /><p className="mt-8 text-sm font-bold text-slate-400">Click this card, then begin typing. The timer starts on your first key.</p></div></button>
      {showVirtualKeyboard && <VirtualKeyboard hasError={engine.hasCurrentError} language={lesson.language} nextText={engine.remainingText} onKeyPress={typeVirtualKey} />}
      <LessonResultModal result={resultState.result} saving={resultState.saving} saveError={resultState.error} onRetrySave={save} onTryAgain={reset} onBack={onExit} onNext={() => {}} hasNext={false} />
    </div>
  );
}
