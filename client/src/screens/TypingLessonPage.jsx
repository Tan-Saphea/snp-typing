import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Progress, Row, Space, Tag, Tooltip, Typography } from "antd";
import {
  LuArrowLeft,
  LuBookOpen,
  LuClock3,
  LuGauge,
  LuKeyboard,
  LuMaximize2,
  LuRotateCcw,
  LuTarget,
  LuVolume2,
  LuVolumeX,
  LuX,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { Link, useNavigate, useParams } from "../components/NextRouter.jsx";
import LessonResultModal from "../features/typing/LessonResultModal.jsx";
import TypingAdventureHud from "../features/typing/TypingAdventureHud.jsx";
import TypingText from "../features/typing/TypingText.jsx";
import { buildResultPayload, buildTargetText } from "../features/typing/typingContent.js";
import { useTypingEngine } from "../features/typing/useTypingEngine.js";
import VirtualKeyboard from "../features/typing/VirtualKeyboard.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";
import { savePreferences } from "../services/settingsService.js";
import { useAuthStore } from "../stores/authStore.js";

const { Title, Text } = Typography;

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

export default function TypingLessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);
  const setUser = useAuthStore((store) => store.setUser);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);

  const [showKeyboard, setShowKeyboard] = useState(
    user?.preferences?.virtualKeyboard !== false
  );
  const soundEnabled = user?.preferences?.soundEnabled !== false;

  function toggleSound() {
    const nextVal = !soundEnabled;
    setUser({
      ...user,
      preferences: { ...user?.preferences, soundEnabled: nextVal },
    });
    savePreferences({ soundEnabled: nextVal }).catch(() => {});
  }

  const [sessionActive, setSessionActive] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [resultState, setResultState] = useState({ saving: false, result: null, error: "" });

  function restartLesson() {
    submittedRef.current = false;
    setResultState({ saving: false, result: null, error: "" });
    engine.reset();
    inputRef.current?.focus();
  }

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, data: await getLesson(lessonId), error: "" });
    } catch (error) {
      setState({ loading: false, data: null, error: getApiErrorMessage(error) });
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [khmerInputMode, setKhmerInputMode] = useState(() => {
    try {
      return window.localStorage.getItem("snp-khmer-input-mode") || "native";
    } catch {
      return "native";
    }
  });

  const toggleKhmerInputMode = useCallback(() => {
    setKhmerInputMode((prev) => {
      const next = prev === "native" ? "simulation" : "native";
      try {
        window.localStorage.setItem("snp-khmer-input-mode", next);
      } catch {}
      return next;
    });
  }, []);

  const targetText = useMemo(
    () => (state.data ? buildTargetText(state.data.lesson) : ""),
    [state.data]
  );
  const engine = useTypingEngine({
    targetText,
    language: state.data?.lesson.language ?? "en",
    allowBackspace: state.data?.lesson.allowBackspace ?? true,
    khmerInputMode,
  });
  const lesson = state.data?.lesson;
  const backPath =
    lesson?.language === "km"
      ? `/khmer/level/${lesson.level}`
      : `/english/level/${lesson?.level ?? 1}`;

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
    return () => {
      document.body.style.overflow = previousOverflow;
    };
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
  }, [
    engine.correctCharacters,
    engine.elapsedTime,
    engine.errors,
    engine.incorrectCharacters,
    engine.isComplete,
    engine.startedAt,
    engine.targetSegments.length,
    engine.totalTyped,
    lesson,
    resultState.saving,
    targetText.length,
  ]);

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

  if (state.loading) return <PageLoader message="Opening lesson..." />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const currentWord = getCurrentWord(engine.targetSegments, engine.currentIndex);
  const lessonProgress = engine.targetSegments.length
    ? (engine.currentIndex / engine.targetSegments.length) * 100
    : 0;
  const primarySpeed =
    lesson.language === "km"
      ? `${Math.round(engine.cpm)} CPM`
      : `${Math.round(engine.wpm)} WPM`;
  const pictures = lesson.content.blocks.filter((block) => block.kind === "picture");
  const comprehension = lesson.content.blocks.find((block) => block.question);
  const previewText = engine.targetSegments.slice(0, 180).join("");

  return (
    <div>
      {!sessionActive && (
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#52c41a] hover:underline"
          >
            <LuArrowLeft size={16} />
            <span>Back to Level Lessons</span>
          </Link>

          <Card
            variant="outlined"
            className="overflow-hidden rounded-3xl shadow-lg dark:border-slate-800"
            styles={{ body: { padding: 0 } }}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8">
              <Tag color="success" className="font-bold">
                Level {lesson.level} · Lesson {lesson.order}
              </Tag>
              <h1 className="m-0 mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {lesson.title}
              </h1>
              <p className="m-0 mt-2 max-w-3xl text-sm font-medium text-slate-500 leading-relaxed">
                {lesson.instructions}
              </p>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <LuBookOpen className="text-[#52c41a]" size={18} />
                  <h3 className="m-0 text-base font-black text-slate-900 dark:text-white">
                    Lesson Preview
                  </h3>
                </div>

                {pictures.length > 0 && (
                  <div className="mb-4 flex gap-3">
                    {pictures.slice(0, 4).map((picture, index) => (
                      <span
                        className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-4xl shadow-sm"
                        key={`${picture.answer}-${index}`}
                      >
                        {picture.image}
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5 max-h-52 overflow-hidden">
                  <p
                    className={`m-0 whitespace-pre-wrap break-words text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200 ${
                      lesson.language === "km" ? "font-sans" : ""
                    }`}
                  >
                    {previewText}
                    {engine.targetSegments.length > 180 ? "…" : ""}
                  </p>
                </div>
                <p className="m-0 mt-3 text-xs font-bold text-slate-400 flex items-center gap-1">
                  <LuClock3 size={13} className="text-[#52c41a] shrink-0" />
                  <span>The clock starts only after your first keypress.</span>
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-center">
                    <LuTarget className="mx-auto text-[#52c41a] mb-1" size={20} />
                    <p className="m-0 text-[10px] font-bold text-slate-400">Pass Accuracy</p>
                    <p className="m-0 text-base font-black text-slate-900 dark:text-white">
                      {lesson.minimumAccuracy ?? 70}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-center">
                    <LuKeyboard className="mx-auto text-sky-500 mb-1" size={20} />
                    <p className="m-0 text-[10px] font-bold text-slate-400">Typing Units</p>
                    <p className="m-0 text-base font-black text-slate-900 dark:text-white">
                      {engine.targetSegments.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-center">
                    <LuGauge className="mx-auto text-purple-500 mb-1" size={20} />
                    <p className="m-0 text-[10px] font-bold text-slate-400">Minimum Speed</p>
                    <p className="m-0 text-base font-black text-slate-900 dark:text-white">
                      {lesson.minimumSpeed ? `${lesson.minimumSpeed}+` : "Practice"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 text-center">
                    <LuClock3 className="mx-auto text-[#fa8c16] mb-1" size={20} />
                    <p className="m-0 text-[10px] font-bold text-slate-400">Time Limit</p>
                    <p className="m-0 text-base font-black text-slate-900 dark:text-white">
                      {lesson.timeLimit ? `${lesson.timeLimit}s` : "No limit"}
                    </p>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  icon={<LuMaximize2 size={16} />}
                  onClick={startLesson}
                  className="mt-5 w-full flex items-center justify-center gap-2 font-bold h-12"
                >
                  Start Fullscreen Lesson
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {sessionActive && (
        <div
          className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#f4f6f9] dark:bg-[#0f172a]"
          onClick={() => inputRef.current?.focus()}
        >
          <textarea
            {...engine.inputHandlers}
            aria-label="Typing input"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="snp-typing-input-proxy"
            ref={inputRef}
            spellCheck="false"
            tabIndex={0}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            value={engine.rawInput}
          />

          {!isInputFocused && !resultState.result && (
            <div
              onClick={() => inputRef.current?.focus()}
              className="absolute inset-x-0 top-[64px] sm:top-[68px] z-30 flex items-center justify-center p-2.5 cursor-pointer bg-amber-500/95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all select-none"
            >
              <span>Click anywhere to re-focus physical keyboard (ចុចទីនេះដើម្បីបន្តវាយ)</span>
            </div>
          )}

          {engine.englishKeyWarning && (
            <div className="absolute inset-x-4 top-[70px] z-40 flex items-center justify-center pointer-events-none transition-all">
              <div className="flex items-center gap-2 rounded-2xl bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-black shadow-xl border border-amber-600">
                <LuKeyboard size={18} />
                <span>
                  ក្ដារចុចរបស់អ្នកកំពុងស្ថិតក្នុងភាសា EN។ សូមប្ដូរទៅភាសាខ្មែរ NIDA (Alt+Shift ឬ Win+Space) ឬចុចប៊ូតុង &quot;បម្លែងពីក្ដារចុច US&quot; ខាងលើ
                </span>
              </div>
            </div>
          )}

          {/* Unified 1-Row Session Header */}
          <header className="relative shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141414] px-4 sm:px-6 shadow-xs">
            <div className="mx-auto flex h-16 sm:h-[68px] max-w-[1400px] items-center justify-between gap-3 sm:gap-4">
              
              {/* Left Section: Back button + Lesson Title & Level */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
                <Button
                  type="text"
                  shape="circle"
                  icon={<LuX size={18} />}
                  onClick={() => navigate(backPath)}
                  className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                />
                <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="min-w-0">
                  <p className="m-0 text-[10px] font-black uppercase tracking-wider text-[#52c41a] leading-none mb-1">
                    Level {lesson.level} · Lesson {lesson.order}
                  </p>
                  <h2 className="m-0 truncate text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight max-w-[160px] sm:max-w-[240px] md:max-w-[320px]">
                    {lesson.title}
                  </h2>
                </div>
              </div>

              {/* Center Section: Mascot Motivational Feedback & Streak (Single Row) */}
              <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2">
                <TypingAdventureHud inline engine={engine} language={lesson.language} />
              </div>

              {/* Right Section: Compact Metric Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
                  <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">TIME</p>
                  <p className="m-0 text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatTimer(engine.elapsedTime)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
                  <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">
                    {lesson.language === "km" ? "CPM" : "WPM"}
                  </p>
                  <p className="m-0 text-xs font-black text-[#52c41a] mt-0.5">{primarySpeed}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
                  <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">ACC</p>
                  <p className="m-0 text-xs font-black text-emerald-600 mt-0.5">
                    {Math.round(engine.accuracy)}%
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[45px] sm:min-w-[55px]">
                  <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">ERRORS</p>
                  <p className="m-0 text-xs font-black text-rose-500 mt-0.5">{engine.errors}</p>
                </div>

                {/* Restart Button */}
                <Tooltip title="Restart Lesson (ចាប់ផ្ដើមឡើងវិញ)">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<LuRotateCcw size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      restartLesson();
                    }}
                    className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  />
                </Tooltip>

                {/* Sound Toggle */}
                <Tooltip title={soundEnabled ? "Mute Sound (បិទសំឡេង)" : "Enable Sound (បើកសំឡេង)"}>
                  <Button
                    type="text"
                    shape="circle"
                    icon={soundEnabled ? <LuVolume2 size={16} /> : <LuVolumeX size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSound();
                    }}
                    className={`flex items-center justify-center ${
                      soundEnabled
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                </Tooltip>

                {/* Virtual Keyboard Toggle */}
                <Tooltip title={showKeyboard ? "Hide Keyboard" : "Show Keyboard"}>
                  <Button
                    type="text"
                    shape="circle"
                    icon={<LuKeyboard size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowKeyboard((prev) => !prev);
                    }}
                    className={`flex items-center justify-center ${
                      showKeyboard
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Bottom Progress Bar Line (Embedded seamlessly in header bottom edge) */}
            <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-[#52c41a] transition-all duration-300 rounded-r-full"
                style={{ width: `${Math.min(100, Math.max(0, lessonProgress))}%` }}
              />
            </div>
          </header>

          {/* Session Main Stage */}
          <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col p-4 sm:p-6 gap-4">
            <Card
              variant="outlined"
              className="flex min-h-[140px] flex-1 flex-col overflow-hidden rounded-2xl shadow-md dark:border-slate-800"
              styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40">
                <p className="m-0 truncate text-xs font-medium text-slate-500">
                  {lesson.instructions}
                </p>
                <div className="flex items-center gap-2">
                  <Tag color="orange" className="font-bold">
                    Target: {currentWord || "Done"}
                  </Tag>
                  {lesson.language === "km" ? (
                    <button
                      type="button"
                      onClick={toggleKhmerInputMode}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        khmerInputMode === "native"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      }`}
                      title={
                        khmerInputMode === "native"
                          ? "ក្ដារចុចពិត NIDA (OS Keyboard): វាយដោយប្រើក្ដារចុច Khmer លើកុំព្យូទ័ររបស់អ្នក។ ចុចដើម្បីប្ដូរទៅការបម្លែង US QWERTY"
                          : "បម្លែងពីក្ដារចុច US QWERTY: វាយដោយប្រើក្ដារចុច US ដោយមិនបាច់ដំឡើងក្ដារចុចខ្មែរ។ ចុចដើម្បីប្ដូរទៅក្ដារចុចពិត NIDA"
                      }
                    >
                      <LuKeyboard size={14} />
                      <span>
                        {khmerInputMode === "native"
                          ? "ក្ដារចុចពិត NIDA (OS)"
                          : "បម្លែងពី US (EN → KH)"}
                      </span>
                    </button>
                  ) : (
                    <Tag color="success" className="font-bold">
                      English QWERTY
                    </Tag>
                  )}
                </div>
              </div>

              <button
                className="relative min-h-0 flex-1 cursor-text overflow-hidden px-4 text-left sm:px-8 py-6 outline-none bg-transparent border-none"
                onClick={() => inputRef.current?.focus()}
                type="button"
              >
                <TypingText
                  currentIndex={engine.currentIndex}
                  hasCurrentError={engine.hasCurrentError}
                  language={lesson.language}
                  targetSegments={engine.targetSegments}
                  viewport
                />
              </button>
            </Card>

            {showKeyboard ? (
              <div className="shrink-0">
                <VirtualKeyboard
                  hasError={engine.hasCurrentError}
                  language={lesson.language}
                  nextText={engine.remainingText}
                  onFocusRequest={() => inputRef.current?.focus()}
                  session
                />
              </div>
            ) : (
              <Button
                onClick={() => inputRef.current?.focus()}
                className="mx-auto shrink-0 font-bold"
              >
                Physical keyboard active · Click to focus
              </Button>
            )}
          </main>
        </div>
      )}

      <LessonResultModal
        result={resultState.result}
        saving={resultState.saving}
        saveError={resultState.error}
        onRetrySave={() => {
          submittedRef.current = true;
          void submitResult();
        }}
        onTryAgain={tryAgain}
        onBack={() => navigate(backPath)}
        onNext={() => state.data.nextLesson && navigate(`/lessons/${state.data.nextLesson.id}`)}
        hasNext={Boolean(state.data.nextLesson)}
        comprehension={comprehension}
      />
    </div>
  );
}
