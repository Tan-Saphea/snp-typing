import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Progress,
  Tag,
  Typography,
} from "antd";
import {
  LuArrowLeft,
  LuCompass,
  LuFlame,
  LuGamepad2,
  LuGhost,
  LuKeyboard,
  LuMaximize,
  LuMinimize,
  LuPause,
  LuPickaxe,
  LuPlay,
  LuRotateCcw,
  LuSparkles,
  LuTimer,
  LuTrophy,
  LuVolume2,
  LuVolumeX,
  LuZap,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { Link, useParams } from "../components/NextRouter.jsx";
import Stars from "../components/Stars.jsx";
import GhostCatcherGame from "../features/games/GhostCatcherGame.jsx";
import MinecraftMinerGame from "../features/games/MinecraftMinerGame.jsx";
import RobloxObbyGame from "../features/games/RobloxObbyGame.jsx";
import {
  isGameSoundMuted,
  playGameSound,
  setGameSoundMuted,
} from "../features/games/gameAudio.js";
import {
  GAME_THEMED_WORDS,
  MAX_GAME_LEVEL,
  advanceGameLevel,
  buildGameResultPayload,
  calculateGameAccuracy,
  createGameSession,
  filterWordsForLevel,
  getGameConfig,
  getLevelConfig,
} from "../features/games/gameEngine.js";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";

function calculateStars(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

const gameVisuals = {
  "minecraft-miner": LuPickaxe,
  "roblox-obby": LuCompass,
  "ghost-catcher": LuGhost,
};

export default function WordGamePage() {
  const { game, lessonId } = useParams();
  const config = getGameConfig(game);

  const [loadState, setLoadState] = useState({ loading: true, lesson: null, error: "" });
  const [status, setStatus] = useState("ready");
  const [session, setSession] = useState(() => createGameSession(config));
  const [finalSession, setFinalSession] = useState(null);
  const [difficulty, setDifficulty] = useState("normal"); // casual (75s), normal (60s), speedrun (40s)
  const [crtMode, setCrtMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remaining, setRemaining] = useState(config?.duration ?? 60);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [soundMuted, setSoundMuted] = useState(() => isGameSoundMuted());
  const [levelUpCelebration, setLevelUpCelebration] = useState(null);

  const arcadeWrapperRef = useRef(null);
  const sessionRef = useRef(session);
  const startedAtRef = useRef(null);
  const elapsedRef = useRef(0);
  const finishLockRef = useRef(false);
  const feedbackTimerRef = useRef(null);
  const levelUpTimerRef = useRef(null);

  const getDifficultyDuration = useCallback(() => {
    if (difficulty === "casual") return 75;
    if (difficulty === "speedrun") return 40;
    return config?.duration ?? 60;
  }, [config?.duration, difficulty]);

  const enterFullscreen = useCallback(() => {
    const wrapper = arcadeWrapperRef.current;
    if (!document.fullscreenElement) {
      if (wrapper?.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement || isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (event) => {
      if (event.key === "F11") {
        event.preventDefault();
        toggleFullscreen();
      }
      if (status === "ready" && event.key === "Enter") {
        event.preventDefault();
        startGame();
      }
      if (event.key === "Escape" && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, status, toggleFullscreen]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!config) {
      setLoadState({ loading: false, lesson: null, error: "This game mode is not available." });
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
    return () => {
      active = false;
    };
  }, [config, lessonId]);

  const gameWords = useMemo(() => {
    if (!loadState.lesson || !config) return [];
    const themedList = GAME_THEMED_WORDS[config.id]?.[loadState.lesson.language] || [];
    const lessonList = (loadState.lesson.contentItems ?? []).filter(Boolean);
    const combined = Array.from(new Set([...themedList, ...lessonList]));
    return combined.length ? combined : ["typing", "hero", "speed", "quest"];
  }, [config, loadState.lesson]);

  const currentLevelConfig = useMemo(() => {
    return getLevelConfig(config?.id, session.level || 1);
  }, [config?.id, session.level]);

  const activeLevelWords = useMemo(() => {
    return filterWordsForLevel(
      gameWords,
      session.level || 1,
      loadState.lesson?.language || "en"
    );
  }, [gameWords, loadState.lesson?.language, session.level]);

  const commitSession = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const showFeedback = useCallback((type, message) => {
    window.clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 850);
  }, []);

  const persistResult = useCallback(
    async (snapshot) => {
      if (!loadState.lesson || !startedAtRef.current) return;
      setSaving(true);
      setSaveError("");
      try {
        const response = await saveLessonResult(
          buildGameResultPayload({
            lesson: loadState.lesson,
            session: snapshot,
            startedAt: startedAtRef.current,
            duration: elapsedRef.current,
          })
        );
        setResult(response.result);
      } catch (error) {
        setSaveError(getApiErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [loadState.lesson]
  );

  const finishGame = useCallback(
    (snapshot = sessionRef.current) => {
      if (finishLockRef.current) return;
      finishLockRef.current = true;
      setFinalSession(snapshot);
      setStatus("finished");
      void persistResult(snapshot);
    },
    [persistResult]
  );

  // Main countdown timer loop
  useEffect(() => {
    if (status !== "running" || !config) return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, 0.3);
      previous = now;
      elapsedRef.current += delta;
      const targetDuration = getDifficultyDuration();
      const nextRemaining = Math.max(0, targetDuration - elapsedRef.current);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) finishGame(sessionRef.current);
    }, 100);
    return () => window.clearInterval(timer);
  }, [config, finishGame, getDifficultyDuration, status]);

  const handleScore = useCallback(
    (points = 50, units = 1, isWordCompleted = true) => {
      const cur = sessionRef.current;
      const nextStreak = cur.streak + 1;

      if (isWordCompleted) {
        const levelResult = advanceGameLevel(cur, config?.id);
        const next = {
          ...levelResult.session,
          score: cur.score + points,
          correctUnits: cur.correctUnits + (units || 1),
          typedUnits: cur.typedUnits + (units || 1),
          correctWords: cur.correctWords + 1,
          totalWords: cur.totalWords + 1,
          streak: nextStreak,
          bestStreak: Math.max(cur.bestStreak, nextStreak),
        };
        commitSession(next);

        if (levelResult.leveledUp) {
          playGameSound("level_up", 0.8);
          setRemaining((prev) => prev + levelResult.timeBonus);
          setLevelUpCelebration({
            level: levelResult.newLevel,
            config: levelResult.levelConfig,
            timeBonus: levelResult.timeBonus,
          });
          window.clearTimeout(levelUpTimerRef.current);
          levelUpTimerRef.current = window.setTimeout(() => {
            setLevelUpCelebration(null);
          }, 2400);
        } else {
          showFeedback("correct", nextStreak > 1 ? `${nextStreak}× STREAK!` : `+${points}`);
        }
      } else {
        const next = {
          ...cur,
          score: cur.score + points,
          correctUnits: cur.correctUnits + (units || 1),
          typedUnits: cur.typedUnits + (units || 1),
        };
        commitSession(next);
      }
    },
    [commitSession, config?.id, showFeedback]
  );

  const handleMiss = useCallback(
    (missCount = 1) => {
      const cur = sessionRef.current;
      const nextLives = cur.lives !== null ? Math.max(0, cur.lives - missCount) : null;
      const next = {
        ...cur,
        incorrectUnits: cur.incorrectUnits + missCount,
        typedUnits: cur.typedUnits + missCount,
        streak: 0,
        lives: nextLives,
      };
      commitSession(next);
      showFeedback("wrong", nextLives === 0 ? "OUT OF HEARTS" : "MISSED");
      if (nextLives === 0) {
        finishGame(next);
      }
    },
    [commitSession, finishGame, showFeedback]
  );

  useEffect(() => () => {
    window.clearTimeout(feedbackTimerRef.current);
    window.clearTimeout(levelUpTimerRef.current);
  }, []);

  function startGame() {
    // Automatically launch game in fullscreen mode on click
    enterFullscreen();
    const fresh = createGameSession(config);
    commitSession(fresh);
    setFinalSession(null);
    setResult(null);
    setSaveError("");
    setFeedback(null);
    setLevelUpCelebration(null);
    window.clearTimeout(levelUpTimerRef.current);
    const duration = getDifficultyDuration();
    setRemaining(duration);
    elapsedRef.current = 0;
    startedAtRef.current = new Date();
    finishLockRef.current = false;
    setStatus("running");
  }

  function togglePause() {
    setStatus((value) => (value === "paused" ? "running" : "paused"));
  }

  function toggleMute() {
    const next = !soundMuted;
    setSoundMuted(next);
    setGameSoundMuted(next);
  }

  if (loadState.loading) return <PageLoader message="Loading game arcade…" />;
  if (loadState.error) return <PageError message={loadState.error} />;
  if (!gameWords.length) {
    return (
      <PageError message="This game does not contain words yet. Please select another mode." />
    );
  }

  const snapshot = finalSession ?? session;
  const accuracy = calculateGameAccuracy(snapshot);
  const stars = result?.stars ?? calculateStars(accuracy);
  const calculatedSpeed =
    loadState.lesson.language === "km"
      ? Math.round(snapshot.correctUnits / Math.max(elapsedRef.current / 60, 1 / 600))
      : Math.round(snapshot.correctUnits / 5 / Math.max(elapsedRef.current / 60, 1 / 600));
  const speed = Math.round(
    loadState.lesson.language === "km"
      ? result?.cpm ?? calculatedSpeed
      : result?.wpm ?? calculatedSpeed
  );
  const timerPercent = Math.max(0, (remaining / config.duration) * 100);
  const GameCoverIcon = gameVisuals[config.id] || LuGamepad2;
  const isTimeUrgent = remaining <= 10;

  return (
    <div
      ref={arcadeWrapperRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-2 sm:p-4 w-screen h-screen overflow-hidden select-none"
          : "mx-auto max-w-4xl space-y-4 select-none"
      }
    >
      {/* Top Arcade Navigation & Quick Controls */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <Link
          to="/games"
          onClick={exitFullscreen}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <LuArrowLeft size={16} />
          <span>Exit Arcade</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Fullscreen Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isFullscreen
                ? "border-emerald-400 bg-emerald-950/80 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                : "border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc / F11)" : "Enter Fullscreen (F11)"}
          >
            {isFullscreen ? <LuMinimize size={14} /> : <LuMaximize size={14} />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          {/* Quick Sound Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            title={soundMuted ? "Unmute Game Audio" : "Mute Game Audio"}
          >
            {soundMuted ? <LuVolumeX size={14} className="text-rose-400" /> : <LuVolume2 size={14} className="text-emerald-400" />}
            <span className="hidden sm:inline">{soundMuted ? "Muted" : "Sound On"}</span>
          </button>

          {/* Retro CRT Scanline Filter Toggle */}
          <button
            type="button"
            onClick={() => setCrtMode(!crtMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              crtMode
                ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                : "border-slate-700 bg-slate-900/80 text-slate-400 hover:text-white"
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            <span>CRT Mode</span>
            <span className={`w-2 h-2 rounded-full ${crtMode ? "bg-cyan-400 animate-ping" : "bg-slate-600"}`} />
          </button>

          {status === "running" && (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <LuPause size={13} />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={startGame}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                <LuRotateCcw size={13} />
                <span>Restart</span>
              </button>
            </>
          )}
        </div>
      </div>

      {status === "finished" ? (
        <div className="mx-auto max-w-2xl py-6 select-none my-auto w-full">
          <Card
            variant="outlined"
            className="rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5),0_6px_0_0_#0f172a] text-center p-6 sm:p-10 border-4 border-slate-900 dark:border-slate-700 bg-slate-900/95 text-white"
          >
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-amber-500/20 text-5xl text-amber-400 mb-4 border-2 border-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.5)] animate-bounce">
              <LuTrophy size={48} />
            </div>

            <Tag color="gold" className="font-black uppercase tracking-wider rounded-lg px-3 py-0.5 text-xs">
              ROUND COMPLETE
            </Tag>
            <h2 className="m-0 mt-3 text-3xl sm:text-4xl font-black text-white">
              Awesome Typing!
            </h2>
            <p className="m-0 mt-2 text-sm text-slate-300">
              {config.title} · {loadState.lesson.language === "km" ? "Khmer NIDA Track" : "English Track"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Tag color="purple" className="font-black uppercase tracking-wider rounded-lg px-3 py-1 text-xs flex items-center gap-1.5">
                <LuTrophy size={14} className="text-amber-400" />
                <span>Highest Stage: Level {snapshot.level || 1} / {snapshot.maxLevel || 5}</span>
              </Tag>
              {(snapshot.levelUps || 0) > 0 && (
                <Tag color="cyan" className="font-black uppercase tracking-wider rounded-lg px-3 py-1 text-xs flex items-center gap-1.5">
                  <LuSparkles size={14} className="text-cyan-300" />
                  <span>{snapshot.levelUps} Stage Upgrades</span>
                </Tag>
              )}
            </div>

            <div className="my-6 flex justify-center scale-125">
              <Stars count={stars} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-left">
              <div className="rounded-2xl border-2 border-slate-800 p-4 bg-slate-950/80 shadow-md">
                <p className="m-0 text-xs font-bold text-slate-400 uppercase">Score</p>
                <p className="m-0 text-2xl font-black text-[#52c41a]">{snapshot.score}</p>
              </div>
              <div className="rounded-2xl border-2 border-slate-800 p-4 bg-slate-950/80 shadow-md">
                <p className="m-0 text-xs font-bold text-slate-400 uppercase">Speed</p>
                <p className="m-0 text-2xl font-black text-white">
                  {speed} <span className="text-xs font-bold text-slate-400">{loadState.lesson.language === "km" ? "CPM" : "WPM"}</span>
                </p>
              </div>
              <div className="rounded-2xl border-2 border-slate-800 p-4 bg-slate-950/80 shadow-md">
                <p className="m-0 text-xs font-bold text-slate-400 uppercase">Accuracy</p>
                <p className="m-0 text-2xl font-black text-sky-400">{Math.round(accuracy)}%</p>
              </div>
              <div className="rounded-2xl border-2 border-slate-800 p-4 bg-slate-950/80 shadow-md">
                <p className="m-0 text-xs font-bold text-slate-400 uppercase">Best Streak</p>
                <p className="m-0 text-2xl font-black text-amber-400">{snapshot.bestStreak}×</p>
              </div>
            </div>

            {saveError && (
              <Alert title="Sync Notice" description={saveError} type="warning" showIcon className="mb-6 rounded-xl text-left" />
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="primary"
                size="large"
                icon={<LuRotateCcw size={18} />}
                onClick={startGame}
                className="font-black px-8 h-12 rounded-xl text-base shadow-[0_4px_0_0_#15803d]"
              >
                Play Again
              </Button>
              <Link to="/games" onClick={exitFullscreen}>
                <Button size="large" className="font-bold px-6 h-12 rounded-xl text-base bg-slate-800 text-white border-slate-700">
                  Back to Arcade
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        /* Deluxe Neo-Brutalist Arcade Machine Chassis */
        <div
          className={`relative rounded-3xl border-4 border-slate-900 dark:border-slate-700 bg-slate-950 shadow-[0_20px_45px_rgba(0,0,0,0.5),0_8px_0_0_#0f172a] overflow-hidden flex flex-col ${
            isFullscreen ? "flex-1 h-full max-h-screen" : ""
          }`}
        >
        {/* Top Arcade Marquee & Digital HUD */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b-2 border-slate-800 text-white">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-black text-sm tracking-wider uppercase text-white flex items-center gap-1.5">
              <LuGamepad2 className="text-cyan-400" size={16} />
              <span>{config.title}</span>
            </span>
            <Tag color="cyan" className="font-bold text-[10px] uppercase rounded-md m-0">
              {loadState.lesson.language === "km" ? "Khmer NIDA Track" : "English QWERTY"}
            </Tag>

            {/* Level & Stage Progress Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-200">
              <LuTrophy className="text-amber-400" size={13} />
              <span className="font-black text-xs text-white">
                LVL {session.level || 1}/{session.maxLevel || 5}
              </span>
              <span className="text-[10px] text-violet-300 font-bold hidden md:inline">
                ({currentLevelConfig?.title || "Stage"})
              </span>
              <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                {session.levelWordsCompleted || 0}/{session.levelWordsTarget || 3}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Clock with Color Urgency */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-black text-xs border ${
                isTimeUrgent
                  ? "border-rose-500 bg-rose-950/80 text-rose-300 animate-pulse"
                  : remaining <= 20
                  ? "border-amber-500 bg-amber-950/80 text-amber-300"
                  : "border-slate-700 bg-slate-900/80 text-emerald-300"
              }`}
            >
              <LuTimer size={14} />
              <span>{Math.ceil(remaining)}s</span>
            </div>

            {/* Streak Multiplier */}
            {session.streak > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black animate-pulse">
                <LuFlame size={14} className="text-amber-400" />
                <span>{session.streak}×</span>
              </div>
            )}
          </div>
        </div>

        {/* Segmented Timer Progress Bar */}
        <div className="w-full bg-slate-900 h-2">
          <div
            className={`h-full transition-all duration-200 ${
              isTimeUrgent ? "bg-rose-500" : remaining <= 20 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Main Interactive Game Arena */}
        <div className={`relative ${isFullscreen ? "flex-1 h-full flex flex-col min-h-[500px]" : ""}`}>
          {/* Retro CRT Scanline Shader Overlay */}
          {crtMode && (
            <div className="absolute inset-0 pointer-events-none z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-45 mix-blend-overlay" />
          )}

          {/* Level Up Celebration Fullscreen Overlay */}
          {levelUpCelebration && (
            <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/85 backdrop-blur-md p-6 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.6)] text-center text-white">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] animate-bounce mb-3">
                  <LuTrophy size={42} />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-xs uppercase tracking-widest mb-2">
                  <LuSparkles size={14} />
                  <span>STAGE UNLOCKED</span>
                  <LuSparkles size={14} />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider m-0">
                  LEVEL {levelUpCelebration.level} REACHED!
                </h2>

                <p className="text-base font-black text-cyan-300 mt-1 mb-2">
                  {levelUpCelebration.config?.title}
                </p>

                <p className="text-xs text-slate-300 m-0 mb-4 max-w-xs mx-auto">
                  {levelUpCelebration.config?.description}
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <LuZap size={16} />
                  <span>+{levelUpCelebration.timeBonus}s Arcade Bonus Added!</span>
                </div>
              </div>
            </div>
          )}

          {/* Game Ready Title Screen Overlay */}
          {status === "ready" && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/90 p-6 text-center backdrop-blur-md">
              <div className="max-w-md text-white">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white mb-4 shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-white/20 animate-bounce">
                  <GameCoverIcon size={48} />
                </div>
                <h3 className="m-0 text-3xl font-black text-white tracking-wide uppercase">
                  {config.title}
                </h3>
                <p className="m-0 mt-2 text-sm text-slate-300 leading-relaxed">
                  {config.description} You have <b>{getDifficultyDuration()} seconds</b> on the arcade clock.
                </p>

                {/* Difficulty Mode Selector */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {[
                    ["casual", "Casual · 75s", "border-emerald-500 text-emerald-300"],
                    ["normal", "Standard · 60s", "border-cyan-500 text-cyan-300"],
                    ["speedrun", "Speedrun · 40s", "border-rose-500 text-rose-300"],
                  ].map(([mode, label, colorClass]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setDifficulty(mode);
                        const dur = mode === "casual" ? 75 : mode === "speedrun" ? 40 : 60;
                        setRemaining(dur);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        difficulty === mode
                          ? `bg-slate-900 shadow-md ${colorClass} ring-2 ring-white/30 scale-105`
                          : "border-slate-800 text-slate-400 bg-slate-950/60 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-cyan-300">
                  <LuSparkles size={14} />
                  <span>Direct physical keyboard control · Auto full-screen mode (F11 to toggle)</span>
                </div>

                <Button
                  type="primary"
                  size="large"
                  icon={<LuPlay size={20} />}
                  onClick={startGame}
                  className="mt-6 font-black px-10 h-14 rounded-2xl text-lg shadow-[0_6px_0_0_#15803d]"
                >
                  START GAME
                </Button>
              </div>
            </div>
          )}

          {/* Game Paused Overlay */}
          {status === "paused" && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/90 p-6 text-center text-white backdrop-blur-md">
              <div>
                <LuPause className="mx-auto text-amber-400 mb-3 animate-pulse" size={54} />
                <h3 className="m-0 text-3xl font-black text-white uppercase tracking-wider">Game Paused</h3>
                <p className="m-0 mt-1 text-sm text-slate-300">Countdown timer and animations frozen.</p>
                <Button
                  type="primary"
                  size="large"
                  icon={<LuPlay size={18} />}
                  onClick={togglePause}
                  className="mt-6 font-black px-8 h-12 rounded-xl text-base shadow-[0_4px_0_0_#15803d]"
                >
                  RESUME GAME
                </Button>
              </div>
            </div>
          )}

          {/* Render Active Distinct Kid Game Viewport */}
          {config.id === "minecraft-miner" && (
            <MinecraftMinerGame
              isFullscreen={isFullscreen}
              language={loadState.lesson.language}
              onMiss={handleMiss}
              onScore={handleScore}
              session={session}
              status={status}
              words={activeLevelWords}
            />
          )}

          {config.id === "roblox-obby" && (
            <RobloxObbyGame
              isFullscreen={isFullscreen}
              language={loadState.lesson.language}
              onMiss={handleMiss}
              onScore={handleScore}
              session={session}
              status={status}
              words={activeLevelWords}
            />
          )}

          {config.id === "ghost-catcher" && (
            <GhostCatcherGame
              isFullscreen={isFullscreen}
              language={loadState.lesson.language}
              onMiss={handleMiss}
              onScore={handleScore}
              session={session}
              status={status}
              words={activeLevelWords}
            />
          )}
        </div>

        {/* Floating Feedback Toast */}
        {feedback && (
          <div className="absolute top-16 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div
              className={`px-6 py-2 rounded-2xl text-sm font-black shadow-2xl animate-bounce tracking-wide uppercase ${
                feedback.type === "correct"
                  ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.8)] border border-emerald-300"
                  : "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.8)] border border-rose-300"
              }`}
            >
              {feedback.message}
            </div>
          </div>
        )}

        {/* Integrated Arcade Deck Console (Direct Keyboard Mode) */}
        {status === "running" && (
          <div className="px-5 py-3.5 bg-slate-900 border-t-2 border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
            <div className="flex items-center gap-2 text-cyan-400">
              <LuKeyboard size={16} />
              <span className="font-black tracking-wide">
                Direct Keyboard Active · Type letters to play
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Track: <b className="text-white">{loadState.lesson.language === "km" ? "Khmer NIDA" : "English QWERTY"}</b>
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline">
                Streak: <b className="text-amber-400">{session.streak}×</b>
              </span>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
