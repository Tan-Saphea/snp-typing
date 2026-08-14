import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuCircleCheckBig,
  LuGamepad2,
  LuHeart,
  LuPause,
  LuPlay,
  LuRefreshCw,
  LuSparkles,
  LuTimer,
  LuTrophy,
} from "react-icons/lu";

import { Link, useParams } from "../components/NextRouter.jsx";
import { PageError, PageLoader } from "../components/AsyncState.jsx";
import {
  applyGameAttempt,
  applyMissedWord,
  buildGameResultPayload,
  calculateGameAccuracy,
  createGameSession,
  evaluateGameAttempt,
  getGameConfig,
  shuffledItems,
} from "../features/games/gameEngine.js";
import { playKeyboardSound } from "../features/typing/keyboardSound.js";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";
import { useAuthStore } from "../stores/authStore.js";

const pictures = {
  en: [
    ["✏️", "pencil"], ["📘", "book"], ["🎒", "school bag"],
    ["🍎", "apple"], ["🏫", "school"], ["⌨️", "keyboard"],
    ["⭐", "star"], ["🐈", "cat"], ["💧", "water"], ["🌳", "tree"],
  ],
  km: [
    ["📘", "សៀវភៅ"], ["🏫", "សាលា"], ["💧", "ទឹក"],
    ["🌳", "ដើមឈើ"], ["👩‍🏫", "គ្រូ"], ["✏️", "ខ្មៅដៃ"],
    ["🏠", "ផ្ទះ"], ["🌸", "ផ្កា"], ["🐟", "ត្រី"], ["☀️", "ព្រះអាទិត្យ"],
  ],
};

const accentClasses = {
  sky: "bg-sky-200 text-sky-900 shadow-[0_4px_0_0_#38bdf8]",
  rose: "bg-rose-200 text-rose-900 shadow-[0_4px_0_0_#fb7185]",
  amber: "bg-amber-200 text-amber-900 shadow-[0_4px_0_0_#f59e0b]",
  violet: "bg-violet-200 text-violet-900 shadow-[0_4px_0_0_#8b5cf6]",
};

