const segmenters = new Map();

function getSegmenter(locale) {
  if (!segmenters.has(locale)) {
    segmenters.set(
      locale,
      new Intl.Segmenter(locale, { granularity: "grapheme" }),
    );
  }

  return segmenters.get(locale);
}

export function normalizeForComparison(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").normalize("NFC");
}

export function segmentGraphemes(value, locale = "en") {
  const normalized = normalizeForComparison(value);

  return [...getSegmenter(locale).segment(normalized)].map(
    ({ segment }) => segment,
  );
}

export function alignGraphemes(target, input, locale = "en") {
  const targetSegments = segmentGraphemes(target, locale);
  const inputSegments = segmentGraphemes(input, locale);
  const rows = targetSegments.length + 1;
  const columns = inputSegments.length + 1;
  const distance = Array.from({ length: rows }, () =>
    Array(columns).fill(0),
  );

  for (let targetIndex = 0; targetIndex < rows; targetIndex += 1) {
    distance[targetIndex][0] = targetIndex;
  }

  for (let inputIndex = 0; inputIndex < columns; inputIndex += 1) {
    distance[0][inputIndex] = inputIndex;
  }

  for (let targetIndex = 1; targetIndex < rows; targetIndex += 1) {
    for (let inputIndex = 1; inputIndex < columns; inputIndex += 1) {
      const substitutionCost =
        targetSegments[targetIndex - 1] === inputSegments[inputIndex - 1]
          ? 0
          : 1;

      distance[targetIndex][inputIndex] = Math.min(
        distance[targetIndex - 1][inputIndex] + 1,
        distance[targetIndex][inputIndex - 1] + 1,
        distance[targetIndex - 1][inputIndex - 1] + substitutionCost,
      );
    }
  }

  const edits = distance[targetSegments.length][inputSegments.length];
  const correct = Math.max(targetSegments.length - edits, 0);

  return {
    targetSegments,
    inputSegments,
    edits,
    correct,
    incorrect: edits,
    accuracy:
      targetSegments.length === 0
        ? 100
        : Math.max(0, (correct / targetSegments.length) * 100),
  };
}
