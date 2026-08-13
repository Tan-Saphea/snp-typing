import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateStars,
  calculateTypingMetrics,
} from "../src/services/resultScoring.js";

test("assigns stars at the documented thresholds", () => {
  assert.equal(calculateStars(95), 3);
  assert.equal(calculateStars(85), 2);
  assert.equal(calculateStars(70), 1);
  assert.equal(calculateStars(69.99), 0);
});

test("calculates standard English WPM", () => {
  const metrics = calculateTypingMetrics({
    language: "en",
    duration: 60,
    correctUnits: 100,
    incorrectUnits: 0,
    errors: 0,
  });

  assert.equal(metrics.wpm, 20);
  assert.equal(metrics.cpm, 100);
  assert.equal(metrics.accuracy, 100);
});

test("uses grapheme CPM as Khmer primary speed", () => {
  const metrics = calculateTypingMetrics({
    language: "km",
    duration: 60,
    correctUnits: 80,
    incorrectUnits: 5,
    errors: 5,
  });

  assert.equal(metrics.wpm, 0);
  assert.equal(metrics.cpm, 80);
  assert.equal(metrics.accuracy, 94.12);
});
