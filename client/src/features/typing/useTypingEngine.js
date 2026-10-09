import { normalizeForComparison, segmentGraphemes } from "@snp/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getKeyboardOutput } from "./keyboardLayouts.js";
import { playKeyboardSound } from "./keyboardSound.js";
import { applyGuidedInput, measureTypingProgress } from "./typingProgress.js";

export function useTypingEngine({
  targetText,
  language,
  allowBackspace = true,
  khmerInputMode = "native",
}) {
  const locale = language === "km" ? "km" : "en";
  const normalizedTarget = useMemo(() => normalizeForComparison(targetText), [targetText]);
  const targetSegments = useMemo(() => segmentGraphemes(normalizedTarget, locale), [locale, normalizedTarget]);
  const [rawInput, setRawInput] = useState("");
  const [committedInput, setCommittedInput] = useState("");
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [inputError, setInputError] = useState(false);
  const [englishKeyWarning, setEnglishKeyWarning] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const composingRef = useRef(false);
  const errorTimerRef = useRef(null);
  const englishWarningTimerRef = useRef(null);
  const startedAtRef = useRef(null);

  const inputSegments = useMemo(() => segmentGraphemes(committedInput, locale), [committedInput, locale]);
  const progress = useMemo(() => measureTypingProgress({ targetText: normalizedTarget, inputText: committedInput, language }), [committedInput, language, normalizedTarget]);
  const isComplete = progress.isComplete;
  const minutes = elapsedTime > 0 ? elapsedTime / 60 : 0;
  const currentIndex = progress.completedGraphemes;
  const nextChar = progress.nextCharacter;
  const remainingText = progress.remainingText;
  const hasCurrentError = progress.hasCurrentError || inputError;
  const correctGraphemes = progress.completedGraphemes;
  const correctCharacters = language === "km" ? correctGraphemes : progress.correctPrefixLength;
  const incorrectCharacters = errors;
  const incorrectGraphemes = errors;
  const totalTyped = correctCharacters + errors;
  const accuracy = totalTyped === 0 ? 100 : (correctCharacters / totalTyped) * 100;
  const wpm = minutes ? (language === "km" ? 0 : correctCharacters / 5 / minutes) : 0;
  const cpm = minutes ? correctCharacters / minutes : 0;

  useEffect(() => {
    if (!startedAt || isComplete) return undefined;

    const timer = window.setInterval(() => {
      setElapsedTime((Date.now() - startedAt.getTime()) / 1000);
    }, 200);

    return () => window.clearInterval(timer);
  }, [isComplete, startedAt]);

  useEffect(() => () => {
    window.clearTimeout(errorTimerRef.current);
    window.clearTimeout(englishWarningTimerRef.current);
  }, []);

  useEffect(() => {
    if (startedAt && isComplete) {
      setElapsedTime(Math.max((Date.now() - startedAt.getTime()) / 1000, 0.1));
    }
  }, [isComplete, startedAt]);

  const commitValue = useCallback((value) => {
    const proposedLength = [...normalizeForComparison(value)].length;
    const previousLength = [...committedInput].length;
    const result = applyGuidedInput({ targetText: normalizedTarget, currentInput: committedInput, proposedInput: value, allowBackspace, language });

    if (!startedAtRef.current && proposedLength > previousLength) {
      const start = new Date();
      startedAtRef.current = start;
      setStartedAt(start);
    }

    if (result.errors) {
      setErrors((current) => current + result.errors);
      setInputError(true);
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setInputError(false), 260);
    }

    setRawInput(result.acceptedValue);
    setCommittedInput(result.acceptedValue);
  }, [allowBackspace, committedInput, language, normalizedTarget]);

  const inputHandlers = {
    onChange(event) {
      const value = event.currentTarget.value;
      if (composingRef.current) setRawInput(value);
      else commitValue(value);
    },
    onCompositionStart() {
      composingRef.current = true;
    },
    onCompositionUpdate(event) {
      setRawInput(event.currentTarget.value);
    },
    onCompositionEnd(event) {
      composingRef.current = false;
      commitValue(event.currentTarget.value);
    },
    onPaste(event) {
      event.preventDefault();
    },
    onCopy(event) {
      event.preventDefault();
    },
    onCut(event) {
      event.preventDefault();
    },
    onDrop(event) {
      event.preventDefault();
    },
    onContextMenu(event) {
      event.preventDefault();
    },
    onKeyDown(event) {
      if (
        !event.repeat &&
        !event.isComposing &&
        !["Dead", "Process", "Unidentified"].includes(event.key)
      ) {
        playKeyboardSound({ key: event.key, code: event.code });
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Delete", "Tab"].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "Backspace" && !allowBackspace) event.preventDefault();
      if ((event.ctrlKey || event.metaKey) && ["v", "x", "c", "a", "insert"].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
      if (event.shiftKey && event.key === "Insert") {
        event.preventDefault();
      }

      // Space key: in Khmer NIDA, Shift + Space produces visible space " " (ដកឃ្លា), while unshifted Space produces ZWSP (\u200B)
      if (event.code === "Space") {
        event.preventDefault();
        if (language === "km") {
          const char = event.shiftKey ? " " : "\u200B";
          commitValue(`${committedInput}${char}`);
        } else {
          commitValue(`${committedInput} `);
        }
        return;
      }

      // If typing in Khmer:
      if (
        language === "km" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !composingRef.current &&
        event.key.length === 1
      ) {
        // When using Native Khmer NIDA mode (the authentic OS keyboard mode):
        if (khmerInputMode === "native") {
          // If learner types English Latin letters (a-z, A-Z), warn them to switch OS keyboard to Khmer
          if (/^[a-zA-Z]$/.test(event.key)) {
            setEnglishKeyWarning(true);
            window.clearTimeout(englishWarningTimerRef.current);
            englishWarningTimerRef.current = window.setTimeout(
              () => setEnglishKeyWarning(false),
              3500
            );
          }
          // Native keystrokes (Khmer Unicode) flow naturally into the input proxy
          return;
        }

        // When using US Keyboard Simulation (translate physical US keys to NIDA layout):
        if (khmerInputMode === "simulation" && event.key.charCodeAt(0) < 128) {
          const modifier = event.shiftKey ? "shift" : event.altKey ? "altGr" : false;
          const khmerChar = getKeyboardOutput("km", event.code, modifier);
          if (khmerChar) {
            event.preventDefault();
            commitValue(`${committedInput}${khmerChar}`);
          }
        }
      }
    },
    onSelect(event) {
      const input = event.currentTarget;
      window.requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    },
  };

  function reset() {
    composingRef.current = false;
    setRawInput("");
    setCommittedInput("");
    setStartedAt(null);
    setElapsedTime(0);
    setErrors(0);
    setInputError(false);
    setEnglishKeyWarning(false);
    window.clearTimeout(errorTimerRef.current);
    window.clearTimeout(englishWarningTimerRef.current);
    startedAtRef.current = null;
    setResetVersion((value) => value + 1);
  }

  return {
    accuracy,
    correctCharacters,
    cpm,
    currentIndex,
    elapsedTime,
    englishKeyWarning,
    errors,
    incorrectCharacters,
    incorrectGraphemes,
    correctGraphemes,
    hasCurrentError,
    inputHandlers,
    inputSegments,
    isComplete,
    khmerInputMode,
    rawInput,
    reset,
    resetVersion,
    startedAt,
    targetSegments,
    totalTyped,
    wpm,
    nextChar,
    remainingText,
  };
}
