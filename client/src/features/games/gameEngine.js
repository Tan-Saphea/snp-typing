import { normalizeForComparison, segmentGraphemes } from "@snp/shared";

export const GAME_CONFIGS = {
  "minecraft-miner": {
    id: "minecraft-miner",
    title: "Minecraft Block Miner",
    lessonName: "Minecraft Miner",
    duration: 60,
    lives: null,
    accent: "emerald",
    description: "Swing your pixel pickaxe to crack ore blocks, mine shiny diamonds, and fill your inventory hotbar.",
    instruction: "Type each letter to swing your pickaxe, fracture the block, and collect rare gems.",
    legacyNames: ["Picture Typing", "Falling Words"],
  },
  "roblox-obby": {
    id: "roblox-obby",
    title: "Roblox Blox Obby",
    lessonName: "Roblox Obby",
    duration: 45,
    lives: null,
    accent: "amber",
    description: "Leap across colorful neon obstacle platforms, clear checkpoints, and collect Blox coins.",
    instruction: "Type each word to make your blocky avatar jump across platforms to the next stage.",
    legacyNames: ["Speed Challenge", "Balloon Typing"],
  },
  "ghost-catcher": {
    id: "ghost-catcher",
    title: "Ghost Catcher",
    lessonName: "Ghost Catcher",
    duration: 60,
    lives: 3,
    accent: "violet",
    description: "Zap friendly glowing ghosts into magic capture bubbles with your glowing ghost beam.",
    instruction: "Type the letters to cast a magic beam and safely catch the floating ghost.",
    legacyNames: ["Falling Words", "Balloon Typing"],
  },
};

export const GAME_LIST = [
  GAME_CONFIGS["minecraft-miner"],
  GAME_CONFIGS["roblox-obby"],
  GAME_CONFIGS["ghost-catcher"],
];

const ALIAS_MAP = {
  minegraf: "minecraft-miner",
  minecraft: "minecraft-miner",
  "minecraft-miner": "minecraft-miner",
  "picture-typing": "minecraft-miner",

  roblox: "roblox-obby",
  "roblox-obby": "roblox-obby",
  "speed-challenge": "roblox-obby",
  "balloon-typing": "roblox-obby",

  ghoes: "ghost-catcher",
  ghost: "ghost-catcher",
  "ghost-catcher": "ghost-catcher",
  "falling-words": "ghost-catcher",
};

export const GAME_THEMED_WORDS = {
  "minecraft-miner": {
    en: [
      "mine", "craft", "block", "stone", "torch", "sword", "pickaxe", "iron",
      "gold", "diamond", "ruby", "emerald", "cave", "ore", "coal", "brick",
      "lava", "steve", "armor", "chest", "golem", "portal", "obsidian",
      "furnace", "creeper", "crystal", "shovel", "axe", "shield", "ingot",
    ],
    km: [
      "កាប់", "ថ្ម", "ពេជ្រ", "មាស", "ដែក", "ពូថៅ", "ដី", "ប្រអប់",
      "រូង", "ភ្លើង", "ដាវ", "ធ្យូង", "ភូមិ", "ព្រៃ", "ជញ្ជាំង",
      "កាក់", "ញញួរ", "រូងភ្នំ", "កែវ", "កំណប់",
    ],
  },
  "roblox-obby": {
    en: [
      "roblox", "obby", "jump", "stage", "coins", "checkpoint", "speed",
      "run", "leap", "bounce", "climb", "winner", "trophy", "ladder", "neon",
      "parkour", "hero", "fast", "avatar", "flip", "dash", "team", "blox",
      "portal", "slider", "platform", "spring", "builder", "badge", "quest",
    ],
    km: [
      "លោត", "កាក់", "រត់", "ជ័យជំនះ", "វេទិកា", "វីរបុរស", "ឈ្នះ",
      "លឿន", "ផ្កាយ", "ជំហាន", "កីឡា", "លេង", "ជណ្ដើរ", "ល្បឿន",
      "ពាន", "មេដាយ", "ចលនា", "ជើងខ្លាំង", "ការប្រកួត",
    ],
  },
  "ghost-catcher": {
    en: [
      "ghost", "magic", "spirit", "spooky", "sparkle", "wand", "bubble",
      "catcher", "glow", "stars", "moon", "shadow", "night", "beam", "shine",
      "candle", "potion", "haunted", "castle", "phantom", "whisper", "crystal",
      "twilight", "orb", "lantern", "floating", "friendly", "spells",
    ],
    km: [
      "ខ្មោច", "វេទមន្ត", "ពន្លឺ", "ផ្កាយ", "រាត្រី", "ពពុះ", "ចែងចាំង",
      "មន្តអាគម", "ញញឹម", "ភ្លឺ", "ព្រលឹង", "មេឃ", "ស្រមោល", "ចង្កៀង",
      "វិញ្ញាណ", "អាថ៌កំបាំង", "កែវ", "ពន្លឺព្រះចន្ទ",
    ],
  },
};

