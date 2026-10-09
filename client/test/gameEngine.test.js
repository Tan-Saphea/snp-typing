import { describe, expect, it } from "vitest";

import {
  MAX_GAME_LEVEL,
  advanceGameLevel,
  applyGameAttempt,
  applyMissedWord,
  buildGameResultPayload,
  calculateGameAccuracy,
  createGameSession,
  evaluateGameAttempt,
  filterWordsForLevel,
  getGameConfig,
  getLevelConfig,
  shuffledItems,
} from "../src/features/games/gameEngine.js";

describe("typing game engine", () => {
  it("recognizes kid-friendly games and initializes their lives and aliases", () => {
    const ghost = getGameConfig("ghost-catcher");
    expect(ghost.title).toBe("Ghost Catcher");
    expect(createGameSession(ghost).lives).toBe(3);

    // Aliases
    expect(getGameConfig("ghoes")?.id).toBe("ghost-catcher");
    expect(getGameConfig("roblox")?.id).toBe("roblox-obby");
    expect(getGameConfig("minegraf")?.id).toBe("minecraft-miner");
    expect(getGameConfig("minecraft")?.id).toBe("minecraft-miner");

    // Legacy fallbacks
    expect(getGameConfig("falling-words")?.id).toBe("ghost-catcher");
    expect(getGameConfig("balloon-typing")?.id).toBe("roblox-obby");
    expect(getGameConfig("picture-typing")?.id).toBe("minecraft-miner");
    expect(getGameConfig("speed-challenge")?.id).toBe("roblox-obby");

    expect(getGameConfig("unknown")).toBeNull();
  });

  it("normalizes and scores correct English attempts", () => {
    const attempt = evaluateGameAttempt("School", " school ", "en");
    const session = applyGameAttempt(
      createGameSession(getGameConfig("roblox-obby")),
      attempt,
    );
    expect(attempt.isCorrect).toBe(true);
    expect(session.correctWords).toBe(1);
    expect(session.index).toBe(1);
    expect(session.streak).toBe(1);
    expect(session.score).toBeGreaterThan(0);
    expect(calculateGameAccuracy(session)).toBe(100);
  });

  it("uses grapheme units for Khmer attempts", () => {
    const attempt = evaluateGameAttempt("សាលា", "សាលា", "km");
    expect(attempt.isCorrect).toBe(true);
    expect(attempt.expectedUnits).toBeGreaterThan(0);
    expect(attempt.expectedUnits).toBeLessThan("សាលា".length);
  });

  it("keeps the current word after a wrong answer and resets the streak", () => {
    const initial = { ...createGameSession(null), streak: 4, score: 100 };
    const next = applyGameAttempt(
      initial,
      evaluateGameAttempt("book", "back", "en"),
    );
    expect(next.index).toBe(0);
    expect(next.errors).toBe(1);
    expect(next.streak).toBe(0);
    expect(next.score).toBe(90);
  });

  it("advances and removes a life when a ghost or word is missed", () => {
    const initial = createGameSession(getGameConfig("ghost-catcher"));
    const next = applyMissedWord(initial, "keyboard", "en");
    expect(next.index).toBe(1);
    expect(next.lives).toBe(2);
    expect(next.incorrectUnits).toBe(8);
  });

  it("builds language-correct result payloads", () => {
    const session = {
      ...createGameSession(null),
      correctUnits: 5,
      incorrectUnits: 2,
      typedUnits: 7,
      errors: 1,
    };
    const payload = buildGameResultPayload({
      lesson: { id: "0123456789abcdef01234567", language: "km" },
      session,
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      duration: 20,
    });
    expect(payload.correctCharacters).toBe(0);
    expect(payload.correctGraphemes).toBe(5);
    expect(payload.totalGraphemes).toBe(7);
    expect(payload.mode).toBe("game");
    expect(payload.level).toBe(1);
    expect(payload.maxLevel).toBe(5);
  });

  it("can shuffle with a deterministic random source", () => {
    expect(shuffledItems(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });

  it("supports level progression across stages 1 to 5 with time bonus rewards", () => {
    const mc = getGameConfig("minecraft-miner");
    let session = createGameSession(mc);
    expect(session.level).toBe(1);
    expect(session.maxLevel).toBe(MAX_GAME_LEVEL);

    const lvl1Config = getLevelConfig("minecraft-miner", 1);
    expect(lvl1Config.title).toBe("Surface Stone & Dirt");
    expect(lvl1Config.pickaxe).toBe("Wooden Pickaxe");

    // Advance words to reach target
    const targetWords = lvl1Config.targetWords;
    let result;
    for (let i = 0; i < targetWords; i += 1) {
      result = advanceGameLevel(session, "minecraft-miner");
      session = result.session;
    }

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(session.level).toBe(2);
    expect(result.timeBonus).toBeGreaterThan(0);
    expect(result.levelConfig.pickaxe).toBe("Stone Pickaxe");
  });

  it("filters words progressively by level length", () => {
    const wordList = ["cat", "stone", "diamond", "netherite", "obsidian"];
    const lvl1Words = filterWordsForLevel(wordList, 1, "en");
    expect(lvl1Words).toContain("cat");
    expect(lvl1Words).toContain("stone");
    expect(lvl1Words).not.toContain("netherite");

    const lvl5Words = filterWordsForLevel(wordList, 5, "en");
    expect(lvl5Words).toContain("netherite");
    expect(lvl5Words).toContain("obsidian");
  });
});
