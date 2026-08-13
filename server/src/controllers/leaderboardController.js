import { Result } from "../models/Result.js";
import { Class } from "../models/Class.js";
import ApiError from "../utils/ApiError.js";
import { getSchoolSettings } from "../services/settingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function periodStart(period) {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") return new Date(now.getTime() - 7 * 86400000);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export const list = asyncHandler(async (request, response) => {
  const { category, period, limit } = request.validated.query;
  const match = {};
  const settings = await getSchoolSettings();
  const start = periodStart(period);
  if (start) match.completedAt = { $gte: start };
  if (request.auth.role === "student") {
    if (settings.leaderboardVisibility === "hidden") throw new ApiError(403, "LEADERBOARD_HIDDEN", "The leaderboard is hidden by your teacher.");
    if (request.validated.query.class && request.validated.query.class !== request.auth.user.class?.toString()) {
      throw new ApiError(403, "CLASS_FORBIDDEN", "Students can only view their own class leaderboard.");
    }
    if (settings.leaderboardVisibility === "class" && request.auth.user.class) match.class = request.auth.user.class;
    else if (request.validated.query.class) match.class = request.validated.query.class;
  } else if (request.auth.role === "teacher") {
    const classIds = await Class.find({ teacher: request.auth.userId }).distinct("_id");
    if (request.validated.query.class) {
      if (!classIds.some((classId) => classId.toString() === request.validated.query.class)) throw new ApiError(403, "CLASS_FORBIDDEN", "You can only view your class leaderboards.");
      match.class = request.validated.query.class;
    }
  } else if (request.validated.query.class) {
    match.class = request.validated.query.class;
  }
  if (category === "english-wpm") match.language = "en";
  if (category === "khmer-cpm") match.language = "km";
  const field = { "english-wpm": "$wpm", "khmer-cpm": "$cpm", accuracy: "$accuracy" }[category];
  const valueAccumulator = category === "score" ? { $sum: "$score" } : category === "stars" ? { $sum: "$stars" } : { $max: field };
  const entries = await Result.aggregate([
    { $match: match },
    { $group: { _id: "$student", value: valueAccumulator, totalScore: { $sum: "$score" }, stars: { $sum: "$stars" }, attempts: { $sum: 1 } } },
    { $sort: { value: -1, totalScore: -1 } },
    { $limit: limit },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    { $project: { _id: 0, student: { id: { $toString: "$student._id" }, firstName: "$student.firstName", lastName: "$student.lastName", khmerName: "$student.khmerName", studentId: "$student.studentId" }, value: 1, totalScore: 1, stars: 1, attempts: 1 } },
  ]);
  response.status(200).json({ data: { entries, category, period } });
});
