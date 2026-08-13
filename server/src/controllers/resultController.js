import { Lesson } from "../models/Lesson.js";
import { Class } from "../models/Class.js";
import { Result } from "../models/Result.js";
import { getUserProgress } from "../services/progressService.js";
import { calculateTypingMetrics } from "../services/resultScoring.js";
import { isFreePracticeEnabled } from "../services/lessonService.js";
import { getSchoolSettings } from "../services/settingsService.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const create = asyncHandler(async (request, response) => {
  const input = request.validated.body;
  const lesson = await Lesson.findOne({ _id: input.lessonId, isActive: true, isPublished: true });

  if (!lesson) {
    throw new ApiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
  }

  const freePractice = await isFreePracticeEnabled(request.auth.user);
  if (!freePractice && lesson.isLocked) {
    throw new ApiError(403, "LESSON_LOCKED", "This lesson is currently locked.");
  }
  if (!freePractice && lesson.prerequisiteLesson) {
    const prerequisitePassed = await Result.exists({
      student: request.auth.userId,
      lesson: lesson.prerequisiteLesson,
      passed: true,
    });

    if (!prerequisitePassed) {
      throw new ApiError(
        403,
        "LESSON_LOCKED",
        "Complete the previous lesson before saving this result.",
      );
    }
  }

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
  const schoolSettings = await getSchoolSettings();
  if (request.auth.role === "student" && lesson.type === "game" && !schoolSettings.allowTypingGames) {
    throw new ApiError(403, "GAMES_DISABLED", "Typing games are currently disabled by your teacher.");
  }
  const passed =
    metrics.accuracy >= Math.max(lesson.minimumAccuracy, schoolSettings.minimumPassingAccuracy) &&
    speed >= lesson.minimumSpeed;
  const result = await Result.create({
    student: request.auth.userId,
    class: request.auth.user.class,
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
  const query = {};
  if (request.auth.role === "student") {
    query.student = request.auth.userId;
  } else if (request.auth.role === "teacher") {
    const classIds = await Class.find({ teacher: request.auth.userId }).distinct("_id");
    query.class = { $in: classIds };
    if (request.validated.query.student) query.student = request.validated.query.student;
    if (request.validated.query.class) {
      const allowed = classIds.some((classId) => classId.toString() === request.validated.query.class);
      if (!allowed) throw new ApiError(403, "CLASS_FORBIDDEN", "You can only view results from your classes.");
      query.class = request.validated.query.class;
    }
  } else {
    if (request.validated.query.student) query.student = request.validated.query.student;
    if (request.validated.query.class) query.class = request.validated.query.class;
  }
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
    .populate("student", "firstName lastName khmerName studentId username class")
    .populate("lesson", "title language level type category")
    .lean();
  response.status(200).json({ data: { results: results.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) } });
});
