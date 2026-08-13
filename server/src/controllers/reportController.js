import { Class } from "../models/Class.js";
import { Lesson } from "../models/Lesson.js";
import { Result } from "../models/Result.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

function dateFilter(query) {
  if (!query.from && !query.to) return undefined;
  return { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) };
}

export const summary = asyncHandler(async (request, response) => {
  const input = request.validated.query;
  const query = {};
  let classScope = null;
  if (request.auth.role === "teacher") {
    classScope = await Class.find({ teacher: request.auth.userId }).distinct("_id");
    query.class = { $in: classScope };
  }
  if (input.student) query.student = input.student;
  if (input.class) {
    if (classScope && !classScope.some((classId) => classId.toString() === input.class)) {
      throw new ApiError(403, "CLASS_FORBIDDEN", "You can only report on your classes.");
    }
    query.class = input.class;
  }
  if (input.language) query.language = input.language;
  const completedAt = dateFilter(input);
  if (completedAt) query.completedAt = completedAt;
  if (input.level) {
    const lessonIds = await Lesson.find({ level: input.level }).distinct("_id");
    query.lesson = { $in: lessonIds };
  }
  const studentQuery = { role: "student", status: "active", ...(classScope ? { class: { $in: classScope } } : {}) };
  const classQuery = { status: "active", ...(request.auth.role === "teacher" ? { teacher: request.auth.userId } : {}) };
  const [results, studentCount, classCount, lessonCount] = await Promise.all([
    Result.find(query).populate("student", "firstName lastName studentId").populate("lesson", "title level type").sort({ completedAt: -1 }).lean(),
    User.countDocuments(studentQuery),
    Class.countDocuments(classQuery),
    Lesson.countDocuments({ isActive: true, isPublished: true }),
  ]);
  const total = results.length;
  const sum = (field) => results.reduce((value, item) => value + (item[field] || 0), 0);
  response.status(200).json({ data: { summary: { students: studentCount, classes: classCount, lessons: lessonCount, results: total, averageAccuracy: total ? sum("accuracy") / total : 0, averageWpm: total ? sum("wpm") / total : 0, averageCpm: total ? sum("cpm") / total : 0, totalStars: sum("stars"), totalPracticeSeconds: sum("duration") }, results: results.slice(0, 500).map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) } });
});
