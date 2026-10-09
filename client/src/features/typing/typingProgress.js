import { normalizeForComparison, segmentGraphemes } from "@snp/shared";

export function measureTypingProgress({ targetText, inputText, language }) {
  const locale = language === "km" ? "km" : "en";
  const normalizedTarget = normalizeForComparison(targetText);
  const normalizedInput = normalizeForComparison(inputText);
  const targetSegments = segmentGraphemes(normalizedTarget, locale);
  const targetChars = [...normalizedTarget];
  const inputChars = [...normalizedInput];
  let correctPrefixLength = 0;

  while (
    correctPrefixLength < inputChars.length &&
    correctPrefixLength < targetChars.length &&
    inputChars[correctPrefixLength] === targetChars[correctPrefixLength]
  ) {
    correctPrefixLength += 1;
  }

  let completedGraphemes = 0;
  let graphemeEnd = 0;
  for (const segment of targetSegments) {
    graphemeEnd += [...segment].length;
    if (graphemeEnd > correctPrefixLength) break;
    completedGraphemes += 1;
  }

  return {
    completedGraphemes,
    correctPrefixLength,
    hasCurrentError: correctPrefixLength < inputChars.length,
    isComplete: targetSegments.length > 0 && normalizedInput === normalizedTarget,
    nextCharacter: targetChars[correctPrefixLength] ?? "",
    remainingText: targetChars.slice(correctPrefixLength).join(""),
    targetSegments,
  };
}

export function applyGuidedInput({ targetText, currentInput, proposedInput, allowBackspace = true, language = "en" }) {
  const targetChars = [...normalizeForComparison(targetText)];
  const currentChars = [...normalizeForComparison(currentInput)];
  const proposedChars = [...normalizeForComparison(proposedInput)];

  if (proposedChars.length < currentChars.length) {
    return {
      acceptedValue: allowBackspace ? proposedChars.join("") : currentChars.join(""),
      errors: 0,
    };
  }

  const accepted = [...currentChars];
  let errors = 0;
  for (const character of proposedChars.slice(currentChars.length)) {
    if (accepted.length >= targetChars.length) break;
    const expected = targetChars[accepted.length];
    const isKhmerVisibleSpace =
      language === "km" &&
      expected === " " &&
      (character === " " || character === "\u00a0");
    const isKhmerZeroSpace =
      language === "km" &&
      expected === "\u200B" &&
      character === "\u200B";
    if (character === expected || isKhmerVisibleSpace || isKhmerZeroSpace) {
      accepted.push(expected);
    } else {
      errors += 1;
    }
  }

  return { acceptedValue: accepted.join(""), errors };
}
