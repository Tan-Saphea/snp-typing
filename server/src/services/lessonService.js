import {
  countLessonTargetGraphemes,
  LESSON_TARGET_MAX_GRAPHEMES,
  LESSON_TARGET_MIN_GRAPHEMES,
} from "@snp/shared";
import mongoose from "mongoose";

import { Class } from "../models/Class.js";
import { Lesson } from "../models/Lesson.js";
import { Result } from "../models/Result.js";
import { getSchoolSettings } from "./settingsService.js";
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

export async function isFreePracticeEnabled(user) {
  const settings = await getSchoolSettings();
  if (!settings.lessonUnlocking) return true;
  if (!user?.class) return false;
  const schoolClass = await Class.findById(user.class).select("freePracticeMode").lean();
  return Boolean(schoolClass?.freePracticeMode);
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

export async function listLessonsForUser(user, filters = {}) {
  const query = { isActive: true, isPublished: true };
  const settings = await getSchoolSettings();
  if (user.role === "student" && !settings.allowTypingGames) query.type = { $ne: "game" };
  if (filters.language) query.language = filters.language;
  if (filters.level) query.level = filters.level;
  if (filters.category) query.category = filters.category;
  if (filters.type) {
    if (user.role === "student" && filters.type === "game" && !settings.allowTypingGames) return [];
    query.type = filters.type;
  }

  const lessons = await Lesson.find(query).sort({ language: 1, level: 1, order: 1, category: 1 });
  const progress = await getLessonProgress(user.id, lessons.map((lesson) => lesson.id));
  const passedLessons = new Set([...progress.entries()].filter(([, value]) => value.passed).map(([id]) => id));
  const freePractice = await isFreePracticeEnabled(user);

  return lessons.map((lesson) => {
    const value = lessonToJSON(lesson);
    const locked = value.isLocked || (value.prerequisiteLesson && !passedLessons.has(value.prerequisiteLesson));
    return {
      ...value,
      isLocked: freePractice ? false : Boolean(locked),
      freePractice,
      progress: progressPayload(progress.get(lesson.id)),
    };
  });
}

export async function getLessonForUser(user, lessonId) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, "INVALID_IDENTIFIER", "The lesson identifier is invalid.");
  const lesson = await Lesson.findOne({ _id: lessonId, isActive: true, isPublished: true });
  if (!lesson) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");

  const settings = await getSchoolSettings();
  if (user.role === "student" && lesson.type === "game" && !settings.allowTypingGames) {
    throw new ApiError(403, "GAMES_DISABLED", "Typing games are currently disabled by your teacher.");
  }

  const freePractice = await isFreePracticeEnabled(user);
  const progress = await getLessonProgress(user.id, [lesson.id, ...(lesson.prerequisiteLesson ? [lesson.prerequisiteLesson] : [])]);
  const prerequisiteId = lesson.prerequisiteLesson?.toString();
  if (!freePractice && (lesson.isLocked || (prerequisiteId && !progress.get(prerequisiteId)?.passed))) {
    throw new ApiError(403, "LESSON_LOCKED", "Complete the previous lesson to unlock this lesson.");
  }

  const nextLesson = await Lesson.findOne({ prerequisiteLesson: lesson.id, isActive: true, isPublished: true }).sort({ level: 1, order: 1 });
  return {
    lesson: lessonToJSON(lesson),
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, level: nextLesson.level } : null,
    freePractice,
  };
}

function sourceFields(input, existing = {}) {
  const existingSource = existing.source ?? {};
  const sourceBook = input.sourceBook ?? existing.sourceBook ?? existingSource.sourceBook ?? "";
  const sourcePage = input.sourcePage ?? existing.sourcePage ?? existingSource.sourcePage;
  const sourceExercise = input.sourceExercise ?? existing.sourceExercise ?? existingSource.sourceExercise ?? "";
  const contentStatus = input.contentStatus ?? existing.contentStatus ?? "custom";
  return {
    sourceBook,
    sourcePage,
    sourceExercise,
    source: {
      ...existingSource,
      sourceBook,
      sourcePage,
      sourceExercise,
      reviewStatus: contentStatus === "needs_review" ? "needs-review" : contentStatus === "verified" ? "verified" : "adapted",
      reviewNotes: input.reviewNotes ?? existingSource.reviewNotes ?? "",
    },
  };
}

function assertPublishableTargetLength(lesson) {
  if (!lesson.isPublished || lesson.isActive === false || lesson.type === "game" || lesson.contentStatus === "needs_review") return;

  const count = countLessonTargetGraphemes(lesson);
  if (count < LESSON_TARGET_MIN_GRAPHEMES || count > LESSON_TARGET_MAX_GRAPHEMES) {
    throw new ApiError(
      422,
      "LESSON_TARGET_LENGTH_INVALID",
      `Published lesson content must contain ${LESSON_TARGET_MIN_GRAPHEMES}-${LESSON_TARGET_MAX_GRAPHEMES} grapheme characters. Current count: ${count}.`,
    );
  }
}

