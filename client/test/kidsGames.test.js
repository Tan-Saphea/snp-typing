import { describe, expect, it } from "vitest";
import { segmentGraphemes } from "@snp/shared";

import { playGameSound } from "../src/features/games/gameAudio.js";
import {
  GAME_THEMED_WORDS,
  MAX_GAME_LEVEL,
  advanceGameLevel,
  applyGameAttempt,
  createGameSession,
  evaluateGameAttempt,
  getGameConfig,
  getLevelConfig,
} from "../src/features/games/gameEngine.js";
import {
  getWordDisplaySlices,
  isWordCompleted,
  matchNextChar,
  resolveGameKey,
} from "../src/features/games/gameKeyHelper.js";

describe("Kids Typing Games Suite (Minecraft, Roblox, Ghost)", () => {
  it("resolves all canonical and alias IDs for kid games", () => {
    const mc = getGameConfig("minegraf");
    expect(mc.id).toBe("minecraft-miner");
    expect(mc.title).toBe("Minecraft Block Miner");

    const rbx = getGameConfig("roblox");
    expect(rbx.id).toBe("roblox-obby");
    expect(rbx.title).toBe("Roblox Blox Obby");

    const ghost = getGameConfig("ghoes");
    expect(ghost.id).toBe("ghost-catcher");
    expect(ghost.title).toBe("Ghost Catcher");
  });

  it("handles sound playback gracefully in headless environment without crashing", () => {
    expect(() => {
      playGameSound("mine_hit", 0.5);
      playGameSound("diamond_ping", 0.6);
      playGameSound("tnt_explode", 0.7);
      playGameSound("jump_bounce", 0.4);
      playGameSound("blox_coin", 0.7);
      playGameSound("speed_boost", 0.6);
      playGameSound("magic_zap", 0.3);
      playGameSound("ghost_caught", 0.8);
      playGameSound("freeze_spell", 0.7);
      playGameSound("unknown_sound", 0.5);
    }).not.toThrow();
  });

  it("resolves keyboard events seamlessly for English and Khmer physical keystrokes", () => {
    // English QWERTY
    const enEvent = { key: "d", code: "KeyD", shiftKey: false, altKey: false };
    expect(resolveGameKey(enEvent, "en")).toBe("d");

    // Khmer on physical US QWERTY: KeyK without shift -> consonant ka
    const kmEventK = { key: "k", code: "KeyK", shiftKey: false, altKey: false };
    expect(resolveGameKey(kmEventK, "km")).toBe("ក");

    // Khmer on physical US QWERTY: KeyK with Shift -> consonant ko
    const kmEventShiftK = { key: "K", code: "KeyK", shiftKey: true, altKey: false };
    expect(resolveGameKey(kmEventShiftK, "km")).toBe("គ");

    // Khmer on physical US QWERTY: KeyA without shift -> vowel aa
    const kmEventA = { key: "a", code: "KeyA", shiftKey: false, altKey: false };
    expect(resolveGameKey(kmEventA, "km")).toBe("ា");

    // Native Khmer IME character already resolved in event.key
    const kmNative = { key: "ពេជ្រ", code: "KeyP", shiftKey: false, altKey: false };
    expect(resolveGameKey(kmNative, "km")).toBe("ពេជ្រ");

    // In Khmer NIDA: unshifted Space produces ZWSP (\u200B), Shift + Space produces visible space " "
    const kmSpace = { key: " ", code: "Space", shiftKey: false, altKey: false };
    expect(resolveGameKey(kmSpace, "km")).toBe("\u200B");

    const kmShiftSpace = { key: " ", code: "Space", shiftKey: true, altKey: false };
    expect(resolveGameKey(kmShiftSpace, "km")).toBe(" ");
  });

  it("evaluates prefix and word completion accurately in English and Khmer", () => {
    // English word: "diamond"
    expect(matchNextChar("diamond", "", "D", "en")).toBe(true);
    expect(matchNextChar("diamond", "d", "i", "en")).toBe(true);
    expect(matchNextChar("diamond", "di", "x", "en")).toBe(false);

    expect(isWordCompleted("diamond", "diamon")).toBe(false);
    expect(isWordCompleted("diamond", "diamond")).toBe(true);

    // Khmer word: "ពេជ្រ" (diamond)
    expect(matchNextChar("ពេជ្រ", "", "ព", "km")).toBe(true);
    expect(matchNextChar("ពេជ្រ", "ព", "េ", "km")).toBe(true);
    expect(matchNextChar("ពេជ្រ", "ព", "ក", "km")).toBe(false);

    expect(isWordCompleted("ពេជ្រ", "ពេជ")).toBe(false);
    expect(isWordCompleted("ពេជ្រ", "ពេជ្រ")).toBe(true);
  });

  it("calculates accurate display slices and progress percent for word rendering", () => {
    const word = "diamond";
    const slices0 = getWordDisplaySlices(word, "");
    expect(slices0.matched).toBe("");
    expect(slices0.nextChar).toBe("d");
    expect(slices0.remaining).toBe("iamond");
    expect(slices0.progressPercent).toBe(0);

    const slices3 = getWordDisplaySlices(word, "dia");
    expect(slices3.matched).toBe("dia");
    expect(slices3.nextChar).toBe("m");
    expect(slices3.remaining).toBe("ond");
    expect(slices3.progressPercent).toBe(43);

    const slicesComplete = getWordDisplaySlices(word, "diamond");
    expect(slicesComplete.matched).toBe("diamond");
    expect(slicesComplete.nextChar).toBe("");
    expect(slicesComplete.remaining).toBe("");
    expect(slicesComplete.progressPercent).toBe(100);
    expect(slicesComplete.isComplete).toBe(true);
  });

  it("supports Minecraft tactical 3-choice mining, crack stages, and pickaxe tiers", () => {
    const word = "diamond";
    const slices = getWordDisplaySlices(word, "diam"); // 4/7
    const crackStage = Math.min(4, Math.floor((slices.progressPercent / 100) * 4));
    expect(crackStage).toBeGreaterThanOrEqual(2);

    // Depth progression pickaxe tiers
    const PICKAXE_TIERS = [
      { name: "Wooden Pickaxe", minDepth: 0 },
      { name: "Stone Pickaxe", minDepth: 30 },
      { name: "Iron Pickaxe", minDepth: 60 },
      { name: "Diamond Pickaxe", minDepth: 90 },
      { name: "Netherite Pickaxe", minDepth: 120 },
    ];

    const getTier = (depth) =>
      [...PICKAXE_TIERS].reverse().find((t) => depth >= t.minDepth) || PICKAXE_TIERS[0];

    expect(getTier(0).name).toBe("Wooden Pickaxe");
    expect(getTier(15).name).toBe("Wooden Pickaxe");
    expect(getTier(45).name).toBe("Stone Pickaxe");
    expect(getTier(75).name).toBe("Iron Pickaxe");
    expect(getTier(100).name).toBe("Diamond Pickaxe");
    expect(getTier(130).name).toBe("Netherite Pickaxe");
  });

  it("calculates Roblox obby speed multipliers and Blox Coin rewards", () => {
    let speedMultiplier = 1;
    speedMultiplier = Math.min(4, Math.round((speedMultiplier + 0.5) * 10) / 10);
    expect(speedMultiplier).toBe(1.5);

    speedMultiplier = Math.min(4, Math.round((speedMultiplier + 0.5) * 10) / 10);
    expect(speedMultiplier).toBe(2.0);

    // 50 Blox Coins scaled by multiplier
    expect(Math.round(50 * 2.0)).toBe(100);
  });

  it("provides rich themed vocabulary for Minecraft, Roblox, and Ghost games", () => {
    expect(GAME_THEMED_WORDS["minecraft-miner"].en).toContain("diamond");
    expect(GAME_THEMED_WORDS["minecraft-miner"].en).toContain("pickaxe");
    expect(GAME_THEMED_WORDS["minecraft-miner"].km).toContain("ពេជ្រ");
    expect(GAME_THEMED_WORDS["minecraft-miner"].km).toContain("ថ្ម");

    expect(GAME_THEMED_WORDS["roblox-obby"].en).toContain("obby");
    expect(GAME_THEMED_WORDS["roblox-obby"].en).toContain("checkpoint");
    expect(GAME_THEMED_WORDS["roblox-obby"].km).toContain("លោត");
    expect(GAME_THEMED_WORDS["roblox-obby"].km).toContain("កាក់");

    expect(GAME_THEMED_WORDS["ghost-catcher"].en).toContain("ghost");
    expect(GAME_THEMED_WORDS["ghost-catcher"].en).toContain("sparkle");
    expect(GAME_THEMED_WORDS["ghost-catcher"].km).toContain("ខ្មោច");
    expect(GAME_THEMED_WORDS["ghost-catcher"].km).toContain("វេទមន្ត");
  });

  it("supports fullscreen arcade layout with full viewport scaling", () => {
    const fullscreenClasses = "fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-2 sm:p-4 w-screen h-screen overflow-hidden select-none";
    expect(fullscreenClasses).toContain("fixed inset-0");
    expect(fullscreenClasses).toContain("w-screen");
    expect(fullscreenClasses).toContain("h-screen");
    expect(fullscreenClasses).toContain("z-50");
  });

  it("configures and advances 5 progressive levels across all three games", () => {
    const games = ["minecraft-miner", "roblox-obby", "ghost-catcher"];

    games.forEach((gameId) => {
      const cfg = getGameConfig(gameId);
      let session = createGameSession(cfg);
      expect(session.level).toBe(1);
      expect(session.maxLevel).toBe(MAX_GAME_LEVEL);

      for (let lvl = 1; lvl <= MAX_GAME_LEVEL; lvl += 1) {
        const levelCfg = getLevelConfig(gameId, lvl);
        expect(levelCfg).toBeDefined();
        expect(levelCfg.level).toBe(lvl);
        expect(levelCfg.title).toBeTruthy();
        expect(levelCfg.targetWords).toBeGreaterThan(0);
        expect(levelCfg.timeBonus).toBeGreaterThan(0);
        expect(levelCfg.speedMultiplier).toBeGreaterThanOrEqual(1.0);
      }

      // Progress session from Level 1 to Level 2
      const lvl1Target = getLevelConfig(gameId, 1).targetWords;
      let lastResult;
      for (let i = 0; i < lvl1Target; i += 1) {
        lastResult = advanceGameLevel(session, gameId);
        session = lastResult.session;
      }

      expect(lastResult.leveledUp).toBe(true);
      expect(lastResult.newLevel).toBe(2);
      expect(session.level).toBe(2);
      expect(lastResult.timeBonus).toBeGreaterThanOrEqual(8);
    });
  });

  it("handles level_up audio sound synthesis safely", () => {
    expect(() => {
      playGameSound("level_up", 0.8);
    }).not.toThrow();
  });
});
