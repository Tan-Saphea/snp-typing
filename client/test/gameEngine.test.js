import { describe, expect, it } from "vitest";

import {
  applyGameAttempt,
  applyMissedWord,
  buildGameResultPayload,
  calculateGameAccuracy,
  createGameSession,
  evaluateGameAttempt,
  getGameConfig,
  shuffledItems,
} from "../src/features/games/gameEngine.js";

describe("typing game engine", () => {
  it("recognizes supported games and initializes their lives", () => {
    const config = getGameConfig("falling-words");
    expect(config.title).toBe("Falling Words");
    expect(createGameSession(config).lives).toBe(3);
    expect(getGameConfig("unknown")).toBeNull();
  });

  it("normalizes and scores correct English attempts", () => {
    const attempt = evaluateGameAttempt("School", " school ", "en");
    const session = applyGameAttempt(
      createGameSession(getGameConfig("speed-challenge")),
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

  it("advances and removes a life when a falling word is missed", () => {
    const initial = createGameSession(getGameConfig("falling-words"));
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
  });

  it("can shuffle with a deterministic random source", () => {
    expect(shuffledItems(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });
});
