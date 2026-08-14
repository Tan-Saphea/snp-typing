import assert from "node:assert/strict";
import test from "node:test";

import { isLessonLocked } from "../src/services/lessonService.js";

test("a lesson without a prerequisite is open", () => {
  assert.equal(isLessonLocked(null, new Map()), false);
});

test("a prerequisite keeps the next lesson locked until it is passed", () => {
  const progress = new Map([["lesson-1", { passed: false }]]);
  assert.equal(isLessonLocked("lesson-1", progress), true);

  progress.set("lesson-1", { passed: true });
  assert.equal(isLessonLocked("lesson-1", progress), false);
});
