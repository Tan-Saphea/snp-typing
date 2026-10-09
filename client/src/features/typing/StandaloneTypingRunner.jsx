import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Tag, Tooltip } from "antd";
import {
  LuKeyboard,
  LuMaximize,
  LuMinimize,
  LuRotateCcw,
  LuVolume2,
  LuVolumeX,
  LuX,
} from "react-icons/lu";

import LessonResultModal from "./LessonResultModal.jsx";
import TypingAdventureHud from "./TypingAdventureHud.jsx";
import TypingText from "./TypingText.jsx";
import { buildResultPayload } from "./typingContent.js";
import { useTypingEngine } from "./useTypingEngine.js";
import VirtualKeyboard from "./VirtualKeyboard.jsx";
import { getApiErrorMessage } from "../../services/api.js";
import { saveLessonResult } from "../../services/resultService.js";
import { savePreferences } from "../../services/settingsService.js";
import { useAuthStore } from "../../stores/authStore.js";

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.max(0, Math.ceil(seconds % 60)).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function StandaloneTypingRunner({
  lesson,
  targetText,
  mode = "practice",
  duration = 0,
  onExit,
}) {
  const user = useAuthStore((store) => store.user);
  const setUser = useAuthStore((store) => store.setUser);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);

  // View & UX Preferences
  const soundEnabled = user?.preferences?.soundEnabled !== false;
  const [showKeyboard, setShowKeyboard] = useState(
    user?.preferences?.virtualKeyboard !== false
  );
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  function toggleSound() {
    const nextVal = !soundEnabled;
    setUser({
      ...user,
      preferences: { ...user?.preferences, soundEnabled: nextVal },
    });
    savePreferences({ soundEnabled: nextVal }).catch(() => {});
  }

  const [remaining, setRemaining] = useState(duration);
  const [isInputFocused, setIsInputFocused] = useState(true);
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

  const engine = useTypingEngine({
    targetText,
    language: lesson.language,
    allowBackspace: true,
    khmerInputMode,
  });

  const timedOut = duration > 0 && remaining <= 0 && Boolean(engine.startedAt);

  // Current target word extraction
  const currentWord = useMemo(() => {
    const raw = engine.remainingText.trimStart();
    if (!raw) return "";
    return raw.split(/\s+/)[0] ?? "";
  }, [engine.remainingText]);

  // Focus typing input proxy
  useEffect(() => {
    inputRef.current?.focus();
  }, [engine.resetVersion]);

  // Handle native browser fullscreen change listener
  useEffect(() => {
    function handleFsChange() {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  function toggleNativeFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // Timer countdown
  useEffect(() => {
    if (!duration || !engine.startedAt || resultState.result || resultState.saving) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setRemaining(
        Math.max(0, duration - (Date.now() - engine.startedAt.getTime()) / 1000)
      );
    }, 200);
    return () => window.clearInterval(timer);
  }, [duration, engine.startedAt, resultState.result, resultState.saving]);

  // Save result on finish
  const save = useCallback(async () => {
    if (submittedRef.current || engine.totalTyped === 0) return;
    submittedRef.current = true;
    setResultState({ saving: true, result: null, error: "" });
    try {
      const payload = buildResultPayload({
        lesson,
        engine,
        targetText,
        mode,
        duration: timedOut ? duration : engine.elapsedTime,
      });
      const saved = await saveLessonResult(payload);
      setResultState({ saving: false, result: saved.result, error: "" });
    } catch (error) {
      submittedRef.current = false;
      setResultState({ saving: false, result: null, error: getApiErrorMessage(error) });
    }
  }, [duration, engine, lesson, mode, targetText, timedOut]);

  useEffect(() => {
    if ((engine.isComplete || timedOut) && !submittedRef.current) {
      void save();
    }
  }, [engine.isComplete, save, timedOut]);

  function reset() {
    submittedRef.current = false;
    setRemaining(duration);
    setResultState({ saving: false, result: null, error: "" });
    engine.reset();
    inputRef.current?.focus();
  }

  const progress = engine.targetSegments.length
    ? (engine.currentIndex / engine.targetSegments.length) * 100
    : 0;

  const primarySpeed = Math.round(lesson.language === "km" ? engine.cpm : engine.wpm);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#f4f6f9] dark:bg-[#0f172a] select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden typing input proxy */}
      <textarea
        {...engine.inputHandlers}
        aria-label="Typing input proxy"
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
              ក្ដារចុចរបស់អ្នកកំពុងស្ថិតក្នុងភាសា EN។ សូមប្ដូរទៅភាសាខ្មែរ NIDA (Alt+Shift ឬ Win+Space) ឬចុចប៊ូតុង &quot;បម្លែងពីក្ដារចុច US&quot; ខាងក្រោម
            </span>
          </div>
        </div>
      )}

      {/* Unified 1-Row Session Header */}
      <header className="relative shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141414] px-4 sm:px-6 shadow-xs">
        <div className="mx-auto flex h-16 sm:h-[68px] max-w-[1400px] items-center justify-between gap-3 sm:gap-4">
          {/* Left Section: Back button + Title & Category */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <Button
              type="text"
              shape="circle"
              icon={<LuX size={18} />}
              onClick={onExit}
              className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            />
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-black uppercase tracking-wider text-[#52c41a] leading-none mb-1">
                {lesson.language === "km" ? "ខ្មែរ NIDA" : "English QWERTY"} · {mode === "practice" ? "Practice Mode" : "Typing Test"}
              </p>
              <h2 className="m-0 truncate text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight max-w-[160px] sm:max-w-[240px] md:max-w-[320px]">
                {lesson.titleKhmer || lesson.title}
              </h2>
            </div>
          </div>

          {/* Center Section: Mascot Motivational Feedback & Streak (Single Row) */}
          <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2">
            <TypingAdventureHud inline engine={engine} language={lesson.language} />
          </div>

          {/* Right Section: Compact Metric Pills & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Time / Remaining */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
              <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">
                {duration ? "LEFT" : "TIME"}
              </p>
              <p className="m-0 text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {formatClock(duration ? remaining : engine.elapsedTime)}
              </p>
            </div>

            {/* CPM / WPM */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
              <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">
                {lesson.language === "km" ? "CPM" : "WPM"}
              </p>
              <p className="m-0 text-xs font-black text-[#52c41a] mt-0.5">{primarySpeed}</p>
            </div>

            {/* Accuracy */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[50px] sm:min-w-[60px]">
              <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">ACC</p>
              <p className="m-0 text-xs font-black text-emerald-600 mt-0.5">
                {Math.round(engine.accuracy)}%
              </p>
            </div>

            {/* Errors */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1 text-center min-w-[45px] sm:min-w-[55px]">
              <p className="m-0 text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">ERRORS</p>
              <p className="m-0 text-xs font-black text-rose-500 mt-0.5">{engine.errors}</p>
            </div>

            {/* Restart Button */}
            <Tooltip title="Restart Activity (ចាប់ផ្ដើមឡើងវិញ)">
              <Button
                type="text"
                shape="circle"
                icon={<LuRotateCcw size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
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

            {/* Browser Fullscreen */}
            <Tooltip title={isNativeFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Button
                type="text"
                shape="circle"
                icon={isNativeFullscreen ? <LuMinimize size={16} /> : <LuMaximize size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNativeFullscreen();
                }}
                className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              />
            </Tooltip>

            {duration > 0 && engine.startedAt && (
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  save();
                }}
                className="font-bold rounded-xl h-8 bg-[#52c41a] hover:!bg-[#46aa16] border-0 ml-1 text-xs"
              >
                Finish
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Progress Bar Line (Embedded seamlessly in header bottom edge) */}
        <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-[#52c41a] transition-all duration-300 rounded-r-full"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </header>

      {/* Main Stage */}
      <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col p-4 sm:p-6 gap-4">
        {/* Typing Surface Card */}
        <Card
          variant="outlined"
          className="flex min-h-[140px] flex-1 flex-col overflow-hidden rounded-2xl shadow-md dark:border-slate-800"
          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
        >
          {/* Surface Top Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40">
            <p className="m-0 truncate text-xs font-medium text-slate-500">
              {lesson.instructions || "ចុចត្រង់ណាក៏បានក្នុងប្រអប់នេះដើម្បី Focus និងវាយបន្ត"}
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

          {/* Typing Text Area */}
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

        {/* On-Screen Virtual Keyboard */}
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

      {/* Result Celebration Modal */}
      <LessonResultModal
        result={resultState.result}
        saving={resultState.saving}
        saveError={resultState.error}
        onRetrySave={save}
        onTryAgain={reset}
        onBack={onExit}
        onNext={() => {}}
        hasNext={false}
      />
    </div>
  );
}