export async function listManagedLessons(filters = {}) {
  const query = {};
  if (filters.language) query.language = filters.language;
  if (filters.level) query.level = filters.level;
  if (filters.type) query.type = filters.type;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.published !== undefined) query.isPublished = filters.published;
  if (filters.contentStatus) query.contentStatus = filters.contentStatus;
  if (!filters.includeInactive) query.isActive = true;

  const [lessons, totals] = await Promise.all([
    Lesson.find(query).sort({ language: 1, level: 1, order: 1, category: 1 }).populate("createdBy updatedBy", "firstName lastName role"),
    Promise.all([
      Lesson.countDocuments({ isActive: true }),
      Lesson.countDocuments({ language: "en", isActive: true }),
      Lesson.countDocuments({ language: "km", isActive: true }),
      Lesson.countDocuments({ contentStatus: "needs_review", isActive: true }),
    ]),
  ]);

  return {
    lessons: lessons.map(lessonToJSON),
    stats: { total: totals[0], english: totals[1], khmer: totals[2], needsReview: totals[3] },
  };
}

export async function getManagedLesson(lessonId) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, "INVALID_IDENTIFIER", "The lesson identifier is invalid.");
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  return lessonToJSON(lesson);
}

export async function createLesson(input, actorId) {
  const candidate = {
    ...input,
    content: { keyboardLayout: input.language, blocks: input.contentBlocks },
  };
  assertPublishableTargetLength(candidate);
  const lesson = await Lesson.create({
    ...candidate,
    contentItems: input.contentItems,
    ...sourceFields(input),
    createdBy: actorId,
    updatedBy: actorId,
  });
  return lessonToJSON(lesson);
}

export async function updateLesson(lessonId, input, actorId) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, "INVALID_IDENTIFIER", "The lesson identifier is invalid.");
  const existing = await Lesson.findById(lessonId);
  if (!existing) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  const existingValue = existing.toObject();
  const candidate = {
    ...existingValue,
    ...input,
    content: {
      ...existingValue.content,
      keyboardLayout: input.language ?? existing.language,
      blocks: input.contentBlocks ?? existingValue.content.blocks,
    },
  };
  assertPublishableTargetLength(candidate);
  const update = { ...input, updatedBy: actorId };
  if (input.contentBlocks) {
    update.content = {
      ...existing.content.toObject(),
      keyboardLayout: input.language ?? existing.language,
      blocks: input.contentBlocks,
    };
  }
  if (input.sourceBook !== undefined || input.sourcePage !== undefined || input.sourceExercise !== undefined || input.contentStatus !== undefined || input.reviewNotes !== undefined) {
    Object.assign(update, sourceFields(input, existing.toObject()));
  }
  delete update.contentBlocks;
  const lesson = await Lesson.findByIdAndUpdate(lessonId, { $set: update }, { new: true, runValidators: true });
  return lessonToJSON(lesson);
}

export async function archiveLesson(lessonId, actorId) {
  const lesson = await Lesson.findByIdAndUpdate(lessonId, { $set: { isActive: false, isPublished: false, updatedBy: actorId } }, { new: true });
  if (!lesson) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  return lessonToJSON(lesson);
}

export async function duplicateLesson(lessonId, actorId) {
  const source = await Lesson.findById(lessonId).lean();
  if (!source) throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  const lastLesson = await Lesson.findOne({ language: source.language, category: source.category, level: source.level }).sort({ order: -1 }).select("order").lean();
  delete source._id;
  delete source.__v;
  delete source.createdAt;
  delete source.updatedAt;
  const suffix = Date.now().toString(36);
  const copy = await Lesson.create({ ...source, title: `${source.title} Copy`, slug: `${source.slug}-copy-${suffix}`, order: (lastLesson?.order ?? source.order) + 1, isPublished: false, prerequisiteLesson: null, createdBy: actorId, updatedBy: actorId });
  return lessonToJSON(copy);
}

export async function reorderLessons(items, actorId) {
  const ids = items.map((item) => item.id);
  const lessons = await Lesson.find({ _id: { $in: ids } }).lean();
  if (lessons.length !== items.length) throw new ApiError(404, "LESSON_NOT_FOUND", "One or more lessons were not found.");

  const byId = new Map(lessons.map((lesson) => [lesson._id.toString(), lesson]));
  const targetKeys = items.map((item) => {
    const lesson = byId.get(item.id);
    return {
      language: lesson.language,
      category: item.category ?? lesson.category,
      level: item.level ?? lesson.level,
      order: item.order,
    };
  });
  const duplicateKeys = new Set();
  for (const target of targetKeys) {
    const key = `${target.language}:${target.category}:${target.level}:${target.order}`;
    if (duplicateKeys.has(key)) throw new ApiError(409, "LESSON_ORDER_CONFLICT", "Two lessons cannot use the same order in one category and level.");
    duplicateKeys.add(key);
  }
  const conflicts = await Promise.all(targetKeys.map((target) => Lesson.exists({ ...target, _id: { $nin: ids } })));
  if (conflicts.some(Boolean)) throw new ApiError(409, "LESSON_ORDER_CONFLICT", "The selected order is already used by another lesson.");

  const highestOrder = await Lesson.findOne().sort({ order: -1 }).select("order").lean();
  const temporaryBase = (highestOrder?.order ?? 0) + 1000;
  await Lesson.bulkWrite(items.map(({ id }, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: temporaryBase + index, updatedBy: actorId } },
    },
  })), { ordered: true });

  await Lesson.bulkWrite(items.map(({ id, order, level, category }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order, ...(level ? { level } : {}), ...(category ? { category } : {}), updatedBy: actorId } },
    },
  })), { ordered: true });
  return Lesson.find({ _id: { $in: ids } }).sort({ level: 1, order: 1 });
}