function calculateStars(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

function Hearts({ lives }) {
  if (lives === null) return null;
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives left`}>
      {[1, 2, 3].map((heart) => (
        <LuHeart
          className={heart <= lives ? "text-rose-500" : "text-slate-300"}
          fill={heart <= lives ? "currentColor" : "none"}
          key={heart}
          size={20}
        />
      ))}
    </div>
  );
}

export default function WordGamePage() {
  const { game, lessonId } = useParams();
  const config = getGameConfig(game);
  const preferences = useAuthStore((state) => state.user?.preferences);
  const [loadState, setLoadState] = useState({ loading: true, lesson: null, error: "" });
  const [status, setStatus] = useState("ready");
  const [session, setSession] = useState(() => createGameSession(config));
  const [finalSession, setFinalSession] = useState(null);
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState(config?.duration ?? 45);
  const [fall, setFall] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const composing = useRef(false);
  const inputRef = useRef(null);
  const sessionRef = useRef(session);
  const startedAtRef = useRef(null);
  const elapsedRef = useRef(0);
  const finishLockRef = useRef(false);
  const missLockRef = useRef(false);
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    if (!config) {
      setLoadState({ loading: false, lesson: null, error: "This typing game does not exist." });
      return undefined;
    }

    let active = true;
    getLesson(lessonId)
      .then((value) => {
        if (active) setLoadState({ loading: false, lesson: value.lesson, error: "" });
      })
      .catch((error) => {
        if (active) setLoadState({ loading: false, lesson: null, error: getApiErrorMessage(error) });
      });
    return () => { active = false; };
  }, [config, lessonId]);

  const gameItems = useMemo(() => {
    if (!loadState.lesson) return [];
    const values = config.id === "picture-typing"
      ? pictures[loadState.lesson.language]
      : (loadState.lesson.contentItems ?? []).filter(Boolean).map((word) => ["", word]);
    return shuffledItems(values);
  }, [config, loadState.lesson]);

  const current = gameItems.length
    ? gameItems[session.index % gameItems.length]
    : ["", ""];

  const commitSession = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const showFeedback = useCallback((type, message) => {
    window.clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 850);
  }, []);

  const persistResult = useCallback(async (snapshot) => {
    if (!loadState.lesson || !startedAtRef.current) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = await saveLessonResult(buildGameResultPayload({
        lesson: loadState.lesson,
        session: snapshot,
        startedAt: startedAtRef.current,
        duration: elapsedRef.current,
      }));
      setResult(response.result);
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [loadState.lesson]);

  const finishGame = useCallback((snapshot = sessionRef.current) => {
    if (finishLockRef.current) return;
    finishLockRef.current = true;
    setFinalSession(snapshot);
    setStatus("finished");
    setInput("");
    void persistResult(snapshot);
  }, [persistResult]);

  useEffect(() => {
    if (status !== "running") return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, 0.3);
      previous = now;
      elapsedRef.current += delta;
      const nextRemaining = Math.max(0, config.duration - elapsedRef.current);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) finishGame(sessionRef.current);

      if (config.id === "falling-words") {
        const speed = 12 + Math.min(sessionRef.current.correctWords, 12) * 0.65;
        setFall((value) => Math.min(100, value + delta * speed));
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [config, finishGame, status]);

  const handleMiss = useCallback(() => {
    if (missLockRef.current || status !== "running" || !current[1]) return;
    missLockRef.current = true;
    const next = applyMissedWord(sessionRef.current, current[1], loadState.lesson.language);
    commitSession(next);
    setFall(0);
    showFeedback("wrong", `Missed: ${current[1]}`);
    window.setTimeout(() => { missLockRef.current = false; }, 120);
    if (next.lives === 0) finishGame(next);
  }, [commitSession, current, finishGame, loadState.lesson, showFeedback, status]);

  useEffect(() => {
    if (fall >= 100) handleMiss();
  }, [fall, handleMiss]);

  useEffect(() => () => {
    window.clearTimeout(feedbackTimerRef.current);
  }, []);

  function startGame() {
    const fresh = createGameSession(config);
    commitSession(fresh);
    setFinalSession(null);
    setResult(null);
    setSaveError("");
    setFeedback(null);
    setInput("");
    setRemaining(config.duration);
    setFall(0);
    elapsedRef.current = 0;
    startedAtRef.current = new Date();
    finishLockRef.current = false;
    missLockRef.current = false;
    setStatus("running");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function togglePause() {
    setStatus((value) => value === "paused" ? "running" : "paused");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submit(value = input) {
    if (status !== "running" || !current[1] || !value.trim()) return;
    const attempt = evaluateGameAttempt(
      current[1],
      value,
      loadState.lesson.language,
    );
    const next = applyGameAttempt(sessionRef.current, attempt);
    commitSession(next);
    setInput("");

    if (attempt.isCorrect) {
      setFall(0);
      showFeedback("correct", next.streak > 1 ? `${next.streak}× streak!` : "Perfect!");
      if (config.id === "picture-typing" && next.correctWords >= gameItems.length) {
        finishGame(next);
      }
    } else {
      showFeedback("wrong", "Try that word again");
    }
  }

  if (loadState.loading) return <PageLoader message="Loading your game…" />;
  if (loadState.error) return <PageError message={loadState.error} />;
  if (!gameItems.length) return <PageError message="This game does not have any words yet. Add game content to the built-in curriculum." />;

  const snapshot = finalSession ?? session;
  const accuracy = calculateGameAccuracy(snapshot);
  const stars = result?.stars ?? calculateStars(accuracy);
  const calculatedSpeed = loadState.lesson.language === "km"
    ? Math.round(snapshot.correctUnits / Math.max(elapsedRef.current / 60, 1 / 600))
    : Math.round(snapshot.correctUnits / 5 / Math.max(elapsedRef.current / 60, 1 / 600));
  const speed = Math.round(
    loadState.lesson.language === "km"
      ? (result?.cpm ?? calculatedSpeed)
      : (result?.wpm ?? calculatedSpeed),
  );
  const timerPercent = Math.max(0, (remaining / config.duration) * 100);

  if (status === "finished") {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="snp-game-result relative overflow-hidden p-6 text-center sm:p-9">
          <div className="pointer-events-none absolute left-8 top-8 text-4xl opacity-50">✦</div><div className="pointer-events-none absolute right-10 top-16 text-3xl opacity-40">★</div>
          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-slate-900 bg-emerald-300 text-4xl text-emerald-950 shadow-[0_5px_0_0_#059669]"><LuTrophy /></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-primary-600">Round complete</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-900">Great typing!</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">You completed {snapshot.correctWords} words with a best streak of {snapshot.bestStreak}.</p>
            <div className="mt-5 flex justify-center gap-1 text-3xl text-amber-400" aria-label={`${stars} stars`}>{[1, 2, 3].map((star) => <span className={star <= stars ? "" : "text-slate-200"} key={star}>★</span>)}</div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Game score", snapshot.score], ["Accuracy", `${Math.round(accuracy)}%`], [loadState.lesson.language === "km" ? "Speed CPM" : "Speed WPM", speed], ["Best streak", `${snapshot.bestStreak}×`]].map(([label, value]) => <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[0_3px_0_0_#cbd5e1]" key={label}><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>)}
            </div>

            {saving && <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />Saving score…</p>}
            {!saving && !saveError && result && <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><LuCircleCheckBig />Score saved to your progress</p>}
            {saveError && <div className="mx-auto mt-5 max-w-lg rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700"><p>{saveError}</p><button className="mt-3 inline-flex items-center gap-2 underline" disabled={saving} onClick={() => void persistResult(snapshot)} type="button"><LuRefreshCw />Retry save</button></div>}

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button className="snp-button-primary" onClick={startGame} type="button"><LuRefreshCw />Play again</button><Link className="snp-button-secondary" to="/games"><LuGamepad2 />Choose another game</Link></div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" to="/games"><LuArrowLeft />Back to arcade</Link>
        <div className="flex items-center gap-3"><Hearts lives={session.lives} />{status !== "ready" && <button className="snp-button-secondary min-h-10 px-4 py-2 text-sm" onClick={togglePause} type="button">{status === "paused" ? <><LuPlay />Resume</> : <><LuPause />Pause</>}</button>}</div>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">{loadState.lesson.language === "km" ? "Khmer typing game" : "English typing game"}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{config.title}</h1><p className="mt-2 text-sm font-medium text-slate-500">{config.instruction}</p></div>
        <div className="flex gap-2"><div className="snp-game-stat"><LuTrophy className="text-amber-500" /><span><small>Score</small><b>{session.score}</b></span></div><div className="snp-game-stat"><LuSparkles className="text-violet-500" /><span><small>Streak</small><b>{session.streak}×</b></span></div><div className="snp-game-stat"><LuTimer className="text-sky-500" /><span><small>Time</small><b>{Math.ceil(remaining)}s</b></span></div></div>
      </header>

      <div className="h-3 overflow-hidden rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#cbd5e1]" aria-label={`${Math.ceil(remaining)} seconds remaining`} role="progressbar" aria-valuemax={config.duration} aria-valuemin="0" aria-valuenow={Math.ceil(remaining)}><div className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-500 transition-[width] duration-100" style={{ width: `${timerPercent}%` }} /></div>

      <section className="snp-game-stage relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.055]" style={{ backgroundImage: "linear-gradient(#172033 1px, transparent 1px), linear-gradient(90deg, #172033 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {status === "ready" && <div className="absolute inset-0 z-20 grid place-items-center bg-white/80 p-5 text-center backdrop-blur-sm"><div className="max-w-md"><div className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-slate-900 text-4xl ${accentClasses[config.accent]}`}>{config.icon}</div><h2 className="mt-6 text-3xl font-black tracking-tight">Ready to play?</h2><p className="mt-3 text-sm leading-6 text-slate-600">{config.description} You have {config.duration} seconds.</p><button className="snp-button-primary mt-6 min-w-48" onClick={startGame} type="button"><LuPlay fill="currentColor" />Start game</button></div></div>}
        {status === "paused" && <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/70 p-5 text-center text-white backdrop-blur-sm"><div><LuPause className="mx-auto" size={48} /><h2 className="mt-4 text-3xl font-black">Game paused</h2><p className="mt-2 text-slate-300">Your timer and falling word are frozen.</p><button className="snp-button-primary mt-6" onClick={togglePause} type="button"><LuPlay />Keep playing</button></div></div>}

        {config.id === "falling-words" && <><div className="absolute inset-x-8 bottom-14 border-t-4 border-dashed border-rose-300"><span className="absolute -top-8 right-0 text-xs font-black uppercase tracking-wider text-rose-500">Danger zone</span></div><div className="snp-falling-word absolute left-1/2 z-10 -translate-x-1/2" style={{ top: `${Math.min(82, fall)}%` }}>{current[1]}</div></>}
        {config.id === "balloon-typing" && <div className="absolute inset-0 grid place-items-center"><div className="snp-game-balloon"><span>{current[1]}</span><i /></div></div>}
        {config.id === "picture-typing" && <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">What is this?</p><div className="mt-3 text-8xl drop-shadow-lg sm:text-9xl">{current[0]}</div><p className="mt-4 text-sm font-bold text-slate-500">Picture {Math.min(session.correctWords + 1, gameItems.length)} of {gameItems.length}</p></div></div>}
        {config.id === "speed-challenge" && <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Type this word</p><div className="mt-4 rounded-3xl border-2 border-slate-900 bg-violet-200 px-8 py-5 text-4xl font-black text-violet-950 shadow-[0_6px_0_0_#8b5cf6] sm:text-6xl">{current[1]}</div><p className="mt-6 text-xs font-bold text-slate-400">Next: {gameItems[(session.index + 1) % gameItems.length][1]}</p></div></div>}

        {feedback && <div className={`absolute left-1/2 top-5 z-30 -translate-x-1/2 rounded-full border-2 border-slate-900 px-5 py-2 text-sm font-black shadow-[0_3px_0_0_#172033] ${feedback.type === "correct" ? "bg-emerald-300 text-emerald-950" : "bg-rose-200 text-rose-950"}`} role="status">{feedback.type === "correct" ? "✓" : "×"} {feedback.message}</div>}
      </section>

      <form className="snp-card p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <label className="snp-label" htmlFor="game-answer">Type the answer and press Enter</label>
        <div className="flex flex-col gap-3 sm:flex-row"><input ref={inputRef} autoComplete="off" autoCorrect="off" className={`snp-input min-h-14 flex-1 text-center text-xl font-black ${loadState.lesson.language === "km" ? "font-sans" : "tracking-wide"}`} disabled={status !== "running"} id="game-answer" lang={loadState.lesson.language} onChange={(event) => { const value = event.target.value; setInput(value); if (loadState.lesson.language === "en" && !composing.current && !current[1].includes(" ") && value.endsWith(" ")) submit(value); }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={(event) => playKeyboardSound({ enabled: preferences?.soundEnabled ?? true, key: event.key, style: preferences?.soundStyle ?? "soft", volume: preferences?.soundVolume ?? 0.35 })} placeholder={status === "ready" ? "Press Start to begin" : status === "paused" ? "Game paused" : "Type here…"} spellCheck="false" value={input} /><button className="snp-button-primary min-w-32" disabled={status !== "running" || !input.trim()} type="submit">Submit <span aria-hidden="true">↵</span></button></div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500"><span>Words: <b className="text-slate-800">{session.correctWords}</b></span><span>Accuracy: <b className="text-slate-800">{Math.round(calculateGameAccuracy(session))}%</b></span><span>Errors: <b className="text-slate-800">{session.errors}</b></span><span>Best streak: <b className="text-slate-800">{session.bestStreak}×</b></span></div>
      </form>
    </div>
  );
}
