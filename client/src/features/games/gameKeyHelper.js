import { getKeyboardOutput } from "../typing/keyboardLayouts.js";

/**
 * Resolves a physical keyboard event to the target character for the given language.
 * Seamlessly supports both physical US QWERTY layouts and native OS keyboard inputs.
 */
export function resolveGameKey(event, language) {
  if (!event) return "";

  // If typing in Khmer track
  if (language === "km") {
    // If the event.key is already a native Khmer character (code point > 127), use directly
    if (event.key && event.key.charCodeAt(0) > 127) {
      return event.key;
    }

    // Space key: in Khmer NIDA, Shift + Space produces visible space " " (ដកឃ្លា), unshifted produces ZWSP "\u200B"
    if (event.code === "Space") {
      return event.shiftKey ? " " : "\u200B";
    }

    // Physical key translation for learners typing on standard US QWERTY keyboards
    if (event.code) {
      const modifier = event.shiftKey ? "shift" : event.altKey ? "altGr" : false;
      const translated = getKeyboardOutput("km", event.code, modifier);
      if (translated) return translated;
    }
  }

  return event.key || "";
}

/**
 * Checks whether the input character matches the next expected character of the target word.
 */
export function matchNextChar(targetWord, typedText = "", inputChar = "", language = "en") {
  if (!targetWord || !inputChar) return false;
  const currentLen = typedText.length;
  if (currentLen >= targetWord.length) return false;

  const expectedChar = targetWord[currentLen];
  if (!expectedChar) return false;

  if (language === "km") {
    const isVisibleSpaceMatch =
      expectedChar === " " && (inputChar === " " || inputChar === "\u00A0");
    const isZeroSpaceMatch =
      expectedChar === "\u200B" && inputChar === "\u200B";
    return inputChar === expectedChar || isVisibleSpaceMatch || isZeroSpaceMatch;
  }

  return inputChar.toLowerCase() === expectedChar.toLowerCase();
}

/**
 * Checks if the entire word has been typed.
 */
export function isWordCompleted(targetWord, typedText = "") {
  if (!targetWord) return false;
  return typedText.length >= targetWord.length;
}

/**
 * Splits a target word into typed, current-next, and remaining chunks for rich UI rendering.
 */
export function getWordDisplaySlices(word = "", typedText = "") {
  const currentLen = Math.min(typedText.length, word.length);
  const matched = word.slice(0, currentLen);
  const nextChar = word[currentLen] || "";
  const remaining = word.slice(currentLen + (nextChar ? 1 : 0));
  const progressPercent = word.length ? Math.min(100, Math.round((currentLen / word.length) * 100)) : 0;

  return {
    matched,
    nextChar,
    remaining,
    progressPercent,
    isComplete: currentLen >= word.length,
  };
}
