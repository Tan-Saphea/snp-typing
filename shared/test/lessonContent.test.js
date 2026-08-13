import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLessonTargetText,
  countLessonTargetGraphemes,
  isLessonTargetLengthValid,
} from "../src/typing/lessonContent.js";

test("builds story targets from story text instead of comprehension answers", () => {
  const lesson = {
    language: "en",
    content: {
      blocks: [{ kind: "story", text: "The story target.", answer: "A short answer." }],
    },
  };

  assert.equal(buildLessonTargetText(lesson), "The story target.");
});

test("builds picture and formatting targets from their practice values", () => {
  const lesson = {
    language: "en",
    content: {
      blocks: [
        { kind: "picture", answer: "pencil" },
        { kind: "formatting", text: "My School", items: ["Bold", "Center"] },
      ],
    },
  };

  assert.equal(buildLessonTargetText(lesson), "pencil\n\nMy School");
});

test("counts Khmer lesson targets by grapheme", () => {
  const lesson = {
    language: "km",
    content: { blocks: [{ kind: "paragraph", text: "ខ្ញុំ" }] },
  };

  assert.ok(countLessonTargetGraphemes(lesson) < "ខ្ញុំ".length);
  assert.equal(isLessonTargetLengthValid(lesson), false);
});