export const MAX_GAME_LEVEL = 5;

export const GAME_LEVEL_CONFIGS = {
  "minecraft-miner": [
    {
      level: 1,
      title: "Surface Stone & Dirt",
      description: "Warm up pickaxe swings on surface rocks",
      targetWords: 3,
      speedMultiplier: 1.0,
      timeBonus: 8,
      pickaxe: "Wooden Pickaxe",
      pickaxeColor: "#b45309",
      ores: ["stone", "coal"],
      accent: "emerald",
    },
    {
      level: 2,
      title: "Deep Coal Cavern",
      description: "Delve underground to uncover iron deposits",
      targetWords: 4,
      speedMultiplier: 1.15,
      timeBonus: 8,
      pickaxe: "Stone Pickaxe",
      pickaxeColor: "#78716c",
      ores: ["iron", "stone", "coal"],
      accent: "orange",
    },
    {
      level: 3,
      title: "Redstone Machinery Vault",
      description: "Mine energized redstone and gleaming gold",
      targetWords: 4,
      speedMultiplier: 1.3,
      timeBonus: 10,
      pickaxe: "Iron Pickaxe",
      pickaxeColor: "#e2e8f0",
      ores: ["gold", "redstone", "iron"],
      accent: "gold",
    },
    {
      level: 4,
      title: "Diamond & Emerald Depths",
      description: "Crack precious gems and beware of TNT blocks",
      targetWords: 5,
      speedMultiplier: 1.45,
      timeBonus: 10,
      pickaxe: "Diamond Pickaxe",
      pickaxeColor: "#38bdf8",
      ores: ["diamond", "emerald", "gold", "tnt"],
      accent: "cyan",
    },
    {
      level: 5,
      title: "Ancient Netherite Core",
      description: "Master miner! Ancient debris and hyper-velocity ore extraction",
      targetWords: 6,
      speedMultiplier: 1.6,
      timeBonus: 12,
      pickaxe: "Netherite Pickaxe",
      pickaxeColor: "#475569",
      ores: ["netherite", "diamond", "emerald", "tnt", "redstone"],
      accent: "purple",
    },
  ],
  "roblox-obby": [
    {
      level: 1,
      title: "Cyan Speedway",
      description: "Warm up with beginner platform hops",
      targetWords: 3,
      speedMultiplier: 1.0,
      timeBonus: 8,
      themeType: "speedway",
      accent: "cyan",
    },
    {
      level: 2,
      title: "Gold Rush Obby",
      description: "Double coins and bouncy gap leaps",
      targetWords: 4,
      speedMultiplier: 1.2,
      timeBonus: 8,
      themeType: "gold_rush",
      accent: "amber",
    },
    {
      level: 3,
      title: "Turbo Boost Pads",
      description: "Rocket speed multipliers engaged",
      targetWords: 4,
      speedMultiplier: 1.4,
      timeBonus: 10,
      themeType: "booster",
      accent: "emerald",
    },
    {
      level: 4,
      title: "Neon Pink Heights",
      description: "High-flying precision jumps above the cyber skyline",
      targetWords: 5,
      speedMultiplier: 1.65,
      timeBonus: 10,
      themeType: "neon_pink",
      accent: "pink",
    },
    {
      level: 5,
      title: "Cyber Skywalk Arena",
      description: "Champion parkour master! Maximum obstacle velocity",
      targetWords: 6,
      speedMultiplier: 1.9,
      timeBonus: 12,
      themeType: "rainbow",
      accent: "violet",
    },
  ],
  "ghost-catcher": [
    {
      level: 1,
      title: "Porch Wisps",
      description: "Gentle floating phantoms drifting downward",
      targetWords: 3,
      speedMultiplier: 1.0,
      timeBonus: 8,
      ghostTypes: ["normal"],
      accent: "purple",
    },
    {
      level: 2,
      title: "Haunted Graveyard",
      description: "Spirits pick up pace, frost rune orbs materialize",
      targetWords: 4,
      speedMultiplier: 1.2,
      timeBonus: 8,
      ghostTypes: ["normal", "freeze_orb"],
      accent: "blue",
    },
    {
      level: 3,
      title: "Phantom Manor",
      description: "Speedy wisps dash swiftly across room lanes",
      targetWords: 4,
      speedMultiplier: 1.4,
      timeBonus: 10,
      ghostTypes: ["normal", "speedy", "freeze_orb"],
      accent: "cyan",
    },
    {
      level: 4,
      title: "Royal Crypt Chambers",
      description: "Golden king ghosts and multiple quick wisps appear",
      targetWords: 5,
      speedMultiplier: 1.65,
      timeBonus: 10,
      ghostTypes: ["speedy", "royal", "freeze_orb"],
      accent: "gold",
    },
    {
      level: 5,
      title: "Spectral Eclipse Storm",
      description: "Master ghost hunter! Swarm waves descending rapidly",
      targetWords: 6,
      speedMultiplier: 1.9,
      timeBonus: 12,
      ghostTypes: ["royal", "speedy", "freeze_orb", "normal"],
      accent: "rose",
    },
  ],
};

