import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuBookOpen, LuClock3, LuGauge, LuKeyboard, LuMaximize2, LuTarget, LuX } from "react-icons/lu";
import { Link, useNavigate, useParams } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LessonResultModal from "../features/typing/LessonResultModal.jsx";
import TypingAdventureHud from "../features/typing/TypingAdventureHud.jsx";
import TypingText from "../features/typing/TypingText.jsx";
import { buildResultPayload, buildTargetText } from "../features/typing/typingContent.js";
import { useTypingEngine } from "../features/typing/useTypingEngine.js";
import VirtualKeyboard from "../features/typing/VirtualKeyboard.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";
import { useAuthStore } from "../stores/authStore.js";

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function getCurrentWord(segments, currentIndex) {
  if (!segments.length || currentIndex >= segments.length) return "";
  let start = currentIndex;
  let end = currentIndex;
  while (start > 0 && !/\s/u.test(segments[start - 1])) start -= 1;
  while (end < segments.length && !/\s/u.test(segments[end])) end += 1;
  return segments.slice(start, end).join("");
}

function SessionMetric({ label, value, tone = "text-ink" }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center"><p className="truncate text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-0.5 truncate text-sm font-black ${tone}`}>{value}</p></div>;
}

function OverviewFact({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-800 bg-white text-primary-700 shadow-[0_2px_0_0_#334155]"><Icon /></span><div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-0.5 font-black text-ink">{value}</p></div></div>;
}

export default function TypingLessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const submittedRef = useRef(false);
  const showVirtualKeyboard = useAuthStore((store) => store.user?.preferences?.virtualKeyboard !== false);
  const [sessionActive, setSessionActive] = useState(false);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [resultState, setResultState] = useState({ saving: false, result: null, error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, data: await getLesson(lessonId), error: "" }); }
    catch (error) { setState({ loading: false, data: null, error: getApiErrorMessage(error) }); }
  }, [lessonId]);
  useEffect(() => { void load(); }, [load]);

  const targetText = useMemo(() => state.data ? buildTargetText(state.data.lesson) : "", [state.data]);
  const engine = useTypingEngine({ targetText, language: state.data?.lesson.language ?? "en", allowBackspace: state.data?.lesson.allowBackspace ?? true });
  const lesson = state.data?.lesson;
  const backPath = lesson?.language === "km" ? `/khmer/level/${lesson.level}` : `/english/level/${lesson?.level ?? 1}`;

  useEffect(() => {
    submittedRef.current = false;
    setSessionActive(false);
    setResultState({ saving: false, result: null, error: "" });
    engine.reset();
  }, [lessonId]);

  useEffect(() => {
    if (!sessionActive) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; };
  }, [engine.resetVersion, sessionActive]);

  const submitResult = useCallback(async () => {
    if (!lesson || !engine.isComplete || resultState.saving) return;
    setResultState({ saving: true, result: null, error: "" });
    try {
      const payload = buildResultPayload({ lesson, engine, targetText, mode: "lesson" });
      const saved = await saveLessonResult(payload);
      setResultState({ saving: false, result: saved.result, error: "" });
    } catch (error) {
      submittedRef.current = false;
      setResultState({ saving: false, result: null, error: getApiErrorMessage(error) });
    }
  }, [engine.correctCharacters, engine.elapsedTime, engine.errors, engine.incorrectCharacters, engine.isComplete, engine.startedAt, engine.targetSegments.length, engine.totalTyped, lesson, resultState.saving, targetText.length]);

  useEffect(() => {
    if (engine.isComplete && !submittedRef.current) {
      submittedRef.current = true;
      void submitResult();
    }
  }, [engine.isComplete, submitResult]);

  function startLesson() {
    setSessionActive(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function tryAgain() {
    submittedRef.current = false;
    setResultState({ saving: false, result: null, error: "" });
    setSessionActive(true);
    engine.reset();
  }

  function typeVirtualKey(value) {
    engine.inputVirtualKey(value);
    inputRef.current?.focus();
  }

  if (state.loading) return <PageLoader message="Opening your lesson…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const currentWord = getCurrentWord(engine.targetSegments, engine.currentIndex);
  const lessonProgress = engine.targetSegments.length ? (engine.currentIndex / engine.targetSegments.length) * 100 : 0;
  const primarySpeed = lesson.language === "km" ? `${Math.round(engine.cpm)} CPM` : `${Math.round(engine.wpm)} WPM`;
  const pictures = lesson.content.blocks.filter((block) => block.kind === "picture");
  const comprehension = lesson.content.blocks.find((block) => block.question);
  const previewText = engine.targetSegments.slice(0, 180).join("");

  return (
    <div>
      {!sessionActive && <div className="mx-auto max-w-5xl">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" to={backPath}><LuArrowLeft />Back to lessons</Link>
        <section className="snp-panel-shell mt-4 overflow-hidden rounded-xl bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-sky-50 p-6 sm:p-8"><p className="snp-kicker">Level {lesson.level} · Lesson {lesson.order}</p><h1 className="mt-2 text-2xl font-black sm:text-4xl">{lesson.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{lesson.instructions}</p></div>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0"><div className="flex items-center gap-2"><LuBookOpen className="text-primary-700" /><h2 className="text-lg font-black">Lesson preview</h2></div>{pictures.length > 0 && <div className="mt-4 flex gap-3">{pictures.slice(0, 4).map((picture, index) => <span className="grid h-16 w-16 place-items-center rounded-xl border-2 border-slate-800 bg-slate-50 text-4xl shadow-[0_2px_0_0_#334155]" key={`${picture.answer}-${index}`}>{picture.image}</span>)}</div>}<div className="relative mt-4 max-h-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-5"><p className={`whitespace-pre-wrap break-words text-lg font-bold leading-8 text-slate-600 ${lesson.language === "km" ? "font-sans" : ""}`}>{previewText}{engine.targetSegments.length > 180 ? "…" : ""}</p><div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-50 to-transparent" /></div><p className="mt-3 text-xs font-bold text-slate-400">The timer starts only after your first typed key.</p></div>
            <aside><div className="grid grid-cols-2 gap-3"><OverviewFact icon={LuTarget} label="Pass accuracy" value={`${lesson.minimumAccuracy ?? 70}%`} /><OverviewFact icon={LuKeyboard} label="Typing units" value={engine.targetSegments.length} /><OverviewFact icon={LuGauge} label="Minimum speed" value={lesson.minimumSpeed ? `${lesson.minimumSpeed}+` : "Practice"} /><OverviewFact icon={LuClock3} label="Time limit" value={lesson.timeLimit ? `${lesson.timeLimit}s` : "No limit"} /></div><button className="snp-button-primary mt-5 w-full text-base" onClick={startLesson} type="button"><LuMaximize2 />Start Fullscreen Lesson</button><p className="mt-3 text-center text-xs font-semibold text-slate-400">Press the highlighted keys and focus on accuracy.</p></aside>
          </div>
        </section>
      </div>}

      {sessionActive && <div className="snp-typing-session fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#eef4f8]">
        <textarea {...engine.inputHandlers} aria-label="Typing input" autoCapitalize="none" autoComplete="off" className="snp-typing-input-proxy" ref={inputRef} spellCheck="false" value={engine.rawInput} />
        <header className="snp-session-header shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="snp-session-header-inner">
            <div className="flex items-center gap-3">
              <button className="snp-icon-button rounded-xl" aria-label="Exit lesson" onClick={() => navigate(backPath)} title="Exit lesson" type="button"><LuX size={21} /></button>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-wider text-primary-600">Level {lesson.level} · Lesson {lesson.order}</p><h1 className="truncate text-base font-black sm:text-lg">{lesson.title}</h1></div>
              <div className="hidden w-[470px] grid-cols-4 gap-2 md:grid"><SessionMetric label="Time" value={formatTimer(engine.elapsedTime)} /><SessionMetric label={lesson.language === "km" ? "CPM" : "WPM"} value={primarySpeed} tone="text-primary-700" /><SessionMetric label="Accuracy" value={`${Math.round(engine.accuracy)}%`} tone="text-emerald-700" /><SessionMetric label="Errors" value={engine.errors} tone="text-red-600" /></div>
            </div>
            <div className="mt-2 flex items-center gap-3"><div className="h-4 flex-1 overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-100"><div className="h-full bg-[#059669] transition-all" style={{ width: `${lessonProgress}%` }} /></div><span className="text-xs font-black text-slate-500">{Math.round(lessonProgress)}%</span></div>
            <div className="mt-2"><TypingAdventureHud compact engine={engine} language={lesson.language} /></div>
          </div>
        </header>

        <main className="snp-session-main mx-auto flex min-h-0 w-full flex-1 flex-col">
          <section className="snp-session-text snp-card flex min-h-[120px] flex-1 flex-col overflow-hidden rounded-xl">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3"><p className="truncate text-xs font-bold text-slate-500 sm:text-sm">{lesson.instructions}</p><div className="flex items-center gap-2"><span className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">Current: {currentWord || "Complete"}</span><span className="rounded-xl border border-emerald-300 bg-[#ecfdf5] px-3 py-1 text-xs font-black text-[#047857]">{lesson.language === "km" ? "ខ្មែរ" : "English"}</span></div></div>
            <button className="relative min-h-0 flex-1 cursor-text overflow-hidden px-4 text-left sm:px-7" onClick={() => inputRef.current?.focus()} type="button"><div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent" /><TypingText currentIndex={engine.currentIndex} hasCurrentError={engine.hasCurrentError} language={lesson.language} targetSegments={engine.targetSegments} viewport /><div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white to-transparent" /></button>
          </section>
          {showVirtualKeyboard ? <div className="snp-session-keyboard-wrap shrink-0"><VirtualKeyboard hasError={engine.hasCurrentError} language={lesson.language} nextText={engine.remainingText} onKeyPress={typeVirtualKey} session /></div> : <button className="snp-button-secondary mx-auto shrink-0" onClick={() => inputRef.current?.focus()} type="button"><LuKeyboard />Keyboard hidden in Settings — continue with your physical keyboard</button>}
        </main>
      </div>}

      <LessonResultModal result={resultState.result} saving={resultState.saving} saveError={resultState.error} onRetrySave={() => { submittedRef.current = true; void submitResult(); }} onTryAgain={tryAgain} onBack={() => navigate(backPath)} onNext={() => state.data.nextLesson && navigate(`/lessons/${state.data.nextLesson.id}`)} hasNext={Boolean(state.data.nextLesson)} comprehension={comprehension} />
    </div>
  );
}
