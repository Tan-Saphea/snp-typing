const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createOfflineApi } = require("../services/offline-api.cjs");

const firstLessonId = "111111111111111111111111";
const secondLessonId = "222222222222222222222222";

function lesson(overrides) {
  return {
    id: firstLessonId,
    title: "First Lesson",
    titleKhmer: "",
    description: "Practice the first keys.",
    slug: "first-lesson",
    language: "en",
    category: "keyboard-basics",
    level: 1,
    order: 1,
    difficulty: "easy",
    type: "word",
    instructions: "Type the words.",
    contentItems: ["hello world"],
    content: { keyboardLayout: "en", blocks: [{ kind: "items", items: ["hello world"] }] },
    minimumAccuracy: 70,
    minimumSpeed: 0,
    timeLimit: 0,
    starsEnabled: true,
    allowBackspace: true,
    prerequisiteLesson: null,
    isPublished: true,
    isActive: true,
    tags: [],
    ...overrides,
  };
}

function resultPayload(lessonId) {
  return {
    lessonId,
    startedAt: new Date(Date.now() - 60000).toISOString(),
    duration: 60,
    totalTyped: 100,
    totalCharacters: 100,
    correctCharacters: 100,
    incorrectCharacters: 0,
    totalGraphemes: 100,
    correctGraphemes: 100,
    incorrectGraphemes: 0,
    errors: 0,
    mode: "lesson",
  };
}

test("offline API persists accounts, sessions, results, settings, and lesson locks", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snp-offline-test-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const lessonsPath = path.join(directory, "lessons.json");
  const dataPath = path.join(directory, "offline-data.json");
  await fs.writeFile(lessonsPath, JSON.stringify({
    schemaVersion: 1,
    lessons: [
      lesson(),
      lesson({ id: secondLessonId, title: "Second Lesson", slug: "second-lesson", order: 2, prerequisiteLesson: firstLessonId }),
    ],
  }));

  const api = createOfflineApi({ dataPath, lessonsPath });
  const registration = await api.request({
    method: "POST",
    path: "/auth/register",
    data: { firstName: "Offline", username: "offline.learner", password: "Offline123", gender: "unspecified" },
  });
  assert.equal(registration.status, 201);
  const { accessToken, refreshToken, user } = registration.body.data;
  assert.equal(user.username, "offline.learner");

  const lessonList = await api.request({ method: "GET", path: "/lessons", accessToken });
  assert.equal(lessonList.body.data.lessons[0].isLocked, false);
  assert.equal(lessonList.body.data.lessons[1].isLocked, true);

  const blocked = await api.request({ method: "GET", path: `/lessons/${secondLessonId}`, accessToken });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error.code, "LESSON_LOCKED");

  const saved = await api.request({ method: "POST", path: "/results", accessToken, data: resultPayload(firstLessonId) });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.result.passed, true);

  const unlocked = await api.request({ method: "GET", path: `/lessons/${secondLessonId}`, accessToken });
  assert.equal(unlocked.status, 200);

  const settings = await api.request({ method: "PATCH", path: "/settings/me", accessToken, data: { theme: "dark", soundEnabled: false } });
  assert.equal(settings.body.data.user.preferences.theme, "dark");

  const restartedApi = createOfflineApi({ dataPath, lessonsPath });
  const restored = await restartedApi.request({ method: "POST", path: "/auth/refresh", data: { refreshToken } });
  assert.equal(restored.status, 200);
  const restoredAccessToken = restored.body.data.accessToken;
  const progress = await restartedApi.request({ method: "GET", path: "/progress/me", accessToken: restoredAccessToken });
  assert.equal(progress.body.data.stats.lessonsCompleted, 1);
  assert.equal(progress.body.data.languages.en.completedLessons, 1);

  const persisted = await fs.readFile(dataPath, "utf8");
  assert.equal(persisted.includes("Offline123"), false);
  assert.equal(persisted.includes(refreshToken), false);
});

test("generated curriculum is available offline with independent English and Khmer tracks", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snp-offline-curriculum-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const lessonsPath = path.resolve(__dirname, "../resources/lessons.json");
  const dataPath = path.join(directory, "offline-data.json");
  const api = createOfflineApi({ dataPath, lessonsPath });
  const registration = await api.request({
    method: "POST",
    path: "/auth/register",
    data: { firstName: "Curriculum", username: "curriculum.test", password: "Offline123" },
  });
  const accessToken = registration.body.data.accessToken;
  const lessonList = await api.request({ method: "GET", path: "/lessons", accessToken });
  const lessons = lessonList.body.data.lessons;
  const englishLessons = lessons.filter((item) => item.language === "en");
  const khmerLessons = lessons.filter((item) => item.language === "km");

  assert.equal(lessonList.status, 200);
  assert.ok(lessons.length >= 180);
  assert.ok(englishLessons.length >= 100);
  assert.ok(khmerLessons.length >= 60);
  assert.match(lessons[0].id, /^[a-f0-9]{24}$/);
  assert.equal(englishLessons.find((item) => item.slug === "en-basics-01-asdf").isLocked, false);
  assert.equal(khmerLessons.find((item) => item.slug === "km-consonants-01").isLocked, false);
  assert.equal(englishLessons.find((item) => item.slug === "en-basics-02-jkl").isLocked, true);
});