export function getGameConfig(gameId) {
  if (!gameId) return null;
  const canonicalId = ALIAS_MAP[gameId] ?? gameId;
  return GAME_CONFIGS[canonicalId] ?? null;
}

export function getLevelConfig(gameId, level = 1) {
  if (!gameId) return null;
  const canonicalId = ALIAS_MAP[gameId] ?? gameId;
  const levels = GAME_LEVEL_CONFIGS[canonicalId] || [];
  const clamped = Math.max(1, Math.min(level, MAX_GAME_LEVEL));
  return levels[clamped - 1] || levels[0] || null;
}

export function filterWordsForLevel(words = [], level = 1, language = "en") {
  if (!words || !words.length) return [];
  if (level >= 4) return words;

  const targetMax = level === 1 ? 5 : level === 2 ? 6 : 7;
  const filtered = words.filter((w) => {
    const units = segmentGraphemes(String(w).trim(), language).length;
    return units <= targetMax;
  });

  return filtered.length >= 2 ? filtered : words;
}

export function advanceGameLevel(session, gameId) {
  const curLevel = session?.level || 1;
  const currentLevelCfg = getLevelConfig(gameId, curLevel);
  const currentTarget = currentLevelCfg?.targetWords ?? session?.levelWordsTarget ?? 3;
  const nextCompleted = (session?.levelWordsCompleted || 0) + 1;

  if (nextCompleted >= currentTarget && curLevel < MAX_GAME_LEVEL) {
    const nextLevel = curLevel + 1;
    const nextLevelCfg = getLevelConfig(gameId, nextLevel);
    return {
      session: {
        ...session,
        level: nextLevel,
        levelWordsCompleted: 0,
        levelWordsTarget: nextLevelCfg?.targetWords ?? 4,
        levelUps: (session?.levelUps || 0) + 1,
      },
      leveledUp: true,
      newLevel: nextLevel,
      previousLevel: curLevel,
      levelConfig: nextLevelCfg,
      timeBonus: nextLevelCfg?.timeBonus ?? 8,
    };
  }

  return {
    session: {
      ...session,
      levelWordsCompleted: nextCompleted,
    },
    leveledUp: false,
    newLevel: curLevel,
    levelConfig: currentLevelCfg,
    timeBonus: 0,
  };
}

