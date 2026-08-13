export function calculateStars(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

export function calculateTypingMetrics({
  language,
  duration,
  correctUnits,
  incorrectUnits,
  errors,
}) {
  const minutes = Math.max(duration / 60, 1 / 600);
  const totalTyped = correctUnits + incorrectUnits;
  const accuracy =
    totalTyped === 0 ? 0 : (correctUnits / totalTyped) * 100;
  const cpm = correctUnits / minutes;
  const approximateWpm = correctUnits / 5 / minutes;
  const wpm = language === "en" ? approximateWpm : 0;
  const speedValue = language === "en" ? wpm : cpm / 5;
  const score = Math.min(
    1000,
    Math.max(
      0,
      Math.round(
        accuracy * 6 + speedValue * 8 + Math.max(0, 200 - errors * 5),
      ),
    ),
  );

  return {
    accuracy: Number(accuracy.toFixed(2)),
    approximateWpm: Number(approximateWpm.toFixed(2)),
    cpm: Number(cpm.toFixed(2)),
    score,
    stars: calculateStars(accuracy),
    wpm: Number(wpm.toFixed(2)),
  };
}
