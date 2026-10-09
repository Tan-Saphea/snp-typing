import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "antd";
import {
  LuCoins,
  LuCompass,
  LuFlag,
  LuFlame,
  LuRocket,
  LuSparkles,
  LuTrophy,
  LuZap,
} from "react-icons/lu";

import { playGameSound } from "./gameAudio.js";
import { playKeyboardSound } from "../typing/keyboardSound.js";
import {
  getWordDisplaySlices,
  isWordCompleted,
  matchNextChar,
  resolveGameKey,
} from "./gameKeyHelper.js";

const PLATFORM_THEMES = [
  {
    type: "speedway",
    from: "#06b6d4",
    to: "#0891b2",
    accent: "#22d3ee",
    name: "CYAN SPEEDWAY",
    bonus: "Standard Speed",
  },
  {
    type: "gold_rush",
    from: "#f59e0b",
    to: "#d97706",
    accent: "#fbbf24",
    name: "GOLD RUSH OBBY",
    bonus: "2× Blox Coins",
  },
  {
    type: "booster",
    from: "#10b981",
    to: "#059669",
    accent: "#34d399",
    name: "TURBO BOOST PAD",
    bonus: "+0.5× Multiplier Boost",
  },
  {
    type: "neon_pink",
    from: "#ec4899",
    to: "#db2777",
    accent: "#f472b6",
    name: "NEON PINK GAP",
    bonus: "Precision Jump",
  },
  {
    type: "rainbow",
    from: "#8b5cf6",
    to: "#7c3aed",
    accent: "#a78bfa",
    name: "CYBER SKYWALK",
    bonus: "Checkpoint Zone",
  },
];

