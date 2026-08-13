import { describe, expect, it } from "vitest";

import { applyGuidedInput, measureTypingProgress } from "../src/features/typing/typingProgress.js";

describe("typing progress", () => {
  it("does not complete a same-length incorrect answer", () => {
    const progress = measureTypingProgress({ targetText: "cat", inputText: "car", language: "en" });
    expect(progress.isComplete).toBe(false);
    expect(progress.completedGraphemes).toBe(2);
    expect(progress.hasCurrentError).toBe(true);
  });

  it("keeps a Khmer cluster active while it is being composed", () => {
    const partial = measureTypingProgress({ targetText: "ខ្ញុំ", inputText: "ខ", language: "km" });
    expect(partial.completedGraphemes).toBe(0);
    expect(partial.hasCurrentError).toBe(false);
    expect(partial.nextCharacter).toBe("្");
  });

  it("counts a completed Khmer cluster as one typing unit", () => {
    const progress = measureTypingProgress({ targetText: "ខ្ញុំ", inputText: "ខ្ញុំ", language: "km" });
    expect(progress.isComplete).toBe(true);
    expect(progress.completedGraphemes).toBe(progress.targetSegments.length);
  });

  it("accepts a multi-codepoint Khmer key output in one update", () => {
    const result = applyGuidedInput({ targetText: "សាលារៀន", currentInput: "ស", proposedInput: "សា" });
    expect(result).toEqual({ acceptedValue: "សា", errors: 0 });
  });

  it("rejects a wrong key without trapping the learner", () => {
    const wrong = applyGuidedInput({ targetText: "កម្ពុជា", currentInput: "ក", proposedInput: "កx" });
    expect(wrong).toEqual({ acceptedValue: "ក", errors: 1 });

    const recovered = applyGuidedInput({ targetText: "កម្ពុជា", currentInput: wrong.acceptedValue, proposedInput: "កម" });
    expect(recovered).toEqual({ acceptedValue: "កម", errors: 0 });
  });

  it("accepts the NIDA zero-width space for a visible lesson space", () => {
    const result = applyGuidedInput({ targetText: "ខ្ញុំ រៀន", currentInput: "ខ្ញុំ", proposedInput: "ខ្ញុំ\u200b", language: "km" });
    expect(result).toEqual({ acceptedValue: "ខ្ញុំ ", errors: 0 });
  });
});
