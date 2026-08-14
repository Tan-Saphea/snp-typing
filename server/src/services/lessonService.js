import mongoose from "mongoose";

import { Lesson } from "../models/Lesson.js";
import { Result } from "../models/Result.js";
import ApiError from "../utils/ApiError.js";

export function lessonToJSON(lesson) {
  const value = lesson.toObject ? lesson.toObject() : { ...lesson };
  value.id = value._id.toString();
  delete value._id;
  delete value.__v;

  if (value.prerequisiteLesson) value.prerequisiteLesson = value.prerequisiteLesson.toString();
  for (const field of ["createdBy", "updatedBy"]) {
    const reference = value[field];
    if (reference instanceof mongoose.Types.ObjectId) value[field] = reference.toString();
    else if (reference?._id) {
      value[field] = { ...reference, id: reference._id.toString() };
      delete value[field]._id;
      delete value[field].__v;
    }
  }
  return value;
}

function chooseBestResult(current, candidate) {
  if (!current) return candidate;
  if (candidate.stars !== current.stars) return candidate.stars > current.stars ? candidate : current;
  if (candidate.score !== current.score) return candidate.score > current.score ? candidate : current;
  return candidate.accuracy > current.accuracy ? candidate : current;
}

export async function getLessonProgress(studentId, lessonIds) {
  const results = await Result.find({ student: studentId, lesson: { $in: lessonIds } })
    .sort({ completedAt: -1 })
    .lean();
  const progress = new Map();

  for (const result of results) {
    const lessonId = result.lesson.toString();
    const current = progress.get(lessonId);
    progress.set(lessonId, {
      attempts: (current?.attempts ?? 0) + 1,
      best: chooseBestResult(current?.best, result),
      completed: true,
      passed: (current?.passed ?? false) || result.passed,
    });
  }

  return progress;
}

function progressPayload(value) {
  if (!value) {
    return { attempts: 0, completed: false, passed: false, bestAccuracy: 0, bestCpm: 0, bestScore: 0, bestStars: 0, bestWpm: 0 };
  }
  return {
    attempts: value.attempts,
    completed: value.completed,
    passed: value.passed,
    bestAccuracy: value.best.accuracy,
    bestCpm: value.best.cpm,
    bestScore: value.best.score,
    bestStars: value.best.stars,
    bestWpm: value.best.wpm,
  };
}

export function isLessonLocked(prerequisiteLesson, progress) {
  const prerequisiteId = prerequisiteLesson?.toString();
  return Boolean(prerequisiteId && !progress.get(prerequisiteId)?.passed);
}

export async function assertLessonUnlocked(userId, lesson) {
  const prerequisiteId = lesson.prerequisiteLesson?.toString();
  if (!prerequisiteId) return;

  const passedPrerequisite = await Result.exists({
    student: userId,
    lesson: prerequisiteId,
    passed: true,
  });
  if (passedPrerequisite) return;

  const prerequisite = await Lesson.findById(prerequisiteId).select("title").lean();
  const title = prerequisite?.title || "the previous lesson";
  throw new ApiError(
    403,
    "LESSON_LOCKED",
    `Complete “${title}” with a passing score to unlock this lesson.`,
  );
}

export async function listLessonsForUser(user, filters = {}) {
  const query = { isActive: true, isPublished: true };
  if (filters.language) query.language = filters.language;
  if (filters.level) query.level = filters.level;
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;

  const lessons = await Lesson.find(query).sort({ language: 1, level: 1, order: 1, category: 1 });
  const prerequisiteIds = lessons
    .map((lesson) => lesson.prerequisiteLesson?.toString())
    .filter(Boolean);
  const progress = await getLessonProgress(
    user.id,
    [...new Set([...lessons.map((lesson) => lesson.id), ...prerequisiteIds])],
  );
  const prerequisiteLessons = prerequisiteIds.length
    ? await Lesson.find({ _id: { $in: prerequisiteIds } }).select("title language level order").lean()
    : [];
  const prerequisitesById = new Map(
    prerequisiteLessons.map((lesson) => [lesson._id.toString(), lesson]),
  );

  return lessons.map((lesson) => {
    const prerequisiteId = lesson.prerequisiteLesson?.toString();
    const isLocked = isLessonLocked(prerequisiteId, progress);
    const prerequisite = prerequisitesById.get(prerequisiteId);

    return {
      ...lessonToJSON(lesson),
      progress: progressPayload(progress.get(lesson.id)),
      isLocked,
      unlockRequirement: isLocked
        ? {
            lessonId: prerequisiteId,
            title: prerequisite?.title || "the previous lesson",
            language: prerequisite?.language,
            level: prerequisite?.level,
            order: prerequisite?.order,
          }
        : null,
    };
  });
}

export async function getLessonForUser(user, lessonId) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, "INVALID_IDENTIFIER", "The lesson identifier is invalid.");
  const lesson = await Lesson.findOne({ _id: lessonId, isActive: true, isPublished: true });
  if (!lesson) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  await assertLessonUnlocked(user.id, lesson);

  const nextLesson = await Lesson.findOne({ prerequisiteLesson: lesson.id, isActive: true, isPublished: true }).sort({ level: 1, order: 1 });
  return {
    lesson: lessonToJSON(lesson),
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, level: nextLesson.level } : null,
  };
}
