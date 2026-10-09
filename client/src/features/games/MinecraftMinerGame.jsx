import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "antd";
import {
  LuFlame,
  LuGem,
  LuHeart,
  LuPickaxe,
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

const BLOCK_TYPES = [
  {
    type: "diamond",
    name: "Diamond Ore",
    points: 150,
    top: "#94a3b8",
    front: "#64748b",
    oreColor: "#38bdf8",
    tag: "DIAMOND",
    tagColor: "cyan",
  },
  {
    type: "emerald",
    name: "Emerald Ore",
    points: 120,
    top: "#64748b",
    front: "#475569",
    oreColor: "#10b981",
    tag: "EMERALD",
    tagColor: "emerald",
  },
  {
    type: "gold",
    name: "Gold Ore",
    points: 90,
    top: "#94a3b8",
    front: "#64748b",
    oreColor: "#facc15",
    tag: "GOLD",
    tagColor: "gold",
  },
  {
    type: "tnt",
    name: "TNT Bomb",
    points: 200,
    top: "#f87171",
    front: "#dc2626",
    oreColor: "#ffffff",
    tag: "TNT BLAST",
    tagColor: "red",
  },
  {
    type: "redstone",
    name: "Redstone Ore",
    points: 80,
    top: "#78716c",
    front: "#57534e",
    oreColor: "#ef4444",
    tag: "REDSTONE",
    tagColor: "volcano",
  },
  {
    type: "iron",
    name: "Iron Ore",
    points: 70,
    top: "#94a3b8",
    front: "#64748b",
    oreColor: "#fb923c",
    tag: "IRON",
    tagColor: "orange",
  },
  {
    type: "stone",
    name: "Stone Block",
    points: 50,
    top: "#78716c",
    front: "#57534e",
    oreColor: "#a8a29e",
    tag: "STONE",
    tagColor: "gray",
  },
  {
    type: "netherite",
    name: "Ancient Debris",
    points: 250,
    top: "#334155",
    front: "#1e293b",
    oreColor: "#c084fc",
    tag: "NETHERITE",
    tagColor: "purple",
  },
];

const PICKAXE_TIERS = [
  { name: "Wooden Pickaxe", color: "#b45309", minDepth: 0 },
  { name: "Stone Pickaxe", color: "#78716c", minDepth: 30 },
  { name: "Iron Pickaxe", color: "#e2e8f0", minDepth: 60 },
  { name: "Diamond Pickaxe", color: "#38bdf8", minDepth: 90 },
  { name: "Netherite Pickaxe", color: "#475569", minDepth: 120 },
];

function MinecraftMinerGame({
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

  const [activeBlocks, setActiveBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [depth, setDepth] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const [shatterEffects, setShatterEffects] = useState([]);
  const [tntBlastActive, setTntBlastActive] = useState(false);
  const [inventory, setInventory] = useState({
    diamonds: 0,
    emeralds: 0,
    gold: 0,
    redstone: 0,
  });

  const pickWord = useCallback((exclude = []) => {
    const list = wordsRef.current.length ? wordsRef.current : ["mine", "craft", "stone", "iron", "gold", "diamond", "ore", "torch"];
    const candidates = list.filter((w) => !exclude.includes(w));
    const pool = candidates.length ? candidates : list;
    return pool[Math.floor(Math.random() * pool.length)] || "mine";
  }, []);

  // Generate 3 side-by-side blocks for the current depth layer
  const generateLayer = useCallback((layerIndex = 0) => {
    const usedWords = [];
    const lvl = session?.level || 1;

    let availablePool = BLOCK_TYPES;
    if (lvl === 1) {
      availablePool = BLOCK_TYPES.filter((b) => ["stone", "iron"].includes(b.type));
    } else if (lvl === 2) {
      availablePool = BLOCK_TYPES.filter((b) => ["stone", "iron", "redstone"].includes(b.type));
    } else if (lvl === 3) {
      availablePool = BLOCK_TYPES.filter((b) => ["iron", "redstone", "gold"].includes(b.type));
    } else if (lvl === 4) {
      availablePool = BLOCK_TYPES.filter((b) => ["gold", "emerald", "diamond", "tnt"].includes(b.type));
    } else {
      availablePool = BLOCK_TYPES.filter((b) => ["netherite", "diamond", "emerald", "gold", "tnt"].includes(b.type));
    }
    if (!availablePool.length) availablePool = BLOCK_TYPES;

    return [0, 1, 2].map((slot) => {
      let bType;
      const tntChance = lvl >= 4 ? 0.35 : lvl === 3 ? 0.2 : 0;
      if (slot === 1 && Math.random() < tntChance) {
        bType = BLOCK_TYPES.find((b) => b.type === "tnt") || BLOCK_TYPES[0];
      } else {
        const pool = availablePool.filter((b) => b.type !== "tnt");
        bType = pool[Math.floor(Math.random() * pool.length)] || availablePool[0];
      }

      const word = pickWord(usedWords);
      usedWords.push(word);

      return {
        id: `block-${layerIndex}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        slot,
        blockDef: bType,
        word,
        typed: "",
      };
    });
  }, [pickWord, session?.level]);

  // Initial layer setup
  useEffect(() => {
    if (!words.length && !wordsRef.current.length) return;
    const initial = generateLayer(0);
    setActiveBlocks(initial);
    setSelectedBlockId(null);
    setDepth(0);
    setInventory({ diamonds: 0, emeralds: 0, gold: 0, redstone: 0 });
    setTntBlastActive(false);
  }, [generateLayer, words]);

  // Active pickaxe tier based on level
  const activePickaxe = useMemo(() => {
    const lvl = Math.max(1, Math.min(session?.level || 1, PICKAXE_TIERS.length));
    return PICKAXE_TIERS[lvl - 1];
  }, [session?.level]);

  // Biome name based on level
  const biomeName = useMemo(() => {
    const lvl = session?.level || 1;
    if (lvl >= 5) return "Netherite Magma Core";
    if (lvl === 4) return "Diamond Crystal Caves";
    if (lvl === 3) return "Redstone Machinery Vault";
    if (lvl === 2) return "Deep Iron Caverns";
    return "Surface Stone Shaft";
  }, [session?.level]);

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
        setSelectedBlockId(null);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setActiveBlocks((prev) =>
          prev.map((b) => {
            if (b.id !== selectedBlockId) return b;
            const nextTyped = b.typed.slice(0, -1);
            if (!nextTyped) setSelectedBlockId(null);
            return { ...b, typed: nextTyped };
          })
        );
        return;
      }

      if (keyChar.length > 2) return;

      // Case 1: Block currently selected
      if (selectedBlockId) {
        const targetBlock = activeBlocks.find((b) => b.id === selectedBlockId);
        if (!targetBlock) return;

        const isMatch = matchNextChar(targetBlock.word, targetBlock.typed, keyChar, language);
        if (isMatch) {
          const nextTyped = targetBlock.typed + targetBlock.word[targetBlock.typed.length];
          setIsSwinging(true);
          playGameSound("mine_hit", 0.45);
          window.setTimeout(() => setIsSwinging(false), 120);

          // Completely cracked & mined!
          if (isWordCompleted(targetBlock.word, nextTyped)) {
            const isTnt = targetBlock.blockDef.type === "tnt";

            if (isTnt) {
              setTntBlastActive(true);
              playGameSound("tnt_explode", 0.9);
              window.setTimeout(() => setTntBlastActive(false), 500);
            } else {
              playGameSound("diamond_ping", 0.7);
            }

            // Update inventory
            if (targetBlock.blockDef.type === "diamond") {
              setInventory((inv) => ({ ...inv, diamonds: inv.diamonds + 1 }));
            } else if (targetBlock.blockDef.type === "emerald") {
              setInventory((inv) => ({ ...inv, emeralds: inv.emeralds + 1 }));
            } else if (targetBlock.blockDef.type === "gold") {
              setInventory((inv) => ({ ...inv, gold: inv.gold + 1 }));
            } else if (targetBlock.blockDef.type === "redstone") {
              setInventory((inv) => ({ ...inv, redstone: inv.redstone + 1 }));
            }

            const earnedScore = targetBlock.blockDef.points + (isTnt ? 120 : 0);
            onScore?.(earnedScore, targetBlock.word.length, true);

            // Shatter particle toast
            setShatterEffects((eff) => [
              ...eff,
              {
                id: Date.now(),
                label: isTnt ? "+320 TNT ROW DETONATION" : `+${earnedScore} ${targetBlock.blockDef.tag}`,
              },
            ]);

            // Dig deeper
            setDepth((d) => d + 15);
            setSelectedBlockId(null);
            setActiveBlocks(generateLayer(depth + 1));
          } else {
            setActiveBlocks((prev) =>
              prev.map((b) => (b.id === selectedBlockId ? { ...b, typed: nextTyped } : b))
            );
          }
        } else {
          // Typo
          onMiss?.(1);
          playGameSound("mine_hit", 0.15);
        }
        return;
      }

      // Case 2: No block selected. Match starting letter of any 3 blocks!
      const matchingBlock = activeBlocks.find((b) =>
        matchNextChar(b.word, "", keyChar, language)
      );

      if (matchingBlock) {
        setIsSwinging(true);
        playGameSound("mine_hit", 0.45);
        window.setTimeout(() => setIsSwinging(false), 120);

        const nextTyped = matchingBlock.word[0];

        if (isWordCompleted(matchingBlock.word, nextTyped)) {
          playGameSound("diamond_ping", 0.7);
          const earned = matchingBlock.blockDef.points;
          onScore?.(earned, 1, true);
          setDepth((d) => d + 15);
          setSelectedBlockId(null);
          setActiveBlocks(generateLayer(depth + 1));
        } else {
          setSelectedBlockId(matchingBlock.id);
          setActiveBlocks((prev) =>
            prev.map((b) => (b.id === matchingBlock.id ? { ...b, typed: nextTyped } : b))
          );
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBlocks, depth, generateLayer, language, onMiss, onScore, selectedBlockId, status]);

  // Clean shatter toasts
  useEffect(() => {
    if (!shatterEffects.length) return undefined;
    const timer = window.setTimeout(() => setShatterEffects((eff) => eff.slice(1)), 850);
    return () => window.clearTimeout(timer);
  }, [shatterEffects]);

  const activeTargetBlock = activeBlocks.find((b) => b.id === selectedBlockId);

  const caveBgClass = useMemo(() => {
    const lvl = session?.level || 1;
    if (lvl >= 5) return "bg-gradient-to-b from-[#2d1238] via-[#1a0a22] to-[#0a040e]";
    if (lvl === 4) return "bg-gradient-to-b from-[#0f242e] via-[#09181f] to-[#040c10]";
    if (lvl === 3) return "bg-gradient-to-b from-[#2a1717] via-[#1a0f0f] to-[#0d0707]";
    if (lvl === 2) return "bg-gradient-to-b from-[#1f2922] via-[#141d16] to-[#0a0f0b]";
    return "bg-gradient-to-b from-[#162118] via-[#0f1711] to-[#070b08]";
  }, [session?.level]);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-[#0c120e] border-4 border-emerald-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.3)] flex flex-col select-none outline-none font-mono transition-all duration-200 ${
        isFullscreen ? "flex-1 h-full" : ""
      } ${
        tntBlastActive ? "ring-8 ring-amber-400 bg-red-950/80" : ""
      }`}
    >
      {/* Minecraft Mining Shaft Top HUD */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#131c15]/95 border-b-2 border-[#2b3d2f] backdrop-blur-md">
        <div className="flex items-center gap-3 font-sans">
          <Tag
            color="success"
            className="flex items-center gap-1.5 px-3 py-1 font-black text-xs uppercase tracking-wider rounded-lg m-0 border border-emerald-500/50 bg-emerald-950/80 text-emerald-200"
          >
            <LuPickaxe className="text-emerald-400" />
            <span>LVL {session?.level || 1} · {biomeName}</span>
          </Tag>

          {/* Minecraft Pixel Hearts */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <LuHeart
                key={i}
                size={16}
                className="text-red-500 fill-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]"
              />
            ))}
          </div>

          <span className="text-xs font-bold text-amber-300 hidden sm:inline">
            {activePickaxe.name}
          </span>
        </div>

        <div className="flex items-center gap-4 font-sans">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <LuGem />
            <span>Diamonds: <b className="text-white text-sm">{inventory.diamonds}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <LuTrophy />
            <span>Score: <b className="text-white text-sm">{session?.score ?? 0}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <LuFlame />
            <span>Streak: <b className="text-white text-sm">{session?.streak ?? 0}×</b></span>
          </div>
        </div>
      </div>

      {/* Atmospheric Real-Game Minecraft Underground Cave Canvas */}
      <div
        className={`relative w-full ${caveBgClass} overflow-hidden flex flex-col justify-between p-4 ${
          isFullscreen ? "flex-1 h-full min-h-[520px]" : "h-[420px] sm:h-[460px]"
        }`}
      >
        {/* Pixel Cave Background Grid & Rock Strata */}
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e08_2px,transparent_2px)] [background-size:20px_20px]" />

        {/* Hanging Cave Stalactites from ceiling */}
        <div className="absolute top-0 inset-x-0 h-10 pointer-events-none opacity-40 flex justify-between px-8">
          <div className="w-4 h-9 bg-[#57534e] [clip-path:polygon(0%_0%,100%_0%,50%_100%)]" />
          <div className="w-5 h-12 bg-[#57534e] [clip-path:polygon(0%_0%,100%_0%,50%_100%)]" />
          <div className="w-3 h-7 bg-[#57534e] [clip-path:polygon(0%_0%,100%_0%,50%_100%)]" />
          <div className="w-6 h-10 bg-[#57534e] [clip-path:polygon(0%_0%,100%_0%,50%_100%)]" />
        </div>

        {/* Molten Lava Pit on Left Wall with Orange Glow */}
        <div className="absolute top-1/4 left-0 w-8 h-36 bg-gradient-to-r from-orange-600 via-amber-500 to-transparent opacity-40 pointer-events-none flex flex-col justify-around">
          <div className="w-2 h-2 rounded-full bg-yellow-200 animate-ping self-center" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-ping self-center" />
        </div>

        {/* Wooden Mine Support Beams & Flickering Torches */}
        <div className="absolute inset-y-0 left-6 w-3 bg-[#78350f] border-x border-[#451a03] opacity-60 pointer-events-none" />
        <div className="absolute inset-y-0 right-6 w-3 bg-[#78350f] border-x border-[#451a03] opacity-60 pointer-events-none" />

        {/* Animated Left Torch */}
        <div className="absolute top-20 left-4 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,1)] animate-pulse" />
          <div className="w-1.5 h-6 bg-[#92400e] border border-[#78350f]" />
        </div>

        {/* Animated Right Torch */}
        <div className="absolute top-20 right-4 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,1)] animate-pulse" />
          <div className="w-1.5 h-6 bg-[#92400e] border border-[#78350f]" />
        </div>

        {/* TNT Detonation Shockwave Flash */}
        {tntBlastActive && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xs pointer-events-none z-40 animate-ping" />
        )}

        {/* Dynamic Instruction Banner */}
        <div className="relative z-20 flex justify-center pt-1 font-sans">
          <div className="px-6 py-2 rounded-xl bg-slate-950/90 border-2 border-emerald-500/60 shadow-xl text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <LuSparkles size={14} className="text-amber-400" />
            <span>
              {activeTargetBlock
                ? `MINING ${activeTargetBlock.blockDef.name} · FINISH TYPING TO BREAK!`
                : "TACTICAL EXCAVATION · TYPE FIRST LETTER OF ANY OF THE 3 BLOCKS"}
            </span>
          </div>
        </div>

        {/* Shatter Particle Floating Toasts */}
        {shatterEffects.map((eff) => (
          <div
            key={eff.id}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 font-black text-2xl text-cyan-300 drop-shadow-[0_0_16px_rgba(56,189,248,1)] animate-bounce font-sans"
          >
            {eff.label}
          </div>
        ))}

        {/* 3-Column Mining Layer Blocks */}
        <div className="relative z-10 grid grid-cols-3 gap-3 sm:gap-6 my-auto max-w-2xl mx-auto w-full px-2">
          {activeBlocks.map((block) => {
            const isSelected = block.id === selectedBlockId;
            const slices = getWordDisplaySlices(block.word, block.typed);
            const crackStage = isSelected
              ? Math.min(4, Math.floor((slices.progressPercent / 100) * 4))
              : 0;

            return (
              <div
                key={block.id}
                className={`relative flex flex-col items-center transition-all duration-150 ${
                  isSelected ? "scale-108" : "hover:scale-102"
                }`}
              >
                {/* Block Word Tag on Wooden Hanging Sign */}
                <div
                  className={`mb-2 px-3 py-1.5 rounded-lg border-2 shadow-2xl flex flex-col items-center justify-center font-sans text-center transition-all min-w-[84px] ${
                    isSelected
                      ? "bg-[#854d0e] border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.8)]"
                      : "bg-[#713f12] border-[#593409]"
                  }`}
                >
                  <div className="flex items-center justify-center tracking-wide">
                    {slices.matched && (
                      <span className="text-lg sm:text-2xl font-black text-[#4ade80] drop-shadow-[0_0_6px_rgba(74,222,128,0.8)]">
                        {slices.matched}
                      </span>
                    )}
                    {slices.nextChar && (
                      <span
                        className={`text-lg sm:text-2xl font-black rounded px-1 ${
                          isSelected
                            ? "bg-[#0284c7] text-white animate-pulse shadow-[0_0_12px_rgba(2,132,199,1)]"
                            : "text-amber-200"
                        }`}
                      >
                        {slices.nextChar === " " ? "␣" : slices.nextChar}
                      </span>
                    )}
                    {slices.remaining && (
                      <span className="text-lg sm:text-2xl font-bold text-amber-100">
                        {slices.remaining}
                      </span>
                    )}
                  </div>

                  {/* Crack Progress Line */}
                  {isSelected && (
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-100 shadow-[0_0_6px_rgba(74,222,128,1)]"
                        style={{ width: `${slices.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 3D Isometric Voxel Ore Block SVG */}
                <div className="relative w-28 h-28 sm:w-34 sm:h-34">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Top Face */}
                    <polygon points="50,12 88,34 50,56 12,34" fill={block.blockDef.top} stroke="#1e293b" strokeWidth="1" />
                    {/* Left Face */}
                    <polygon points="12,34 50,56 50,96 12,74" fill={block.blockDef.front} stroke="#0f172a" strokeWidth="1" />
                    {/* Right Face */}
                    <polygon points="50,56 88,34 88,74 50,96" fill="#334155" stroke="#0f172a" strokeWidth="1" />

                    {/* Pixel Ore Flecks on Top Face */}
                    <polygon points="40,28 50,33 46,37 36,32" fill={block.blockDef.oreColor} />
                    <polygon points="56,34 66,39 62,43 52,38" fill={block.blockDef.oreColor} />

                    {/* Pixel Ore Flecks on Front Left */}
                    <rect x="22" y="44" width="8" height="7" fill={block.blockDef.oreColor} transform="skewY(29)" />
                    <rect x="34" y="55" width="9" height="8" fill={block.blockDef.oreColor} transform="skewY(29)" />

                    {/* Pixel Ore Flecks on Front Right */}
                    <rect x="60" y="48" width="7" height="6" fill={block.blockDef.oreColor} transform="skewY(-29)" />

                    {/* Crack Stage 1 */}
                    {crackStage >= 1 && (
                      <path d="M 50 20 L 46 38 L 50 56 L 32 70" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    )}
                    {/* Crack Stage 2 */}
                    {crackStage >= 2 && (
                      <path d="M 46 38 L 68 34 L 50 56 L 70 66" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    )}
                    {/* Crack Stage 3 */}
                    {crackStage >= 3 && (
                      <path d="M 32 70 L 20 60 M 70 66 L 56 84" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    )}
                    {/* Crack Stage 4 */}
                    {crackStage >= 4 && (
                      <path d="M 50 30 L 30 45 M 50 60 L 70 80" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    )}
                  </svg>

                  {/* Pickaxe Swing Animation onto Selected Block */}
                  {isSelected && (
                    <div
                      className={`absolute -right-3 -top-5 transition-transform duration-100 origin-bottom-left ${
                        isSwinging ? "rotate-[-45deg] scale-115" : "rotate-0"
                      }`}
                    >
                      <LuPickaxe size={42} color={activePickaxe.color} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
                    </div>
                  )}
                </div>

                {/* Ore Badge */}
                <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-slate-300 font-sans">
                  {block.blockDef.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Minecraft XP Bar & Hotbar Inventory */}
        <div className="relative z-20 flex flex-col items-center gap-1 pb-1 font-sans">
          {/* Green XP Bar */}
          <div className="w-64 sm:w-80 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden flex items-center">
            <div
              className="h-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,1)] transition-all duration-200"
              style={{ width: `${Math.min(100, (depth % 30) * 3.33 + 10)}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-lime-400">XP LEVEL {Math.floor(depth / 15) + 1}</span>

          {/* Minecraft 9-Slot Hotbar */}
          <div className="flex bg-[#8f8f8f] p-1 rounded-md border-2 border-[#3c3c3c] shadow-2xl gap-1.5">
            {/* Slot 1: Active Pickaxe */}
            <div className="w-9 h-9 bg-[#8b8b8b] border-2 border-white flex items-center justify-center shadow-inner">
              <LuPickaxe size={20} color={activePickaxe.color} />
            </div>
            {/* Slot 2: Diamonds */}
            <div className="w-9 h-9 bg-[#8b8b8b] border border-[#373737] flex items-center justify-center relative shadow-inner">
              <LuGem size={17} className="text-cyan-400 drop-shadow" />
              <span className="absolute bottom-0 right-0.5 text-[9px] font-black text-white drop-shadow">
                {inventory.diamonds}
              </span>
            </div>
            {/* Slot 3: Emeralds */}
            <div className="w-9 h-9 bg-[#8b8b8b] border border-[#373737] flex items-center justify-center relative shadow-inner">
              <LuGem size={17} className="text-emerald-400 drop-shadow" />
              <span className="absolute bottom-0 right-0.5 text-[9px] font-black text-white drop-shadow">
                {inventory.emeralds}
              </span>
            </div>
            {/* Slot 4: Gold */}
            <div className="w-9 h-9 bg-[#8b8b8b] border border-[#373737] flex items-center justify-center relative shadow-inner">
              <div className="w-4 h-3 bg-amber-400 rounded-xs border border-amber-600 shadow" />
              <span className="absolute bottom-0 right-0.5 text-[9px] font-black text-white drop-shadow">
                {inventory.gold}
              </span>
            </div>
            {/* Slot 5: Redstone */}
            <div className="w-9 h-9 bg-[#8b8b8b] border border-[#373737] flex items-center justify-center relative shadow-inner">
              <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,1)]" />
              <span className="absolute bottom-0 right-0.5 text-[9px] font-black text-white drop-shadow">
                {inventory.redstone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MinecraftMinerGame);
