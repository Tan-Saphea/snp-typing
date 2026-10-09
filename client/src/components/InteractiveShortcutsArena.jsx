import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button, Input, Modal, Progress, Tag, Tooltip } from "antd";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuClock,
  LuFlame,
  LuKeyboard,
  LuMaximize,
  LuMinimize,
  LuPlay,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTimer,
  LuTrophy,
  LuVolume2,
  LuVolumeX,
  LuX,
  LuZap,
} from "react-icons/lu";

import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "./LearningCategoryCard.jsx";
import MetricCard from "./MetricCard.jsx";
import {
  shortcutCategories,
  shortcutDrills,
  getShortcutsByCategory,
} from "../data/shortcutDrills.js";
import { playKeyboardSound } from "../features/typing/keyboardSound.js";

// Synthesized audio feedback
function playSound(type, isMuted = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "streak") {
      [587.33, 739.99, 880.0, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "complete") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.28);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.28);
      });
    }
  } catch (e) {}
}

export default function InteractiveShortcutsArena() {
  const containerRef = useRef(null);

  // Active category & session state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDrills, setActiveDrills] = useState([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [floatingXp, setFloatingXp] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [savedShortcutScores, setSavedShortcutScores] = useState({});

  // Active keys pressed by the user in real-time
  const [pressedKeys, setPressedKeys] = useState(new Set());

  // Load scores & preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("snp_shortcut_arena_progress");
      if (saved) setSavedShortcutScores(JSON.parse(saved));
      const muted = localStorage.getItem("snp_digital_quiz_muted");
      if (muted !== null) setIsMuted(muted === "true");
    } catch (e) {}
  }, []);

  // Browser fullscreen changes listener
  useEffect(() => {
    function handleFsChange() {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Timer
  useEffect(() => {
    if (!selectedCategory || isCompleted) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedCategory, isCompleted]);

  // Toggle Mute
  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("snp_digital_quiz_muted", String(next));
      } catch (e) {}
      return next;
    });
  }

  // Toggle Native Browser Fullscreen
  function toggleBrowserFullscreen() {
    if (!document.fullscreenElement) {
      const elem = containerRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // Category Filter & Search State
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Start Shortcut Session (with optional limit or randomized marathon)
  function startShortcutSession(category, count = null) {
    let drills;
    if (category.id === "marathon") {
      // Pick randomized mixed drills
      const shuffled = [...shortcutDrills].sort(() => 0.5 - Math.random());
      drills = shuffled.slice(0, count || 15);
    } else {
      const allCategoryDrills = getShortcutsByCategory(category.id);
      const shuffled = [...allCategoryDrills].sort(() => 0.5 - Math.random());
      drills = count ? shuffled.slice(0, count) : shuffled;
    }

    setSelectedCategory(category);
    setActiveDrills(drills);
    setCurrentDrillIndex(0);
    setIsSuccess(false);
    setIsError(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setXp(0);
    setFloatingXp(null);
    setIsCompleted(false);
    setSessionSeconds(0);
    setShowQuitConfirm(false);
    setPressedKeys(new Set());
  }

  // Advance to next drill
  const advanceDrill = useCallback(() => {
    if (currentDrillIndex < activeDrills.length - 1) {
      setCurrentDrillIndex((prev) => prev + 1);
      setIsSuccess(false);
      setIsError(false);
      setPressedKeys(new Set());
    } else {
      playSound("complete", isMuted);
      setIsCompleted(true);

      const finalScore = score + 1;
      const total = activeDrills.length;
      const pct = Math.round((finalScore / total) * 100);
      const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;

      if (selectedCategory && selectedCategory.id !== "marathon") {
        const updated = {
          ...savedShortcutScores,
          [selectedCategory.id]: {
            bestStars: Math.max(savedShortcutScores[selectedCategory.id]?.bestStars || 0, stars),
            bestScore: Math.max(savedShortcutScores[selectedCategory.id]?.bestScore || 0, finalScore),
            totalDrills: total,
            lastPlayedAt: new Date().toISOString(),
          },
        };
        setSavedShortcutScores(updated);
        try {
          localStorage.setItem("snp_shortcut_arena_progress", JSON.stringify(updated));
        } catch (e) {}
      }
    }
  }, [currentDrillIndex, activeDrills.length, score, selectedCategory, savedShortcutScores, isMuted]);

  // Robust Key Combination Matcher
  useEffect(() => {
    if (!selectedCategory || isCompleted) return;

    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!e.repeat && !["Dead", "Process", "Unidentified"].includes(e.key)) {
        playKeyboardSound({ key: e.key, code: e.code });
      }

      const currentDrill = activeDrills[currentDrillIndex];
      if (!currentDrill) return;

      // Handle Fullscreen 'F' shortcut
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !isSuccess) {
        if (!currentDrill.keys.includes("f")) {
          e.preventDefault();
          toggleBrowserFullscreen();
          return;
        }
      }

      // Handle Mute 'M' shortcut
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey && !isSuccess) {
        if (!currentDrill.keys.includes("m")) {
          e.preventDefault();
          toggleMute();
          return;
        }
      }

      // Handle Escape for pause/exit
      if (e.key === "Escape") {
        if (!currentDrill.keys.includes("escape")) {
          setShowQuitConfirm(true);
          return;
        }
      }

      // If already solved, Enter or Space advances
      if (isSuccess) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advanceDrill();
        }
        return;
      }

      // Intercept browser default actions for drilled shortcuts
      e.preventDefault();

      // Build active pressed key set
      const currentKeys = new Set();
      if (e.ctrlKey || e.metaKey) {
        currentKeys.add("ctrl");
        currentKeys.add("meta");
      }
      if (e.shiftKey) currentKeys.add("shift");
      if (e.altKey) currentKeys.add("alt");

      const rawKey = e.key.toLowerCase();
      const code = e.code?.toLowerCase() || "";

      if (rawKey === " " || code === "space") currentKeys.add(" ");
      else if (rawKey === "enter" || code === "enter") currentKeys.add("enter");
      else if (rawKey === "escape" || code === "escape") currentKeys.add("escape");
      else if (rawKey === "backspace" || code === "backspace") currentKeys.add("backspace");
      else if (rawKey === "delete" || code === "delete") currentKeys.add("delete");
      else if (rawKey === "arrowup" || code === "arrowup") currentKeys.add("arrowup");
      else if (rawKey === "arrowdown" || code === "arrowdown") currentKeys.add("arrowdown");
      else if (rawKey === "arrowleft" || code === "arrowleft") currentKeys.add("arrowleft");
      else if (rawKey === "arrowright" || code === "arrowright") currentKeys.add("arrowright");
      else if (rawKey === "home" || code === "home") currentKeys.add("home");
      else if (rawKey === "tab" || code === "tab") currentKeys.add("tab");
      else if (rawKey === "=" || rawKey === "+" || code === "equal") currentKeys.add("=");
      else if (rawKey === ";" || rawKey === ":" || code === "semicolon") currentKeys.add(";");
      else if (rawKey === "]" || rawKey === "}" || code === "bracketright") currentKeys.add("]");
      else if (rawKey === "[" || rawKey === "{" || code === "bracketleft") currentKeys.add("[");
      else if (rawKey === "." || rawKey === ">" || code === "period") currentKeys.add(".");
      else if (rawKey === "$" || rawKey === "4" || code === "digit4") currentKeys.add("$");
      else if (rawKey.startsWith("f") && !isNaN(rawKey.slice(1))) currentKeys.add(rawKey);
      else if (!["control", "shift", "alt", "meta"].includes(rawKey)) {
        currentKeys.add(rawKey);
      }

      setPressedKeys(currentKeys);

      // Verify target keys
      const targetKeys = currentDrill.keys;
      const allTargetMatched = targetKeys.every((k) => {
        const target = k.toLowerCase();
        if (target === "ctrl" || target === "meta") {
          return currentKeys.has("ctrl") || currentKeys.has("meta");
        }
        return currentKeys.has(target);
      });

      if (allTargetMatched) {
        setIsSuccess(true);
        setIsError(false);

        const newStreak = streak + 1;
        const streakBonus = Math.min(newStreak, 5) * 25;
        const points = 100 + streakBonus;

        setScore((prev) => prev + 1);
        setStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        setXp((prev) => prev + points);
        setFloatingXp({ text: `+${points} XP`, key: Date.now() });

        if (newStreak >= 3) {
          playSound("streak", isMuted);
        } else {
          playSound("correct", isMuted);
        }

        setTimeout(() => {
          advanceDrill();
        }, 800);
      }
    }

    function handleKeyUp(e) {
      const currentKeys = new Set();
      if (e.ctrlKey || e.metaKey) {
        currentKeys.add("ctrl");
        currentKeys.add("meta");
      }
      if (e.shiftKey) currentKeys.add("shift");
      if (e.altKey) currentKeys.add("alt");
      setPressedKeys(currentKeys);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    selectedCategory,
    isCompleted,
    isSuccess,
    activeDrills,
    currentDrillIndex,
    streak,
    maxStreak,
    isMuted,
    advanceDrill,
  ]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return shortcutCategories.filter((cat) => {
      return (
        !query ||
        cat.title.toLowerCase().includes(query) ||
        cat.titleKhmer.toLowerCase().includes(query) ||
        cat.description.toLowerCase().includes(query) ||
        cat.descriptionKhmer.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  // Overall category mastery stats
  const categoryStats = useMemo(() => {
    let earnedStars = 0;
    let mastered = 0;
    shortcutCategories.forEach((cat) => {
      const progress = savedShortcutScores[cat.id];
      if (progress?.bestStars) {
        earnedStars += progress.bestStars;
        if (progress.bestStars >= 2) mastered++;
      }
    });
    return { earnedStars, mastered, totalStars: shortcutCategories.length * 3 };
  }, [savedShortcutScores]);

  // ==========================================
  // VIEW 1: SHORTCUTS DASHBOARD & DRILL SELECT
  // ==========================================
  if (!selectedCategory) {
    return (
      <div ref={containerRef} className="space-y-6">
        {/* Top Metric Overview Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={LuStar}
            label="Shortcut Stars"
            value={categoryStats.earnedStars}
            note={`/ ${categoryStats.totalStars} Max Stars`}
            tone="amber"
          />
          <MetricCard
            icon={LuKeyboard}
            label="Total Drills"
            value={shortcutDrills.length}
            note="Physical Key Combos"
            tone="emerald"
          />
          <MetricCard
            icon={LuTrophy}
            label="Tracks Mastered"
            value={categoryStats.mastered}
            note={`/ ${shortcutCategories.length} Tracks`}
            tone="sky"
          />
          <MetricCard
            icon={LuZap}
            label="Speed Training"
            value="Active"
            note="Real-time Detection"
            tone="violet"
          />
        </div>

        {/* Search & Marathon Sprint Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Input
              size="large"
              prefix={<LuSearch className="text-slate-400 mr-1" />}
              placeholder="ស្វែងរកផ្លូវកាត់ (Search Copy, Paste, Bold, Zoom, Excel...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="rounded-xl border-2 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              type="primary"
              size="large"
              icon={<LuSparkles />}
              onClick={() =>
                startShortcutSession(
                  {
                    id: "marathon",
                    titleKhmer: "ការប្រកួតផ្លូវកាត់ចម្រុះ (Mixed Speed Sprint)",
                    title: "Surprise Mixed Sprint",
                    icon: "⚡",
                  },
                  15
                )
              }
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:!from-amber-600 hover:!to-orange-600 border-0 font-black rounded-xl h-10 shadow-sm"
            >
              Surprise Sprint (15 Combos)
            </Button>
          </div>
        </div>

        {/* Categories Grid using LearningCategoryCard */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((cat, index) => {
            const progress = savedShortcutScores[cat.id];
            const stars = progress?.bestStars || 0;
            const color = learningCardPalette[index % learningCardPalette.length];
            const drillsCount = getShortcutsByCategory(cat.id).length;

            const badgeText = stars > 0 ? "PASSED ✓" : `TRACK 0${index + 1}`;
            const actionLabel = stars > 0 ? "Practice Again" : "Start Arena";

            const footer = (
              <Button
                type="primary"
                onClick={() => startShortcutSession(cat)}
                className="w-full h-10 flex items-center justify-center gap-2 font-bold text-sm bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl"
              >
                <span>{actionLabel}</span>
                <LuArrowRight size={15} />
              </Button>
            );

            return (
              <LearningCategoryCard
                accent={color.accent}
                badge={badgeText}
                deep={color.deep}
                description={cat.descriptionKhmer}
                footer={footer}
                key={cat.id}
                pattern={learningCardPatterns[index % learningCardPatterns.length]}
                subtitle={`SHORTCUT ARENA · LEVEL 0${index + 1}`}
                title={cat.titleKhmer}
                visual={<span className="text-4xl">{cat.icon}</span>}
              >
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{drillsCount} key combinations</span>
                  <span className="text-[#fa8c16] font-extrabold flex items-center gap-1">
                    <LuStar size={13} className={stars > 0 ? "fill-current" : "text-slate-300"} />
                    <span>{stars}/3 stars</span>
                  </span>
                </div>
              </LearningCategoryCard>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: RESULTS & CELEBRATION VIEW
  // ==========================================
  if (isCompleted) {
    const total = activeDrills.length;
    const finalScore = score;
    const accuracy = Math.round((finalScore / total) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-4 sm:p-8 backdrop-blur-md flex flex-col justify-start items-center"
      >
        <div className="w-full max-w-2xl space-y-6 my-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            <div className="text-6xl sm:text-7xl mb-2 animate-bounce">
              {accuracy >= 80 ? "⚡" : "🎯"}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white m-0">
              {accuracy >= 80
                ? "Super Speed Mastery! (ពូកែណាស់)"
                : "Great Practice! (ហាត់បានល្អ)"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
              វគ្គ៖ <strong className="text-[#52c41a]">{selectedCategory.titleKhmer}</strong> ({total} ផ្លូវកាត់)
            </p>

            {/* Stars Reveal */}
            <div className="flex justify-center gap-3 text-[#fa8c16] mb-6">
              {[1, 2, 3].map((star) => (
                <LuStar
                  key={star}
                  size={42}
                  className={
                    star <= stars
                      ? "fill-current animate-pulse scale-110 drop-shadow-md"
                      : "text-slate-200 dark:text-slate-700"
                  }
                />
              ))}
            </div>

            {/* Score & Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-6">
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Combos Mastered</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {finalScore} <span className="text-sm font-bold text-slate-400">/ {total}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Max Streak</div>
                <div className="text-2xl font-black text-[#fa8c16] flex items-center justify-center gap-1 mt-0.5">
                  <LuFlame size={20} className="fill-current" />
                  <span>{maxStreak}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">XP Earned</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 mt-0.5">
                  <LuZap size={20} className="fill-current text-amber-500" />
                  <span>+{xp || finalScore * 100}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="large"
                icon={<LuRotateCcw />}
                onClick={() => startShortcutSession(selectedCategory)}
                className="flex-1 font-bold h-12 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 shadow-sm hover:shadow transition-all"
              >
                Practice Again (ហាត់ម្តងទៀត)
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<LuArrowLeft />}
                onClick={() => setSelectedCategory(null)}
                className="flex-1 font-bold h-12 bg-[#52c41a] hover:!bg-[#46aa16] border-0 shadow-md hover:shadow-lg transition-all"
              >
                Back to Tracks (ប្រធានបទផ្សេង)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // VIEW 3: IN-GAME ACTIVE SHORTCUTS ARENA
  // ====================================================
  const drill = activeDrills[currentDrillIndex];
  const progressPercent = Math.round(
    ((currentDrillIndex + (isSuccess ? 1 : 0)) / activeDrills.length) * 100
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-3 sm:p-6 backdrop-blur-md flex flex-col justify-between"
    >
      {/* 1. TOP GAME HUD */}
      <div className="w-full max-w-3xl mx-auto space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="text"
              icon={<LuArrowLeft />}
              onClick={() => setShowQuitConfirm(true)}
              className="text-slate-600 hover:text-slate-900 font-bold p-2 flex items-center justify-center rounded-xl hover:bg-slate-100"
            />
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl sm:text-2xl p-1 bg-slate-100 rounded-xl">{selectedCategory.icon}</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {selectedCategory.titleKhmer}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <LuClock size={13} />
              <span>
                {Math.floor(sessionSeconds / 60)}:
                {String(sessionSeconds % 60).padStart(2, "0")}
              </span>
            </div>

            {streak >= 2 && (
              <div className="snp-quiz-fire-pulse px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <LuFlame className="fill-current" />
                <span>
                  {streak >= 5 ? "x5 GODLIKE!" : streak >= 3 ? "x3 FIRE!" : `${streak} Streak`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-700">
              {currentDrillIndex + 1}/{activeDrills.length}
            </span>

            <Tooltip title={isMuted ? "Unmute (M)" : "Mute (M)"}>
              <Button
                shape="circle"
                type="text"
                size="small"
                icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                onClick={toggleMute}
                className="text-slate-500 hover:text-slate-900"
              />
            </Tooltip>

            <Tooltip title="Fullscreen (F)">
              <Button
                shape="circle"
                type="text"
                size="small"
                icon={isBrowserFullscreen ? <LuMinimize /> : <LuMaximize />}
                onClick={toggleBrowserFullscreen}
                className="text-slate-500 hover:text-slate-900"
              />
            </Tooltip>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={{
            "0%": "#52c41a",
            "100%": "#1677ff",
          }}
          railColor="#e2e8f0"
          size={["100%", 7]}
          className="m-0"
        />
      </div>

      {/* 2. MAIN INTERACTIVE SHORTCUT ARENA */}
      <div className="w-full max-w-2xl mx-auto my-auto py-4 space-y-4">
        {floatingXp && (
          <div
            key={floatingXp.key}
            className="fixed top-20 right-8 pointer-events-none z-50"
            style={{ animation: "snp-quiz-float-xp 1.2s forwards" }}
          >
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-xl flex items-center gap-1.5">
              <LuZap className="fill-current" />
              <span>{floatingXp.text}</span>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl text-center relative">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide mb-2">
              Combo Challenge {currentDrillIndex + 1} of {activeDrills.length}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 m-0">
              {drill.titleKhmer}
            </h3>
            <p className="text-sm font-medium text-slate-400 mt-1 m-0">
              {drill.title}
            </p>
            <p className="text-base font-bold text-[#1677ff] mt-3 m-0">
              {drill.instructionKhmer}
            </p>
          </div>

          {/* Interactive Keycaps */}
          <div className="my-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {drill.keyLabels.map((keyLabel, idx) => {
              const keyIdent = drill.keys[idx]?.toLowerCase();
              const isCurrentlyPressed = pressedKeys.has(keyIdent);

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`min-w-[80px] sm:min-w-[100px] h-20 sm:h-24 px-4 rounded-2xl border flex flex-col items-center justify-center font-mono transition-all duration-150 select-none ${
                      isSuccess
                        ? "bg-emerald-50/90 border-2 border-emerald-500 text-emerald-950 shadow-md scale-105"
                        : isCurrentlyPressed
                        ? "bg-blue-50/90 border-2 border-blue-500 text-blue-900 shadow-md scale-95"
                        : "bg-slate-50 border-slate-200 text-slate-800 shadow-sm"
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key</span>
                    <span className="text-xl sm:text-2xl font-black mt-0.5">
                      {keyLabel}
                    </span>
                  </div>
                  {idx < drill.keyLabels.length - 1 && (
                    <span className="text-2xl font-black text-slate-400">+</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Status Feedback */}
          {isSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-center gap-2 font-bold text-base animate-bounce">
              <LuCheck size={24} className="text-emerald-600" />
              <span>ត្រឹមត្រូវណាស់! Perfect Combo!</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              ចុចគ្រាប់ចុច <strong className="text-slate-800">{drill.keyLabels.join(" + ")}</strong> លើក្ដារចុចរបស់អ្នកឥឡូវនេះ
            </div>
          )}

          {/* Educational Tip Box */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <span className="font-bold text-amber-700 mr-1.5">💡 គន្លឹះ (Tip):</span>
              {drill.tipKhmer}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER HINTS */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between text-[11px] font-bold text-slate-400 px-2 flex-shrink-0">
        <div>
          SNP Keyboard Arena · <span className="text-slate-600">Press [F] for Fullscreen</span>
        </div>
        <div>
          Press <span className="text-slate-600">[Esc]</span> to Pause/Exit · <span className="text-slate-600">[M]</span> to Mute
        </div>
      </div>

      {/* Quit Modal */}
      <Modal
        open={showQuitConfirm}
        onCancel={() => setShowQuitConfirm(false)}
        footer={null}
        centered
        title="Leave Shortcut Arena? (ចាកចេញពីបន្ទប់ហាត់?)"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600 m-0">
            តើអ្នកចង់ចាកចេញពីវគ្គហាត់នេះមែនទេ? (Are you sure you want to exit?)
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              size="large"
              onClick={() => setShowQuitConfirm(false)}
              className="flex-1 font-bold"
            >
              Keep Practicing (បន្តហាត់)
            </Button>
            <Button
              danger
              type="primary"
              size="large"
              onClick={() => {
                setShowQuitConfirm(false);
                setSelectedCategory(null);
              }}
              className="flex-1 font-black"
            >
              Exit (ចាកចេញ)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