export function createGameSession(config) {
  const gameId = config?.id;
  const firstLevelCfg = getLevelConfig(gameId, 1);
  return {
    index: 0,
    correctWords: 0,
    correctUnits: 0,
    incorrectUnits: 0,
    typedUnits: 0,
    errors: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    lives: config?.lives ?? null,
    level: 1,
    levelWordsCompleted: 0,
    levelWordsTarget: firstLevelCfg?.targetWords ?? 3,
    maxLevel: MAX_GAME_LEVEL,
    levelUps: 0,
  };
}

function comparable(value) {
  return normalizeForComparison(String(value ?? "").trim()).toLocaleLowerCase();
}

export function evaluateGameAttempt(expected, received, language = "en") {
  const expectedText = comparable(expected);
  const receivedText = comparable(received);
  return {
    isCorrect: Boolean(receivedText) && expectedText === receivedText,
    expectedUnits: segmentGraphemes(expectedText, language).length,
    receivedUnits: segmentGraphemes(receivedText, language).length,
  };
}

export function applyGameAttempt(session, attempt) {
  if (attempt.isCorrect) {
    const streak = session.streak + 1;
    const streakBonus = Math.min(streak, 10) * 5;
    return {
      ...session,
      index: session.index + 1,
      correctWords: session.correctWords + 1,
      correctUnits: session.correctUnits + attempt.expectedUnits,
      typedUnits: session.typedUnits + attempt.receivedUnits,
      streak,
      bestStreak: Math.max(session.bestStreak, streak),
      score: session.score + attempt.expectedUnits * 10 + streakBonus,
    };
  }

  return {
    ...session,
    incorrectUnits:
      session.incorrectUnits
      + Math.max(attempt.expectedUnits, attempt.receivedUnits, 1),
    typedUnits: session.typedUnits + attempt.receivedUnits,
    errors: session.errors + 1,
    streak: 0,
    score: Math.max(0, session.score - 10),
  };
}

export function applyMissedWord(session, expected, language = "en") {
  const missedUnits = Math.max(
    segmentGraphemes(comparable(expected), language).length,
    1,
  );
  return {
    ...session,
    index: session.index + 1,
    incorrectUnits: session.incorrectUnits + missedUnits,
    errors: session.errors + 1,
    streak: 0,
    lives: session.lives === null ? null : Math.max(0, session.lives - 1),
  };
}

export function calculateGameAccuracy(session) {
  const total = session.correctUnits + session.incorrectUnits;
  return total ? (session.correctUnits / total) * 100 : 0;
}

export function buildGameResultPayload({ lesson, session, startedAt, duration }) {
  const isKhmer = lesson.language === "km";
  const totalUnits = session.correctUnits + session.incorrectUnits;
  return {
    lessonId: lesson.id,
    startedAt: (startedAt ?? new Date()).toISOString(),
    duration: Math.max(Number(duration) || 0, 0.1),
    totalTyped: session.typedUnits,
    totalCharacters: isKhmer ? 0 : totalUnits,
    correctCharacters: isKhmer ? 0 : session.correctUnits,
    incorrectCharacters: isKhmer ? 0 : session.incorrectUnits,
    totalGraphemes: totalUnits,
    correctGraphemes: session.correctUnits,
    incorrectGraphemes: session.incorrectUnits,
    errors: session.errors,
    mode: "game",
    level: session.level || 1,
    maxLevel: session.maxLevel || MAX_GAME_LEVEL,
  };
}

export function shuffledItems(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
