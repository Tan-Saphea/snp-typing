import { normalizeForComparison, segmentGraphemes } from "@snp/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { applyGuidedInput, measureTypingProgress } from "./typingProgress.js";

export function useTypingEngine({ targetText, language, allowBackspace = true }) {
  const locale = language === "km" ? "km" : "en";
  const normalizedTarget = useMemo(() => normalizeForComparison(targetText), [targetText]);
  const targetSegments = useMemo(() => segmentGraphemes(normalizedTarget, locale), [locale, normalizedTarget]);
  const [rawInput, setRawInput] = useState("");
  const [committedInput, setCommittedInput] = useState("");
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [inputError, setInputError] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const composingRef = useRef(false);
  const errorTimerRef = useRef(null);
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

  useEffect(() => () => window.clearTimeout(errorTimerRef.current), []);

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
    onKeyDown(event) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Delete", "Tab"].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "Backspace" && !allowBackspace) event.preventDefault();
      if ((event.ctrlKey || event.metaKey) && ["v", "x", "z"].includes(event.key.toLowerCase())) event.preventDefault();
    },
    onSelect(event) {
      const input = event.currentTarget;
      window.requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    },
  };

  const inputVirtualKey = useCallback((key) => {
    if (composingRef.current || isComplete) return;

    if (key === "Backspace") {
      if (!allowBackspace || committedInput.length === 0) return;
      const valueChars = [...committedInput];
      const nextVal = valueChars.slice(0, -1).join("");
      setRawInput(nextVal);
      setCommittedInput(nextVal);
      return;
    }

    if (typeof key !== "string" || key.length === 0) return;

    const targetLen = [...normalizedTarget].length;
    const currentChars = [...committedInput];
    if (currentChars.length >= targetLen) return;

    const nextVal = `${committedInput}${key}`;
    commitValue(nextVal);
  }, [allowBackspace, commitValue, committedInput, isComplete, normalizedTarget]);

  function reset() {
    composingRef.current = false;
    setRawInput("");
    setCommittedInput("");
    setStartedAt(null);
    setElapsedTime(0);
    setErrors(0);
    setInputError(false);
    window.clearTimeout(errorTimerRef.current);
    startedAtRef.current = null;
    setResetVersion((value) => value + 1);
  }

  return {
    accuracy,
    correctCharacters,
    cpm,
    currentIndex,
    elapsedTime,
    errors,
    incorrectCharacters,
    incorrectGraphemes,
    correctGraphemes,
    hasCurrentError,
    inputHandlers,
    inputVirtualKey,
    inputSegments,
    isComplete,
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
