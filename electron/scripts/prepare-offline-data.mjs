import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { seedLessons } from "../../server/src/seeds/lessonData.js";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const outputPath = path.join(projectRoot, "electron", "resources", "lessons.json");
const previousLessonByTrack = new Map();
const lessonBySlug = new Map();

function lessonId(slug) {
  return crypto.createHash("sha256").update(slug).digest("hex").slice(0, 24);
}

const lessons = seedLessons.map((sourceLesson) => {
  const { prerequisiteSlug, unlockTrack, ...lesson } = sourceLesson;
  const id = lessonId(sourceLesson.slug);
  const track = unlockTrack ?? `${sourceLesson.language}:${sourceLesson.category}:${sourceLesson.level}`;
  const prerequisiteLesson = prerequisiteSlug
    ? lessonBySlug.get(prerequisiteSlug)?.id ?? null
    : previousLessonByTrack.get(track)?.id ?? null;
  const prepared = { ...lesson, id, prerequisiteLesson };

  if (prepared.isActive && prepared.isPublished) previousLessonByTrack.set(track, prepared);
  lessonBySlug.set(prepared.slug, prepared);
  return prepared;
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), lessons }, null, 2)}\n`,
  "utf8",
);

console.log(`Prepared ${lessons.length} offline lessons at ${path.relative(projectRoot, outputPath)}.`);
