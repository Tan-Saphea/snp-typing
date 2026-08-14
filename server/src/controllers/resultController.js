import { Lesson } from "../models/Lesson.js";
import { Result } from "../models/Result.js";
import { assertLessonUnlocked } from "../services/lessonService.js";
import { getUserProgress } from "../services/progressService.js";
import { calculateTypingMetrics } from "../services/resultScoring.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const create = asyncHandler(async (request, response) => {
  const input = request.validated.body;
  const lesson = await Lesson.findOne({ _id: input.lessonId, isActive: true, isPublished: true });

  if (!lesson) {
    throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  }

  await assertLessonUnlocked(request.auth.userId, lesson);

  const isKhmer = lesson.language === "km";
  const correctUnits = isKhmer
    ? input.correctGraphemes
    : input.correctCharacters;
  const incorrectUnits = isKhmer
    ? input.incorrectGraphemes
    : input.incorrectCharacters;
  const metrics = calculateTypingMetrics({
    language: lesson.language,
    duration: input.duration,
    correctUnits,
    incorrectUnits,
    errors: input.errors,
  });
  const speed = isKhmer ? metrics.cpm : metrics.wpm;
  const passed =
    metrics.accuracy >= lesson.minimumAccuracy &&
    speed >= lesson.minimumSpeed;
  const result = await Result.create({
    student: request.auth.userId,
    lesson: lesson.id,
    language: lesson.language,
    mode: input.mode,
    startedAt: new Date(input.startedAt),
    completedAt: new Date(),
    duration: input.duration,
    totalTyped: input.totalTyped,
    totalCharacters: input.totalCharacters,
    correctCharacters: input.correctCharacters,
    incorrectCharacters: input.incorrectCharacters,
    totalGraphemes: input.totalGraphemes,
    correctGraphemes: input.correctGraphemes,
    incorrectGraphemes: input.incorrectGraphemes,
    errors: input.errors,
    passed,
    ...metrics,
  });
  const progress = await getUserProgress(request.auth.userId);

  response.status(201).json({
    data: {
      result: result.toJSON(),
      progress,
    },
  });
});

export const list = asyncHandler(async (request, response) => {
  const query = { student: request.auth.userId };
  if (request.validated.query.language) query.language = request.validated.query.language;
  if (request.validated.query.mode) query.mode = request.validated.query.mode;
  if (request.validated.query.from || request.validated.query.to) {
    query.completedAt = {};
    if (request.validated.query.from) query.completedAt.$gte = new Date(request.validated.query.from);
    if (request.validated.query.to) query.completedAt.$lte = new Date(request.validated.query.to);
  }
  const results = await Result.find(query)
    .sort({ completedAt: -1 })
    .limit(request.validated.query.limit)
    .populate("student", "firstName lastName khmerName studentId username")
    .populate("lesson", "title language level type category")
    .lean();
  response.status(200).json({ data: { results: results.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) } });
});
