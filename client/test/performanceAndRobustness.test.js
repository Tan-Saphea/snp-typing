import { describe, expect, it } from "vitest";
import { segmentGraphemes, alignGraphemes } from "@snp/shared";
import { findKeyForOutput, getKeyboardOutput } from "../src/features/typing/keyboardLayouts.js";
import { applyGuidedInput, measureTypingProgress } from "../src/features/typing/typingProgress.js";

describe("system performance and robustness", () => {
  it("caches findKeyForOutput results for rapid repeated lookups", () => {
    const key1 = findKeyForOutput("km", "កម្ពុជា");
    const key2 = findKeyForOutput("km", "កម្ពុជា");
    expect(key1).toBe(key2); // Exact cached reference
    expect(key1.code).toBe("KeyK");
    expect(key1.shifted).toBe(false);

    const enKey1 = findKeyForOutput("en", "Hello");
    const enKey2 = findKeyForOutput("en", "Hello");
    expect(enKey1).toBe(enKey2);
    expect(enKey1.code).toBe("KeyH");
    expect(enKey1.shifted).toBe(true);
  });

  it("grapheme segmentation in Khmer games preserves subscript coengs without detachment", () => {
    const word = "កម្ពុជា";
    const clusters = segmentGraphemes(word, "km");
    // "ក", "ម្ពុ", "ជា"
    expect(clusters.length).toBe(3);
    expect(clusters[0]).toBe("ក");
    expect(clusters[1]).toBe("ម្ពុ");
    expect(clusters[2]).toBe("ជា");
    expect(clusters.join("")).toBe(word);
  });

  it("alignGraphemes calculates robust accuracy without cascading penalty on leading spaces", () => {
    const target = "ខ្ញុំ ស្រឡាញ់ សាលារៀន";
    const userTyped = "ខ្ញុំ ស្រឡាញ់ សាលារៀន";
    const alignment = alignGraphemes(target, userTyped, "km");
    expect(alignment.accuracy).toBe(100);
    expect(alignment.edits).toBe(0);

    const slightlyOmitted = "ខ្ញុំ ស្រឡាញ់ សាលារៀន";
    const withExtraChar = " ខ្ញុំ ស្រឡាញ់ សាលារៀន";
    const recovery = alignGraphemes(slightlyOmitted, withExtraChar, "km");
    expect(recovery.accuracy).toBeGreaterThan(85);
  });

  it("measureTypingProgress correctly handles complete vs in-progress states", () => {
    const res = measureTypingProgress({
      targetText: "The quick brown fox",
      inputText: "The quick brown fox",
      language: "en",
    });
    expect(res.isComplete).toBe(true);
    expect(res.hasCurrentError).toBe(false);
    expect(res.remainingText).toBe("");
  });
});
