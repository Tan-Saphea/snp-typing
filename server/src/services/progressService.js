import { Lesson } from "../models/Lesson.js";
import { Result } from "../models/Result.js";
import { lessonToJSON } from "./lessonService.js";

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function bestResultByLesson(results) {
  const best = new Map();

  for (const result of results) {
    const lessonId = result.lesson.toString();
    const current = best.get(lessonId);

    if (
      !current ||
      result.stars > current.stars ||
      (result.stars === current.stars && result.score > current.score)
    ) {
      best.set(lessonId, result);
    }
  }

  return best;
}

export async function getUserProgress(userId) {
  const [lessons, results, recentResults] = await Promise.all([
    Lesson.find({
      isActive: true,
      isPublished: true,
      category: { $ne: "practice-templates" },
      type: { $nin: ["test", "game", "computer-skill"] },
    }).sort({ language: 1, level: 1, order: 1 }),
    Result.find({ student: userId }).sort({ completedAt: -1 }).lean(),
    Result.find({ student: userId })
      .sort({ completedAt: -1 })
      .limit(6)
      .populate("lesson", "title language level")
      .lean(),
  ]);
  const bestByLesson = bestResultByLesson(results);
  const passedLessons = new Set(
    results.filter((result) => result.passed).map((result) => result.lesson.toString()),
  );
  const now = new Date();
  const weekly = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = startOfUtcDay(new Date(now.getTime() - offset * 86400000));
    const nextDate = new Date(date.getTime() + 86400000);
    const dayResults = results.filter(
      (result) => result.completedAt >= date && result.completedAt < nextDate,
    );

    weekly.push({
      date: date.toISOString(),
      label: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }),
      minutes: Number(
        (dayResults.reduce((sum, result) => sum + result.duration, 0) / 60).toFixed(1),
      ),
    });
  }

  function languageSummary(language) {
    const languageLessons = lessons.filter((lesson) => lesson.language === language);
    const completed = languageLessons.filter((lesson) => passedLessons.has(lesson.id)).length;
    const next = languageLessons.find((lesson) => {
      if (passedLessons.has(lesson.id)) return false;
      const prerequisite = lesson.prerequisiteLesson?.toString();
      return !prerequisite || passedLessons.has(prerequisite);
    });

    return {
      completedLessons: completed,
      totalLessons: languageLessons.length,
      percent:
        languageLessons.length === 0
          ? 0
          : Math.round((completed / languageLessons.length) * 100),
      continueLesson: next ? lessonToJSON(next) : null,
    };
  }

  const accuracyValues = results.map((result) => result.accuracy);
  const englishWpm = results
    .filter((result) => result.language === "en")
    .map((result) => result.wpm);
  const khmerCpm = results
    .filter((result) => result.language === "km")
    .map((result) => result.cpm);
  const resultDays = new Set(results.map((result) => startOfUtcDay(result.completedAt).toISOString()));
  let dailyStreak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = startOfUtcDay(new Date(now.getTime() - offset * 86400000)).toISOString();
    if (!resultDays.has(day)) {
      if (offset === 0) continue;
      break;
    }
    dailyStreak += 1;
  }

  function currentLevel(language) {
    const languageLessons = lessons.filter((lesson) => lesson.language === language);
    const next = languageLessons.find((lesson) => !passedLessons.has(lesson.id));
    return next?.level ?? languageLessons.at(-1)?.level ?? 1;
  }

  return {
    stats: {
      totalPracticeSeconds: results.reduce((sum, result) => sum + result.duration, 0),
      bestWpm: englishWpm.length ? Math.max(...englishWpm) : 0,
      averageWpm: englishWpm.length
        ? englishWpm.reduce((sum, value) => sum + value, 0) / englishWpm.length
        : 0,
      bestCpm: khmerCpm.length ? Math.max(...khmerCpm) : 0,
      averageAccuracy: accuracyValues.length
        ? accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length
        : 0,
      bestAccuracy: accuracyValues.length ? Math.max(...accuracyValues) : 0,
      stars: [...bestByLesson.values()].reduce((sum, result) => sum + result.stars, 0),
      lessonsCompleted: lessons.filter((lesson) => passedLessons.has(lesson.id)).length,
      testsCompleted: results.filter((result) => result.mode === "test").length,
      dailyStreak,
      currentEnglishLevel: currentLevel("en"),
      currentKhmerLevel: currentLevel("km"),
    },
    languages: {
      en: languageSummary("en"),
      km: languageSummary("km"),
    },
    recent: recentResults.map((result) => ({
      id: result._id.toString(),
      lesson: result.lesson
        ? {
            id: result.lesson._id.toString(),
            title: result.lesson.title,
            language: result.lesson.language,
            level: result.lesson.level,
          }
        : null,
      accuracy: result.accuracy,
      cpm: result.cpm,
      completedAt: result.completedAt,
      score: result.score,
      stars: result.stars,
      wpm: result.wpm,
    })),
    weekly,
  };
}
