import assert from "node:assert/strict";
import test from "node:test";

import {
  alignGraphemes,
  normalizeForComparison,
  segmentGraphemes,
} from "../src/typing/graphemes.js";

test("normalizes line endings and canonical Unicode", () => {
  assert.equal(normalizeForComparison("Cafe\u0301\r\n"), "Café\n");
});

test("segments Khmer text by grapheme instead of code units", () => {
  const value = "ខ្ញុំ";
  const graphemes = segmentGraphemes(value, "km");

  assert.ok(graphemes.length < value.length);
  assert.equal(graphemes.join(""), value.normalize("NFC"));
});

test("alignment avoids cascading errors after an omission", () => {
  const result = alignGraphemes("school", "scool", "en");

  assert.equal(result.edits, 1);
  assert.equal(result.correct, 5);
});
