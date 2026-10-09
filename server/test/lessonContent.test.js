import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLessonTargetText,
  countLessonTargetGraphemes,
  LESSON_TARGET_MAX_GRAPHEMES,
  LESSON_TARGET_MIN_GRAPHEMES,
} from "@snp/shared";

import { englishCurriculum, khmerCurriculum, seedLessons } from "../src/seeds/lessonData.js";

const fluencyTypes = new Set(["sentence", "paragraph", "story"]);

test("all publishable seeded typing lessons contain 100-300 graphemes", () => {
  const invalid = seedLessons
    .filter((lesson) => lesson.isActive && lesson.isPublished && lesson.type !== "game")
    .map((lesson) => ({ slug: lesson.slug, count: countLessonTargetGraphemes(lesson) }))
    .filter(({ count }) => count < LESSON_TARGET_MIN_GRAPHEMES || count > LESSON_TARGET_MAX_GRAPHEMES);

  assert.deepEqual(invalid, []);
});

test("all seeded lessons are published and carry approved review status", () => {
  const unpublished = seedLessons.filter((lesson) => !lesson.isPublished || lesson.source.reviewStatus !== "approved");

  assert.deepEqual(unpublished, []);
});

test("published fluency lessons use original sentences instead of repeated filler", () => {
  const duplicated = seedLessons
    .filter((lesson) => lesson.isPublished && fluencyTypes.has(lesson.type))
    .map((lesson) => {
      const sentences = buildLessonTargetText(lesson)
        .split(/(?<=[.!?។៕])\s+/u)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
      return { slug: lesson.slug, sentences: sentences.length, unique: new Set(sentences).size };
    })
    .filter(({ sentences, unique }) => sentences !== unique);

  assert.deepEqual(duplicated, []);
});

test("English and Khmer fluency lessons set accuracy-first speed goals", () => {
  const fluencyCurriculum = [...englishCurriculum, ...khmerCurriculum]
    .filter((lesson) => lesson.isPublished && fluencyTypes.has(lesson.type));

  assert.ok(fluencyCurriculum.every((lesson) => lesson.minimumAccuracy >= 88));
  assert.ok(fluencyCurriculum.filter((lesson) => lesson.language === "en").every((lesson) => lesson.minimumSpeed >= 10));
  assert.ok(fluencyCurriculum.filter((lesson) => lesson.language === "km").every((lesson) => lesson.minimumSpeed >= 20));
});

test("published Khmer fluency text is normalized and has no isolated marks", () => {
  const isolatedKhmerMark = /(?:^|[\s.,!?។៕])[\u17B6-\u17D3\u17DD]/u;
  const invalid = khmerCurriculum
    .filter((lesson) => lesson.isPublished && fluencyTypes.has(lesson.type))
    .map((lesson) => ({ slug: lesson.slug, text: buildLessonTargetText(lesson) }))
    .filter(({ text }) => text !== text.normalize("NFC") || text.includes("�") || isolatedKhmerMark.test(text))
    .map(({ slug }) => slug);

  assert.deepEqual(invalid, []);
});

test("authored lessons carry approved review metadata", () => {
  const authored = seedLessons.filter((lesson) => lesson.contentStatus === "custom");

  assert.ok(authored.length > 0);
  assert.ok(authored.every((lesson) => lesson.source.sourceBook === "SNP Typing Authored Curriculum"));
  assert.ok(authored.every((lesson) => lesson.source.reviewStatus === "approved"));
});
