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

const NORMALIZE_CACHE_LIMIT = 2000;
const normalizeCache = new Map();

export function normalizeForComparison(value) {
  if (value === null || value === undefined) return "";
  const key = String(value);
  let result = normalizeCache.get(key);
  if (result !== undefined) return result;

  result = key.replace(/\r\n?/g, "\n").normalize("NFC");
  if (normalizeCache.size >= NORMALIZE_CACHE_LIMIT) {
    const firstKey = normalizeCache.keys().next().value;
    normalizeCache.delete(firstKey);
  }
  normalizeCache.set(key, result);
  return result;
}

const SEGMENT_CACHE_LIMIT = 2000;
const segmentCache = new Map();

export function segmentGraphemes(value, locale = "en") {
  const normalized = normalizeForComparison(value);
  const cacheKey = `${locale}:${normalized}`;
  let cached = segmentCache.get(cacheKey);
  if (cached !== undefined) return cached;

  cached = Object.freeze(
    [...getSegmenter(locale).segment(normalized)].map(({ segment }) => segment),
  );

  if (segmentCache.size >= SEGMENT_CACHE_LIMIT) {
    const firstKey = segmentCache.keys().next().value;
    segmentCache.delete(firstKey);
  }
  segmentCache.set(cacheKey, cached);
  return cached;
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
