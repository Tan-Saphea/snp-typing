import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "antd";
import {
  LuCrown,
  LuFlame,
  LuGhost,
  LuHeart,
  LuShield,
  LuSnowflake,
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

const LANES = [16, 38, 62, 84];

const GHOST_TYPES = {
  normal: {
    name: "Wandering Phantom",
    tagColor: "purple",
    glowColor: "#c084fc",
    speedFactor: 1.0,
    pointMultiplier: 1.0,
  },
  speedy: {
    name: "Speedy Wisp",
    tagColor: "cyan",
    glowColor: "#22d3ee",
    speedFactor: 1.45,
    pointMultiplier: 1.5,
  },
  royal: {
    name: "Golden King Ghost",
    tagColor: "gold",
    glowColor: "#facc15",
    speedFactor: 0.85,
    pointMultiplier: 3.0,
  },
  freeze_orb: {
    name: "Frost Rune Orb",
    tagColor: "blue",
    glowColor: "#38bdf8",
    speedFactor: 0.9,
    pointMultiplier: 2.0,
  },
};

function GhostCatcherGame({
  isFullscreen = false,
  language = "en",
  onMiss,
  onScore,
  session,
  status = "running",
  words = [],
}) {
  const containerRef = useRef(null);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const [ghosts, setGhosts] = useState([]);
  const [lockedId, setLockedId] = useState(null);
  const [beamTarget, setBeamTarget] = useState(null);
  const [pops, setPops] = useState([]);
  const [rampartHit, setRampartHit] = useState(false);
  const [freezeTimer, setFreezeTimer] = useState(0);
  const [muzzleFire, setMuzzleFire] = useState(false);
  const [waveMilestone, setWaveMilestone] = useState(null);

  const prevLevelRef = useRef(session?.level || 1);
  const isFrozen = freezeTimer > 0;

  const waveTitles = useMemo(
    () => [
      "Porch Wisps",
      "Haunted Graveyard",
      "Phantom Corridor",
      "Royal Crypt Chambers",
      "Spectral Eclipse Storm",
    ],
    []
  );

  const currentWaveTitle = useMemo(() => {
    const lvl = Math.max(1, Math.min(session?.level || 1, waveTitles.length));
    return waveTitles[lvl - 1];
  }, [session?.level, waveTitles]);

  const levelSpeedMultiplier = useMemo(() => {
    return 0.85 + (session?.level || 1) * 0.15;
  }, [session?.level]);

  const cemeteryBgClass = useMemo(() => {
    const lvl = session?.level || 1;
    if (lvl >= 5) return "bg-gradient-to-b from-[#250914] via-[#1a0822] to-[#0d0309]";
    if (lvl === 4) return "bg-gradient-to-b from-[#1c1206] via-[#18111e] to-[#0a0510]";
    if (lvl === 3) return "bg-gradient-to-b from-[#190a28] via-[#120e24] to-[#070512]";
    if (lvl === 2) return "bg-gradient-to-b from-[#08182b] via-[#091522] to-[#04090f]";
    return "bg-gradient-to-b from-[#0e1726] via-[#0c101c] to-[#06080e]";
  }, [session?.level]);

  // Wave milestone announcement when level advances
  useEffect(() => {
    if (session?.level && session.level > prevLevelRef.current) {
      setWaveMilestone(`WAVE CLEARED · ADVANCING TO WAVE ${session.level}!`);
      const timer = window.setTimeout(() => setWaveMilestone(null), 2400);
      prevLevelRef.current = session.level;
      return () => window.clearTimeout(timer);
    }
    prevLevelRef.current = session?.level || 1;
  }, [session?.level]);

  // Freeze timer countdown
  useEffect(() => {
    if (freezeTimer <= 0) return undefined;
    const interval = window.setInterval(() => {
      setFreezeTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [freezeTimer]);

  // Pick random word from pool
  const pickWord = useCallback((excludeWords = []) => {
    const list = wordsRef.current.length ? wordsRef.current : ["ghost", "magic", "spirit", "shadow", "spark"];
    const candidates = list.filter((w) => !excludeWords.includes(w));
    const pool = candidates.length ? candidates : list;
    return pool[Math.floor(Math.random() * pool.length)] || "ghost";
  }, []);

  // Pick random ghost type with level-scaled spawn chances
  const pickGhostType = useCallback(() => {
    const lvl = session?.level || 1;
    const roll = Math.random();
    if (lvl === 1) {
      return "normal";
    }
    if (lvl === 2) {
      return roll < 0.2 ? "freeze_orb" : "normal";
    }
    if (lvl === 3) {
      if (roll < 0.18) return "freeze_orb";
      if (roll < 0.5) return "speedy";
      return "normal";
    }
    if (lvl === 4) {
      if (roll < 0.18) return "freeze_orb";
      if (roll < 0.45) return "royal";
      if (roll < 0.75) return "speedy";
      return "normal";
    }
    // Level 5
    if (roll < 0.22) return "freeze_orb";
    if (roll < 0.5) return "royal";
    if (roll < 0.85) return "speedy";
    return "normal";
  }, [session?.level]);

  // Initialize initial 4 descending ghosts in distinct lanes
  useEffect(() => {
    if (!words.length && !wordsRef.current.length) return;
    const initialGhosts = LANES.map((x, idx) => {
      const word = pickWord();
      const gType = idx === 1 ? "speedy" : idx === 2 ? "royal" : "normal";
      const typeDef = GHOST_TYPES[gType];

      return {
        id: `ghost-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        word,
        typed: "",
        x,
        y: 6 + idx * 9,
        type: gType,
        speed: (3.6 + Math.random() * 2.0) * typeDef.speedFactor * levelSpeedMultiplier,
      };
    });
    setGhosts(initialGhosts);
    setLockedId(null);
    setBeamTarget(null);
    setFreezeTimer(0);
  }, [language, levelSpeedMultiplier, pickWord, words]);

  // Main game loop: descent timer (paused during frost freeze)
  useEffect(() => {
    if (status !== "running" || isFrozen) return undefined;

    const interval = window.setInterval(() => {
      setGhosts((currentGhosts) => {
        let rampartHitsCount = 0;
        let unlockedDueToDescent = false;

        const updated = currentGhosts.map((g) => {
          const nextY = g.y + g.speed * 0.055;
          if (nextY >= 82) {
            // Reached castle wall
            if (g.type !== "freeze_orb") {
              rampartHitsCount += 1;
            }
            if (g.id === lockedId) {
              unlockedDueToDescent = true;
            }

            const nextWord = pickWord(currentGhosts.map((c) => c.word));
            const nextType = pickGhostType();
            const typeDef = GHOST_TYPES[nextType];

            return {
              id: `ghost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              word: nextWord,
              typed: "",
              x: g.x,
              y: -8,
              type: nextType,
              speed: (3.6 + Math.random() * 2.2) * typeDef.speedFactor * levelSpeedMultiplier,
            };
          }
          return { ...g, y: nextY };
        });

        if (rampartHitsCount > 0) {
          onMiss?.(rampartHitsCount);
          playGameSound("magic_zap", 0.2);
          setRampartHit(true);
          window.setTimeout(() => setRampartHit(false), 260);
        }

        if (unlockedDueToDescent) {
          setLockedId(null);
        }

        return updated;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isFrozen, lockedId, onMiss, pickGhostType, pickWord, status]);

  // Beam coordinates and angle tracking
  useEffect(() => {
    if (!lockedId) {
      setBeamTarget(null);
      return;
    }
    const target = ghosts.find((g) => g.id === lockedId);
    if (target) {
      setBeamTarget({ x: target.x, y: target.y });
    } else {
      setLockedId(null);
      setBeamTarget(null);
    }
  }, [ghosts, lockedId]);

  // Turret rotation calculation
  const turretAngle = useMemo(() => {
    if (!beamTarget) return 0;
    const deltaX = beamTarget.x - 50;
    const deltaY = (beamTarget.y + 10) - 90;
    return (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90;
  }, [beamTarget]);

  // Physical keyboard listener
  useEffect(() => {
    if (status !== "running") return undefined;

    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Tab") return;

      const keyChar = resolveGameKey(event, language);
      if (!keyChar) return;

      if (!event.repeat && !["Dead", "Process", "Unidentified"].includes(event.key)) {
        playKeyboardSound({ key: event.key, code: event.code });
      }

      if (event.key === "Escape") {
        setLockedId(null);
        setBeamTarget(null);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setGhosts((prev) =>
          prev.map((g) => {
            if (g.id !== lockedId) return g;
            const nextTyped = g.typed.slice(0, -1);
            if (!nextTyped) setLockedId(null);
            return { ...g, typed: nextTyped };
          })
        );
        return;
      }

      if (keyChar.length > 2) return;

      setGhosts((prev) => {
        // Case 1: Ghost is locked
        if (lockedId) {
          const target = prev.find((g) => g.id === lockedId);
          if (!target) return prev;

          const isMatch = matchNextChar(target.word, target.typed, keyChar, language);
          if (isMatch) {
            const nextTyped = target.typed + target.word[target.typed.length];
            playGameSound("magic_zap", 0.45);
            setMuzzleFire(true);
            window.setTimeout(() => setMuzzleFire(false), 90);

            // Captured!
            if (isWordCompleted(target.word, nextTyped)) {
              const typeDef = GHOST_TYPES[target.type] || GHOST_TYPES.normal;
              const basePoints = target.word.length * 15 + 60;
              const totalPoints = Math.round(basePoints * typeDef.pointMultiplier);

              if (target.type === "freeze_orb") {
                playGameSound("freeze_spell", 0.85);
                setFreezeTimer(6); // 6s freeze
                setPops((p) => [
                  ...p,
                  {
                    id: Date.now(),
                    x: target.x,
                    y: target.y,
                    text: "FROST BLIZZARD · 6s FREEZE",
                    color: "text-cyan-300",
                  },
                ]);
              } else if (target.type === "royal") {
                playGameSound("ghost_caught", 0.85);
                setPops((p) => [
                  ...p,
                  {
                    id: Date.now(),
                    x: target.x,
                    y: target.y,
                    text: `+${totalPoints} ROYAL BOUNTY`,
                    color: "text-amber-300",
                  },
                ]);
              } else {
                playGameSound("ghost_caught", 0.7);
                setPops((p) => [
                  ...p,
                  {
                    id: Date.now(),
                    x: target.x,
                    y: target.y,
                    text: `+${totalPoints} CAUGHT`,
                    color: "text-emerald-400",
                  },
                ]);
              }

              onScore?.(totalPoints, target.word.length, true);

              const newWord = pickWord(prev.map((g) => g.word));
              const nextType = pickGhostType();
              const nextTypeDef = GHOST_TYPES[nextType];
              setLockedId(null);
              setBeamTarget(null);

              return prev.map((g) =>
                g.id === lockedId
                  ? {
                      id: `ghost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      word: newWord,
                      typed: "",
                      x: g.x,
                      y: -8,
                      type: nextType,
                      speed: (3.6 + Math.random() * 2.2) * nextTypeDef.speedFactor,
                    }
                  : g
              );
            }

            return prev.map((g) => (g.id === lockedId ? { ...g, typed: nextTyped } : g));
          } else {
            // Typo
            onMiss?.(1);
            playGameSound("magic_zap", 0.15);
            return prev;
          }
        }

        // Case 2: No lock yet. Match first letter of visible ghosts!
        const candidates = prev
          .filter((g) => matchNextChar(g.word, "", keyChar, language))
          .sort((a, b) => b.y - a.y);

        if (candidates.length > 0) {
          const matched = candidates[0];
          playGameSound("magic_zap", 0.45);
          setMuzzleFire(true);
          window.setTimeout(() => setMuzzleFire(false), 90);

          const nextTyped = matched.word[0];

          if (isWordCompleted(matched.word, nextTyped)) {
            const typeDef = GHOST_TYPES[matched.type] || GHOST_TYPES.normal;
            const points = Math.round(75 * typeDef.pointMultiplier);
            playGameSound("ghost_caught", 0.75);
            onScore?.(points, 1, true);

            setPops((p) => [
              ...p,
              {
                id: Date.now(),
                x: matched.x,
                y: matched.y,
                text: `+${points} QUICK ZAP`,
                color: "text-emerald-400",
              },
            ]);

            const newWord = pickWord(prev.map((g) => g.word));
            const nextType = pickGhostType();
            const nextTypeDef = GHOST_TYPES[nextType];
            setLockedId(null);
            return prev.map((g) =>
              g.id === matched.id
                ? {
                    id: `ghost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    word: newWord,
                    typed: "",
                    x: g.x,
                    y: -8,
                    type: nextType,
                    speed: (3.6 + Math.random() * 2.2) * nextTypeDef.speedFactor,
                  }
                : g
            );
          }

          setLockedId(matched.id);
          return prev.map((g) => (g.id === matched.id ? { ...g, typed: nextTyped } : g));
        }

        return prev;
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFrozen, language, lockedId, onMiss, onScore, pickGhostType, pickWord, status]);

  // Clean pop notifications
  useEffect(() => {
    if (!pops.length) return undefined;
    const timer = window.setTimeout(() => setPops((p) => p.slice(1)), 850);
    return () => window.clearTimeout(timer);
  }, [pops]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-[#070412] border-4 border-purple-600/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.3)] flex flex-col select-none outline-none transition-all duration-150 ${
        isFullscreen ? "flex-1 h-full" : ""
      } ${
        rampartHit ? "ring-4 ring-rose-500 ring-offset-2 ring-offset-[#070412]" : ""
      }`}
      tabIndex={0}
    >
      {/* Ghost Catcher Multi-Wave HUD Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#110926]/95 border-b-2 border-purple-800/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Tag
            color="purple"
            className="flex items-center gap-1.5 px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg m-0 border border-purple-400/40 bg-purple-950/80 text-purple-200"
          >
            <LuGhost className="text-purple-400" />
            <span>WAVE {session?.level || 1} · {currentWaveTitle}</span>
          </Tag>

          {/* Castle Barrier Shields / Hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <LuHeart
                key={i}
                size={18}
                className={`transition-all duration-300 ${
                  i < (session?.lives ?? 3)
                    ? "text-rose-500 fill-rose-500 scale-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    : "text-slate-800 opacity-25 scale-90"
                }`}
              />
            ))}
          </div>

          {/* Freeze Mode Badge */}
          {isFrozen && (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-black text-xs animate-pulse">
              <LuSnowflake size={14} />
              <span>BLIZZARD FROZEN: {freezeTimer}s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <LuTrophy />
            <span>Ghosts: <b className="text-white text-sm">{session?.correctWords ?? 0}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
            <LuZap />
            <span>Score: <b className="text-white text-sm">{session?.score ?? 0}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <LuFlame />
            <span>Streak: <b className="text-white text-sm">{session?.streak ?? 0}×</b></span>
          </div>
        </div>
      </div>

      {/* Atmospheric Real-Game Haunted Graveyard Canvas */}
      <div
        className={`relative w-full ${cemeteryBgClass} overflow-hidden flex flex-col justify-between p-4 ${
          isFullscreen ? "flex-1 h-full min-h-[520px]" : "h-[420px] sm:h-[460px]"
        }`}
      >
        {/* Distant Mountain Silhouettes & Nebula Sky */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#7e22ce25,transparent_70%)]" />

        {/* Twinkling Starry Constellations */}
        <div className="absolute inset-0 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />

        {/* Giant Glowing Blood / Harvest Moon with Crater Details */}
        <div className="absolute top-4 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-purple-200 shadow-[0_0_50px_rgba(253,230,138,0.7),inset_0_0_20px_rgba(217,119,6,0.3)] flex items-center justify-center opacity-95 pointer-events-none">
          {/* Craters */}
          <div className="absolute w-5 h-5 rounded-full bg-amber-300/40 top-3 left-4" />
          <div className="absolute w-7 h-7 rounded-full bg-amber-300/30 bottom-4 right-5" />
          <div className="absolute w-3 h-3 rounded-full bg-amber-300/40 bottom-3 left-8" />
          {/* Silhouetted Bats Flying Across Moon */}
          <svg viewBox="0 0 40 20" className="w-8 h-4 opacity-70 translate-x-1 -translate-y-2" fill="#1e1b4b">
            <path d="M 0 10 Q 10 0 20 10 Q 30 0 40 10 Q 30 16 20 12 Q 10 16 0 10 Z" />
          </svg>
        </div>

        {/* Distant Gothic Castle Spire Silhouettes in Midground */}
        <div className="absolute bottom-12 inset-x-0 h-32 pointer-events-none opacity-40">
          <svg viewBox="0 0 800 120" className="w-full h-full" preserveAspectRatio="none" fill="#0d0722">
            <path d="M 0 120 L 0 80 L 40 80 L 50 40 L 60 80 L 120 80 L 130 30 L 140 80 L 220 80 L 230 50 L 240 80 L 300 80 L 320 20 L 340 80 L 440 80 L 450 45 L 460 80 L 520 80 L 540 25 L 560 80 L 640 80 L 650 40 L 660 80 L 740 80 L 750 30 L 760 80 L 800 80 L 800 120 Z" />
          </svg>
        </div>

        {/* Graveyard Cemetery Fence & Crooked Headstones */}
        <div className="absolute bottom-8 inset-x-0 h-16 pointer-events-none opacity-30 flex justify-between px-6">
          {/* Headstone 1 */}
          <div className="w-5 h-8 bg-purple-950/80 rounded-t-lg border-t border-purple-400/40 self-end" />
          {/* Celtic Cross Headstone */}
          <div className="relative w-6 h-11 self-end flex flex-col items-center">
            <div className="w-1.5 h-11 bg-purple-950/90 rounded-sm" />
            <div className="absolute top-2 w-7 h-1.5 bg-purple-950/90 rounded-sm" />
            <div className="absolute top-1 w-4 h-4 rounded-full border border-purple-400/40" />
          </div>
          {/* Headstone 2 */}
          <div className="w-6 h-9 bg-purple-950/80 rounded-t-md self-end" />
          {/* Headstone 3 */}
          <div className="w-5 h-7 bg-purple-950/80 rounded-t-md self-end" />
        </div>

        {/* Frost Blizzard Overlay when Frozen */}
        {isFrozen && (
          <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] border-4 border-cyan-400/40 pointer-events-none z-30 animate-pulse">
            <div className="absolute top-4 left-4 text-cyan-300 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-xl">
              <LuSnowflake className="animate-spin" />
              <span>GHOSTS FROZEN IN ICE · FAST TYPING TIME!</span>
            </div>
          </div>
        )}

        {/* Wave Milestone Toast Banner */}
        {waveMilestone && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-xl bg-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(168,85,247,1)] border border-purple-300 animate-bounce">
            <LuSparkles className="inline mr-1 text-amber-300" />
            {waveMilestone}
          </div>
        )}

        {/* Dynamic Plasma Target Beam */}
        {beamTarget && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Plasma Glow */}
            <line
              x1="50%"
              y1="90%"
              x2={`${beamTarget.x}%`}
              y2={`${beamTarget.y + 10}%`}
              stroke="url(#plasmaOuterBeam)"
              strokeWidth="9"
              strokeLinecap="round"
              className="animate-pulse opacity-80"
            />
            {/* High Voltage Core */}
            <line
              x1="50%"
              y1="90%"
              x2={`${beamTarget.x}%`}
              y2={`${beamTarget.y + 10}%`}
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="plasmaOuterBeam" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* 4-Lane Descending Wave of Ghosts */}
        {ghosts.map((ghost) => {
          const isTargeted = ghost.id === lockedId;
          const slices = getWordDisplaySlices(ghost.word, ghost.typed);
          const typeDef = GHOST_TYPES[ghost.type] || GHOST_TYPES.normal;

          return (
            <div
              key={ghost.id}
              className={`absolute transition-all duration-75 ease-linear z-20 flex flex-col items-center -translate-x-1/2 ${
                isTargeted
                  ? "scale-115 drop-shadow-[0_0_30px_rgba(192,132,252,1)]"
                  : isFrozen
                  ? "opacity-90 saturate-50"
                  : "opacity-95"
              }`}
              style={{ left: `${ghost.x}%`, top: `${ghost.y}%` }}
            >
              {/* Type Badge (Royal / Frost / Speedy) */}
              {ghost.type !== "normal" && (
                <div
                  className={`mb-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border shadow-md ${
                    ghost.type === "royal"
                      ? "bg-amber-500/30 text-amber-300 border-amber-400"
                      : ghost.type === "freeze_orb"
                      ? "bg-cyan-500/30 text-cyan-300 border-cyan-400"
                      : "bg-sky-500/30 text-sky-300 border-sky-400"
                  }`}
                >
                  {ghost.type === "royal" && <LuCrown size={11} />}
                  {ghost.type === "freeze_orb" && <LuSnowflake size={11} />}
                  {ghost.type === "speedy" && <LuZap size={11} />}
                  <span>{typeDef.name}</span>
                </div>
              )}

              {/* Word Speech Bubble */}
              <div
                className={`mb-1 px-3.5 py-1.5 rounded-2xl text-center shadow-2xl border-2 backdrop-blur-md flex flex-col items-center min-w-[76px] transition-all ${
                  isTargeted
                    ? "bg-[#0d0728]/95 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.85)] ring-2 ring-cyan-300/50"
                    : "bg-[#090518]/90 border-purple-500/70"
                }`}
              >
                <div className="flex items-center justify-center font-sans tracking-wide">
                  {slices.matched && (
                    <span className="text-xl sm:text-2xl font-black text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">
                      {slices.matched}
                    </span>
                  )}
                  {slices.nextChar && (
                    <span
                      className={`text-xl sm:text-2xl font-black rounded px-1 ${
                        isTargeted
                          ? "bg-cyan-500 text-white animate-pulse shadow-[0_0_14px_rgba(6,182,212,1)]"
                          : "text-purple-300 font-extrabold"
                      }`}
                    >
                      {slices.nextChar === " " ? "␣" : slices.nextChar}
                    </span>
                  )}
                  {slices.remaining && (
                    <span className="text-xl sm:text-2xl font-bold text-slate-100">
                      {slices.remaining}
                    </span>
                  )}
                </div>

                {/* Mini Target Progress Bar */}
                {isTargeted && (
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-100 shadow-[0_0_6px_rgba(52,211,153,1)]"
                      style={{ width: `${slices.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Distinct Ghost Sprite Vectors */}
              <div className="relative w-18 h-22 flex items-center justify-center">
                {ghost.type === "freeze_orb" ? (
                  /* Floating Frost Rune Orb */
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-400 to-indigo-300 shadow-[0_0_24px_rgba(56,189,248,0.9)] border-2 border-white flex items-center justify-center animate-spin">
                    <LuSnowflake size={26} className="text-white drop-shadow" />
                  </div>
                ) : (
                  /* Animated Ghost Silhouette */
                  <svg
                    viewBox="0 0 100 120"
                    className="w-full h-full filter drop-shadow-[0_0_16px_rgba(192,132,252,0.6)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 50 10 C 25 10 15 35 15 65 C 15 95 18 105 28 100 C 35 96 42 105 50 100 C 58 95 65 105 72 100 C 82 105 85 95 85 65 C 85 35 75 10 50 10 Z"
                      fill={
                        ghost.type === "royal"
                          ? "url(#royalGhostGrad)"
                          : ghost.type === "speedy"
                          ? "url(#speedyGhostGrad)"
                          : "url(#normalGhostGrad)"
                      }
                    />
                    {/* Ghost Blush */}
                    <circle cx="30" cy="54" r="4" fill="#f472b6" opacity="0.6" />
                    <circle cx="70" cy="54" r="4" fill="#f472b6" opacity="0.6" />
                    {/* Ghost Eyes */}
                    <circle cx="36" cy="44" r="5" fill="#1e1b4b" />
                    <circle cx="38" cy="42" r="2" fill="#ffffff" />
                    <circle cx="64" cy="44" r="5" fill="#1e1b4b" />
                    <circle cx="66" cy="42" r="2" fill="#ffffff" />
                    {/* Smile */}
                    <path d="M 44 54 Q 50 58 56 54" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Royal Crown on Golden Ghost */}
                    {ghost.type === "royal" && (
                      <path
                        d="M 32 18 L 40 8 L 50 16 L 60 8 L 68 18 Z"
                        fill="#facc15"
                        stroke="#ca8a04"
                        strokeWidth="1.5"
                      />
                    )}

                    <defs>
                      <linearGradient id="normalGhostGrad" x1="50" y1="10" x2="50" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="0.7" stopColor="#f3e8ff" />
                        <stop offset="1" stopColor="#d8b4fe" />
                      </linearGradient>
                      <linearGradient id="speedyGhostGrad" x1="50" y1="10" x2="50" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="0.7" stopColor="#cffafe" />
                        <stop offset="1" stopColor="#67e8f9" />
                      </linearGradient>
                      <linearGradient id="royalGhostGrad" x1="50" y1="10" x2="50" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="0.7" stopColor="#fef08a" />
                        <stop offset="1" stopColor="#fde047" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}

                {/* Target Sparkle Indicator */}
                {isTargeted && (
                  <div className="absolute -top-1 -right-1 text-cyan-300 animate-spin">
                    <LuSparkles size={18} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Bubble Pop Floating Score Animations */}
        {pops.map((pop) => (
          <div
            key={pop.id}
            className={`absolute z-30 font-black text-xl drop-shadow-[0_0_16px_rgba(0,0,0,1)] animate-bounce -translate-x-1/2 ${
              pop.color || "text-emerald-400"
            }`}
            style={{ left: `${pop.x}%`, top: `${pop.y}%` }}
          >
            {pop.text}
          </div>
        ))}

        {/* Steampunk Arcane Cannon Turret at bottom center */}
        <div className="relative w-full flex justify-center items-end z-20 pt-6">
          <div className="flex flex-col items-center">
            {/* Rotating Arcane Cannon Barrel */}
            <div
              className="relative w-16 h-12 flex justify-center items-end origin-bottom transition-transform duration-75"
              style={{ transform: `rotate(${turretAngle}deg)` }}
            >
              {/* Muzzle Flash Particle */}
              {muzzleFire && (
                <div className="absolute -top-4 w-10 h-10 rounded-full bg-cyan-400/90 shadow-[0_0_30px_rgba(34,211,238,1)] animate-ping" />
              )}
              {/* Twin Brass Plasma Coils */}
              <div className="w-12 h-10 bg-gradient-to-t from-purple-800 via-cyan-500 to-purple-600 rounded-t-2xl border-2 border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.9)] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] animate-pulse" />
              </div>
            </div>

            {/* Turret Base Mount & Mode Banner */}
            <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border-2 border-purple-500 shadow-2xl flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black tracking-wider text-purple-200 uppercase">
                {lockedId ? "PLASMA BEAM LOCKED · FINISH TYPING" : "TYPE FIRST LETTER OF ANY GHOST TO AIM & LOCK"}
              </span>
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
            </div>
          </div>
        </div>

        {/* Castle Rampart Battlements with Flickering Fire Braziers */}
        <div
          className={`absolute bottom-0 inset-x-0 h-12 bg-slate-950 rounded-b-3xl border-t-2 border-purple-900/60 flex items-center justify-between px-6 pointer-events-none transition-colors duration-150 ${
            rampartHit ? "bg-rose-950/95 border-rose-500" : ""
          }`}
        >
          {/* Left Brazier */}
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-5 rounded-full bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.9)] animate-pulse" />
              <div className="absolute w-2 h-3 rounded-full bg-yellow-200" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Castle Gate</span>
          </div>

          {/* Rampart Crenellations in Center */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-950/80 rounded-t-md border-t border-purple-500/30" />
            <div className="w-8 h-8 bg-purple-950/80 rounded-t-md border-t border-purple-500/30" />
            <div className="w-8 h-8 bg-purple-950/80 rounded-t-md border-t border-purple-500/30" />
          </div>

          {/* Right Brazier */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Defense Ward</span>
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-5 rounded-full bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.9)] animate-pulse" />
              <div className="absolute w-2 h-3 rounded-full bg-yellow-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GhostCatcherGame);