function RobloxObbyGame({
  isFullscreen = false,
  language = "en",
  onMiss,
  onScore,
  session,
  status = "running",
  words = [],
}) {
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const [platforms, setPlatforms] = useState([]);
  const [typedText, setTypedText] = useState("");
  const [isLeaping, setIsLeaping] = useState(false);
  const [isStumbling, setIsStumbling] = useState(false);
  const [distance, setDistance] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [coinBursts, setCoinBursts] = useState([]);
  const [milestone, setMilestone] = useState(null);

  const prevLevelRef = useRef(session?.level || 1);
  const isOverdrive = speedMultiplier >= 3.0;

  const stageTitles = useMemo(
    () => [
      "Cyan Speedway",
      "Gold Rush Obby",
      "Turbo Boost Pads",
      "Neon Pink Heights",
      "Cyber Skywalk Arena",
    ],
    []
  );

  const currentStageTitle = useMemo(() => {
    const lvl = Math.max(1, Math.min(session?.level || 1, stageTitles.length));
    return stageTitles[lvl - 1];
  }, [session?.level, stageTitles]);

  const skyBgClass = useMemo(() => {
    const lvl = session?.level || 1;
    if (lvl >= 5) return "bg-gradient-to-b from-[#1e072b] via-[#2d0e3f] to-[#09020d]";
    if (lvl === 4) return "bg-gradient-to-b from-[#21071e] via-[#330d2e] to-[#0d030c]";
    if (lvl === 3) return "bg-gradient-to-b from-[#051912] via-[#09261c] to-[#030d09]";
    if (lvl === 2) return "bg-gradient-to-b from-[#1c1206] via-[#2d1b06] to-[#0d0702]";
    return "bg-gradient-to-b from-[#070b16] via-[#101b33] to-[#0a1020]";
  }, [session?.level]);

  // Checkpoint banner when level advances
  useEffect(() => {
    if (session?.level && session.level > prevLevelRef.current) {
      setMilestone(`CHECKPOINT REACHED · STAGE ${session.level} UNLOCKED!`);
      const timer = window.setTimeout(() => setMilestone(null), 2400);
      prevLevelRef.current = session.level;
      return () => window.clearTimeout(timer);
    }
    prevLevelRef.current = session?.level || 1;
  }, [session?.level]);

  const pickWord = useCallback(() => {
    const list = wordsRef.current.length ? wordsRef.current : ["jump", "obby", "run", "speed", "parkour", "turbo"];
    return list[Math.floor(Math.random() * list.length)] || "jump";
  }, []);

  // Initialize track of 5 consecutive platforms
  useEffect(() => {
    if (!words.length && !wordsRef.current.length) return;
    const initial = Array.from({ length: 5 }).map((_, idx) => {
      const word = pickWord();
      return {
        id: `plat-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        word,
        theme: PLATFORM_THEMES[idx % PLATFORM_THEMES.length],
      };
    });
    setPlatforms(initial);
    setTypedText("");
    setDistance(0);
    setSpeedMultiplier(1);
    setIsLeaping(false);
    setMilestone(null);
  }, [language, pickWord, words]);

  const currentPlatform = platforms[0] || null;
  const currentWord = currentPlatform?.word || "";

  // Physical keyboard listener for continuous platform runner
  useEffect(() => {
    if (status !== "running" || !currentWord || isLeaping) return undefined;

    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Tab") return;

      const keyChar = resolveGameKey(event, language);
      if (!keyChar) return;

      if (!event.repeat && !["Dead", "Process", "Unidentified"].includes(event.key)) {
        playKeyboardSound({ key: event.key, code: event.code });
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setTypedText((prev) => prev.slice(0, -1));
        return;
      }

      if (keyChar.length > 2) return;

      const isMatch = matchNextChar(currentWord, typedText, keyChar, language);
      if (isMatch) {
        const nextTyped = typedText + currentWord[typedText.length];
        setTypedText(nextTyped);
        playGameSound("jump_bounce", 0.35);

        // Platform cleared!
        if (isWordCompleted(currentWord, nextTyped)) {
          setIsLeaping(true);

          const isGold = currentPlatform?.theme?.type === "gold_rush";
          const isBoost = currentPlatform?.theme?.type === "booster";

          if (isBoost) {
            playGameSound("speed_boost", 0.7);
          } else {
            playGameSound("blox_coin", 0.7);
          }

          const multiplierGain = isBoost ? 0.8 : 0.5;
          const nextMultiplier = Math.min(4, Math.round((speedMultiplier + multiplierGain) * 10) / 10);
          setSpeedMultiplier(nextMultiplier);

          const coinReward = Math.round((isGold ? 100 : 50) * nextMultiplier);
          const gainedScore = Math.round(currentWord.length * 20 * nextMultiplier);
          onScore?.(gainedScore, currentWord.length, true);

          const nextDistance = distance + 25;
          setDistance(nextDistance);

          setCoinBursts((b) => [
            ...b,
            {
              id: Date.now(),
              text: `+${coinReward} BLOX COINS`,
              color: isGold ? "text-amber-300" : isBoost ? "text-emerald-300" : "text-cyan-300",
            },
          ]);

          // Distance milestone banners
          if (nextDistance === 100) {
            setMilestone("100m MILESTONE · SKYWAY ACHIEVED!");
            window.setTimeout(() => setMilestone(null), 1800);
          } else if (nextDistance === 250) {
            setMilestone("250m MILESTONE · CYBER PEAK MASTER!");
            window.setTimeout(() => setMilestone(null), 1800);
          }

          // Smooth leap transition
          window.setTimeout(() => {
            setPlatforms((prev) => {
              const newWord = pickWord();
              const nextPlat = {
                id: `plat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                word: newWord,
                theme: PLATFORM_THEMES[(prev.length + 1) % PLATFORM_THEMES.length],
              };
              return [...prev.slice(1), nextPlat];
            });

            setTypedText("");
            setIsLeaping(false);
          }, 330);
        }
      } else {
        // Typo: stumble on bounce pad, reset multiplier
        onMiss?.(1);
        setSpeedMultiplier(1);
        setIsStumbling(true);
        playGameSound("jump_bounce", 0.15);
        window.setTimeout(() => setIsStumbling(false), 240);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPlatform, currentWord, distance, isLeaping, language, onMiss, onScore, pickWord, speedMultiplier, status, typedText]);

  // Clean coin bursts
  useEffect(() => {
    if (!coinBursts.length) return undefined;
    const timer = window.setTimeout(() => setCoinBursts((b) => b.slice(1)), 850);
    return () => window.clearTimeout(timer);
  }, [coinBursts]);

  const currentTheme = currentPlatform?.theme || PLATFORM_THEMES[0];
  const slices = getWordDisplaySlices(currentWord, typedText);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-[#090e1c] border-4 border-cyan-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.3)] flex flex-col select-none outline-none transition-all duration-200 ${
        isFullscreen ? "flex-1 h-full" : ""
      } ${
        isOverdrive ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-[#090e1c]" : ""
      }`}
    >
      {/* Obby Runner Top HUD Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0d162d]/95 border-b-2 border-cyan-800/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Tag
            color="cyan"
            className="flex items-center gap-1.5 px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg m-0 border border-cyan-400/40 bg-cyan-950/80 text-cyan-200"
          >
            <LuCompass className="text-cyan-400" />
            <span>STAGE {session?.level || 1} · {currentStageTitle}</span>
          </Tag>

          {/* Speed Multiplier Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg border font-black text-xs transition-all ${
              isOverdrive
                ? "bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"
                : "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
            }`}
          >
            <LuZap size={14} className={isOverdrive ? "text-amber-400" : "text-cyan-400"} />
            <span>{speedMultiplier}× {isOverdrive ? "OVERDRIVE!" : "SPEED"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <LuCoins />
            <span>Blox Coins: <b className="text-white text-sm">{(session?.correctWords ?? 0) * 50}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <LuTrophy />
            <span>Score: <b className="text-white text-sm">{session?.score ?? 0}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <LuFlame />
            <span>Streak: <b className="text-white text-sm">{session?.streak ?? 0}×</b></span>
          </div>
        </div>
      </div>

      {/* 3D Cyberpunk Synthwave Obby Skybox Canvas */}
      <div
        className={`relative w-full ${skyBgClass} overflow-hidden flex flex-col justify-between p-4 ${
          isFullscreen ? "flex-1 h-full min-h-[520px]" : "h-[420px] sm:h-[460px]"
        }`}
      >
        {/* Retro Neon Sun on the Horizon */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-b from-amber-400 via-rose-500 to-purple-600 shadow-[0_0_80px_rgba(244,63,94,0.6)] opacity-70 pointer-events-none flex flex-col justify-center items-center overflow-hidden">
          {/* Horizontal Scanlines across Sun */}
          <div className="w-full h-1 bg-[#070b16] my-1" />
          <div className="w-full h-1.5 bg-[#070b16] my-1.5" />
          <div className="w-full h-2 bg-[#070b16] my-2" />
          <div className="w-full h-2.5 bg-[#070b16] my-2" />
        </div>

        {/* Cyberpunk City Skyline Silhouettes in the distance */}
        <div className="absolute bottom-28 inset-x-0 h-28 pointer-events-none opacity-30 flex items-end justify-around">
          <div className="w-12 h-24 bg-cyan-950/80 border-t border-cyan-400/40" />
          <div className="w-16 h-32 bg-cyan-950/90 border-t border-cyan-400/40" />
          <div className="w-8 h-20 bg-cyan-950/70 border-t border-cyan-400/40" />
          <div className="w-20 h-28 bg-cyan-950/90 border-t border-cyan-400/40" />
          <div className="w-14 h-36 bg-cyan-950/80 border-t border-cyan-400/40" />
        </div>

        {/* Moving Perspective Cyber Grid in the Void */}
        <div className="absolute bottom-0 inset-x-0 h-44 bg-[linear-gradient(to_right,#38bdf820_1px,transparent_1px),linear-gradient(to_bottom,#38bdf820_1px,transparent_1px)] bg-[size:28px_28px] [transform:perspective(300px)_rotateX(65deg)] opacity-60 pointer-events-none origin-bottom" />

        {/* Speed Stream Lines during Overdrive */}
        {speedMultiplier > 1 && (
          <div className="absolute inset-0 pointer-events-none opacity-60 overflow-hidden">
            <div className="w-full h-0.5 bg-cyan-300 absolute top-1/4 animate-pulse" />
            <div className="w-full h-0.5 bg-amber-300 absolute top-1/2 animate-pulse" />
            <div className="w-full h-0.5 bg-rose-400 absolute top-2/3 animate-pulse" />
          </div>
        )}

        {/* Word Billboard Hovering in Center View */}
        <div className="relative z-20 flex flex-col items-center pt-2">
          {/* Milestone Toast Banner */}
          {milestone && (
            <div className="mb-2 px-5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,1)] animate-bounce">
              <LuRocket className="inline mr-1" />
              {milestone}
            </div>
          )}

          <div className="px-7 py-3.5 rounded-2xl bg-[#070d1e]/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.7)] flex flex-col items-center backdrop-blur-md min-w-[200px]">
            {/* Zone Tag */}
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              {currentTheme.name} · {currentTheme.bonus}
            </div>

            <div className="flex items-center gap-1 font-sans tracking-wide">
              {slices.matched && (
                <span className="text-2xl sm:text-4xl font-black text-[#52c41a] drop-shadow-[0_0_10px_rgba(82,196,26,0.9)]">
                  {slices.matched}
                </span>
              )}
              {slices.nextChar && (
                <span className="text-2xl sm:text-4xl font-black bg-cyan-500 text-white rounded px-2 shadow-[0_0_16px_rgba(6,182,212,1)] animate-pulse">
                  {slices.nextChar === " " ? "␣" : slices.nextChar}
                </span>
              )}
              {slices.remaining && (
                <span className="text-2xl sm:text-4xl font-bold text-slate-100">
                  {slices.remaining}
                </span>
              )}
            </div>

            {/* Platform Word Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full mt-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-cyan-400 h-full transition-all duration-150 shadow-[0_0_8px_rgba(34,211,238,1)]"
                style={{ width: `${slices.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-2 text-xs font-black tracking-wide text-cyan-300 uppercase flex items-center gap-1.5">
            <LuSparkles size={14} className="text-amber-400" />
            <span>Type word to sprint & parkour leap across the void</span>
          </div>
        </div>

        {/* Floating Coin Burst Particles */}
        {coinBursts.map((cb) => (
          <div
            key={cb.id}
            className={`absolute top-20 left-1/2 -translate-x-1/2 z-30 font-black text-2xl drop-shadow-[0_0_16px_rgba(0,0,0,1)] animate-bounce ${
              cb.color || "text-amber-300"
            }`}
          >
            {cb.text}
          </div>
        ))}

        {/* 3D Scrolling Platforms Chain */}
        <div className="relative w-full h-52 flex items-end justify-between px-4 sm:px-12 pb-3 z-10">
          {/* Platform 1 (Current Platform with Avatar) */}
          <div className="relative w-44 sm:w-52 flex flex-col items-center">
            {/* Checkpoint Flag */}
            <div className="absolute -top-12 left-4 z-20 flex items-center gap-1">
              <div className="w-1.5 h-12 bg-slate-300 rounded-full shadow-md" />
              <div className="w-7 h-5 bg-emerald-400 rounded-sm -mt-6 -ml-1 border-2 border-emerald-200 shadow-lg flex items-center justify-center">
                <LuFlag size={12} className="text-emerald-950" />
              </div>
            </div>

            {/* Yellow Roblox Studs */}
            <div className="flex gap-4 mb-[-2px] z-10">
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md border-t border-yellow-100" />
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md border-t border-yellow-100" />
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md border-t border-yellow-100" />
            </div>

            {/* 3D Platform Slab with Beveled Edges */}
            <div
              className="w-full h-18 rounded-2xl border-2 border-white/40 shadow-[0_12px_24px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center font-black text-xs text-white uppercase tracking-wider relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.from}, ${currentTheme.to})`,
              }}
            >
              {/* Neon Surface Glow Accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/50" />
              <div className="flex items-center gap-1.5 drop-shadow">
                <span>{currentTheme.name}</span>
              </div>
            </div>

            {/* 3D Roblox Blox Avatar */}
            <div
              className={`absolute -top-26 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
                isLeaping
                  ? "translate-x-32 -translate-y-20 scale-120 rotate-180"
                  : isStumbling
                  ? "-rotate-12 scale-95"
                  : "hover:scale-105"
              }`}
            >
              <svg viewBox="0 0 60 70" className="w-18 h-24 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Yellow Blox Head */}
                <rect x="20" y="4" width="20" height="18" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="25" y="10" width="3.5" height="4.5" rx="1" fill="#0f172a" />
                <rect x="32" y="10" width="3.5" height="4.5" rx="1" fill="#0f172a" />
                <path d="M 26 17 Q 30 20 34 17" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                {/* Blue Torso */}
                <rect x="15" y="24" width="30" height="26" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                {/* SNP Logo Emblem on Torso */}
                <circle cx="30" cy="35" r="4" fill="#38bdf8" />
                {/* Yellow Arms */}
                <rect x="5" y="24" width="8" height="24" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="47" y="24" width="8" height="24" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                {/* Green Legs */}
                <rect x="16" y="52" width="12" height="16" rx="2" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
                <rect x="32" y="52" width="12" height="16" rx="2" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Void Gap with Laser Hazard & Distance Label */}
          <div className="flex-1 flex flex-col items-center justify-center pb-6">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse" />
            <span className="text-[11px] font-black tracking-widest text-cyan-300 uppercase mt-1 drop-shadow">
              {isLeaping ? "PARKOUR FLIP!" : "VOID GAP · 25m"}
            </span>
          </div>

          {/* Platform 2 (Upcoming Target Platform) */}
          <div className="relative w-44 sm:w-52 flex flex-col items-center opacity-85">
            {/* Studs */}
            <div className="flex gap-4 mb-[-2px] z-10">
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md" />
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md" />
              <div className="w-5 h-2.5 bg-yellow-300 rounded-t-sm shadow-md" />
            </div>

            {/* Platform Slab */}
            <div
              className="w-full h-18 rounded-2xl border-2 border-white/30 shadow-[0_12px_24px_rgba(0,0,0,0.8)] flex items-center justify-center font-black text-xs text-white uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${platforms[1]?.theme?.from || "#8b5cf6"}, ${
                  platforms[1]?.theme?.to || "#7c3aed"
                })`,
              }}
            >
              <span>{platforms[1]?.theme?.name || "NEXT ZONE"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(RobloxObbyGame);
