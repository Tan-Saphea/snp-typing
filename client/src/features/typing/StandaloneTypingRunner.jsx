import { useCallback, useEffect, useRef, useState } from "react";

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
  const showLiveWpm = useAuthStore((store) => store.schoolSettings.showLiveWpm);
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

  return (
    <div className="relative">
      <textarea {...engine.inputHandlers} aria-label="Typing input" autoCapitalize="none" autoComplete="off" className="snp-typing-input-proxy" ref={inputRef} spellCheck="false" value={engine.rawInput} />
      <div className="grid grid-cols-4 gap-3">
        {[[duration ? "Remaining" : "Time", clock(duration ? remaining : engine.elapsedTime)], [lesson.language === "km" ? "CPM" : "WPM", showLiveWpm ? Math.round(lesson.language === "km" ? engine.cpm : engine.wpm) : "Hidden"], ["Accuracy", `${Math.round(engine.accuracy)}%`], ["Errors", engine.errors]].map(([label, value]) => <div className="snp-card p-4 text-center" key={label}><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}
      </div>
      <div className="mt-4"><TypingAdventureHud engine={engine} language={lesson.language} /></div>
      <button className="snp-card mt-4 block min-h-72 w-full cursor-text p-8 text-left" onClick={() => inputRef.current?.focus()} type="button"><TypingText currentIndex={engine.currentIndex} hasCurrentError={engine.hasCurrentError} language={lesson.language} targetSegments={engine.targetSegments} /><p className="mt-8 text-sm font-bold text-slate-400">Click the card and begin typing.</p></button>
      {showVirtualKeyboard && <div className="mt-4"><VirtualKeyboard hasError={engine.hasCurrentError} language={lesson.language} nextText={engine.remainingText} onKeyPress={typeVirtualKey} /></div>}
      <div className="mt-4 flex gap-3"><button className="snp-button-secondary" onClick={onExit} type="button">Exit</button>{duration > 0 && engine.startedAt && <button className="snp-button-primary" onClick={save} type="button">Finish Now</button>}</div>
      <LessonResultModal result={resultState.result} saving={resultState.saving} saveError={resultState.error} onRetrySave={save} onTryAgain={reset} onBack={onExit} onNext={() => {}} hasNext={false} />
    </div>
  );
}
