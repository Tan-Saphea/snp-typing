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
  const rejectedRegistration = await api.request({
    method: "POST",
    path: "/auth/register",
    data: {
      name: "Offline Learner",
      username: "offline.learner",
      password: "Offline123",
      securityQuestion: "Recovery Key",
      securityAnswer: "WrongKey",
      gender: "unspecified",
    },
  });
  assert.equal(rejectedRegistration.status, 400);

  const registration = await api.request({
    method: "POST",
    path: "/auth/register",
    data: {
      name: "Offline Learner",
      username: "offline.learner",
      password: "Offline123",
      securityQuestion: "Recovery Key",
      securityAnswer: "Admin.snpis@2013",
      gender: "unspecified",
    },
  });
  assert.equal(registration.status, 201);
  const {
    accessToken: initialAccessToken,
    refreshToken: initialRefreshToken,
    user,
  } = registration.body.data;
  assert.equal(user.username, "offline.learner");
  assert.equal(user.securityAnswer, undefined);

  const matches = await api.request({
    method: "POST",
    path: "/auth/find-username",
    data: { query: "Offline Learner" },
  });
  assert.equal(matches.body.data[0].username, "offline.learner");

  const verification = await api.request({
    method: "POST",
    path: "/auth/verify-account",
    data: { username: "offline.learner" },
  });
  assert.equal(verification.body.data.hasSecurityQuestion, true);

  const rejectedReset = await api.request({
    method: "POST",
    path: "/auth/reset-password",
    data: { username: "offline.learner", newPassword: "Recovered123", securityAnswer: "Wrong" },
  });
  assert.equal(rejectedReset.status, 400);
  assert.equal(rejectedReset.body.error.code, "SECURITY_ANSWER_INCORRECT");

  const reset = await api.request({
    method: "POST",
    path: "/auth/reset-password",
    data: { username: "offline.learner", newPassword: "Recovered123", securityAnswer: "Admin.snpis@2013" },
  });
  assert.equal(reset.status, 200);

  const revokedAccess = await api.request({ method: "GET", path: "/lessons", accessToken: initialAccessToken });
  assert.equal(revokedAccess.status, 401);
  const revokedRefresh = await api.request({ method: "POST", path: "/auth/refresh", data: { refreshToken: initialRefreshToken } });
  assert.equal(revokedRefresh.status, 401);
  const oldPassword = await api.request({ method: "POST", path: "/auth/login", data: { username: "offline.learner", password: "Offline123" } });
  assert.equal(oldPassword.status, 401);
  const recoveredLogin = await api.request({ method: "POST", path: "/auth/login", data: { username: "offline.learner", password: "Recovered123" } });
  assert.equal(recoveredLogin.status, 200);
  const { accessToken, refreshToken } = recoveredLogin.body.data;

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
  assert.equal(persisted.includes("Recovered123"), false);
  assert.equal(persisted.includes("Admin.snpis@2013"), false);
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
    data: {
      firstName: "Curriculum",
      username: "curriculum.test",
      password: "Offline123",
      securityQuestion: "Recovery Key",
      securityAnswer: "Admin.snpis@2013",
    },
  });
  const accessToken = registration.body.data.accessToken;
  const lessonList = await api.request({ method: "GET", path: "/lessons", accessToken });
  const lessons = lessonList.body.data.lessons;
  const englishLessons = lessons.filter((item) => item.language === "en");
  const khmerLessons = lessons.filter((item) => item.language === "km");
  const computerSkills = lessons.filter((item) => item.type === "computer-skill");

  assert.equal(lessonList.status, 200);
  assert.equal(lessons.length, 232);
  assert.equal(englishLessons.length, 129);
  assert.equal(khmerLessons.length, 103);
  assert.equal(computerSkills.length, 20);
  assert.match(lessons[0].id, /^[a-f0-9]{24}$/);
  assert.equal(englishLessons.find((item) => item.slug === "en-basics-01-asdf").isLocked, false);
  assert.equal(khmerLessons.find((item) => item.slug === "km-consonants-01").isLocked, false);
  assert.equal(englishLessons.find((item) => item.slug === "en-basics-02-jkl").isLocked, true);

  const savedComputerSkill = await api.request({
    method: "POST",
    path: "/results",
    accessToken,
    data: resultPayload(computerSkills[0].id),
  });
  assert.equal(savedComputerSkill.status, 201);
  const progress = await api.request({ method: "GET", path: "/progress/me", accessToken });
  assert.equal(progress.body.data.computerSkills.completedLessons, 1);
  assert.equal(progress.body.data.computerSkills.totalLessons, 20);
  assert.equal(progress.body.data.stats.lessonsCompleted, 1);
});

test("offline API seamlessly migrates student accounts, stars, and history from previous version fallback paths", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snp-migration-test-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const lessonsPath = path.join(directory, "lessons.json");
  const legacyDataPath = path.join(directory, "legacy-offline-data.json");
  const newPrimaryPath = path.join(directory, "new-primary-offline-data.json");

  await fs.writeFile(
    lessonsPath,
    JSON.stringify({
      schemaVersion: 1,
      lessons: [
        lesson(),
        lesson({ id: secondLessonId, title: "Second Lesson", slug: "second-lesson", order: 2, prerequisiteLesson: firstLessonId }),
      ],
    }),
  );

  // Simulate an older installation where a student registered and completed lesson 1
  const oldApi = createOfflineApi({ dataPath: legacyDataPath, lessonsPath });
  const reg = await oldApi.request({
    method: "POST",
    path: "/auth/register",
    data: {
      name: "Existing Student",
      username: "student.v1",
      password: "Password123",
      securityQuestion: "Recovery Key",
      securityAnswer: "Admin.snpis@2013",
      gender: "female",
    },
  });
  assert.equal(reg.status, 201);
  const oldToken = reg.body.data.accessToken;

  // Student completes lesson 1 with 3 stars
  const resultRes = await oldApi.request({
    method: "POST",
    path: "/results",
    accessToken: oldToken,
    data: resultPayload(firstLessonId),
  });
  assert.equal(resultRes.status, 201);
  assert.equal(resultRes.body.data.result.stars, 3);

  // Now simulate running the newly upgraded version where newPrimaryPath does not exist yet
  const upgradedApi = createOfflineApi({
    dataPath: newPrimaryPath,
    fallbackPaths: [legacyDataPath],
    lessonsPath,
  });

  // Student logs in on the new version with their old credentials
  const loginRes = await upgradedApi.request({
    method: "POST",
    path: "/auth/login",
    data: {
      username: "student.v1",
      password: "Password123",
    },
  });
  assert.equal(loginRes.status, 200);
  const newToken = loginRes.body.data.accessToken;

  // Verify their progress, stars, and unlocked lesson are 100% intact
  const lessonsList = await upgradedApi.request({ method: "GET", path: "/lessons", accessToken: newToken });
  assert.equal(lessonsList.status, 200);
  const secondLesson = lessonsList.body.data.lessons.find((l) => l.id === secondLessonId);
  assert.equal(secondLesson.isLocked, false);

  const meProgress = await upgradedApi.request({ method: "GET", path: "/progress/me", accessToken: newToken });
  assert.equal(meProgress.status, 200);
  assert.equal(meProgress.body.data.stats.lessonsCompleted, 1);
  assert.equal(meProgress.body.data.stats.stars, 3);

  // Verify that backup file was also created
  const bakExists = await fs.stat(`${newPrimaryPath}.bak`).then(() => true).catch(() => false);
  assert.equal(bakExists, true);
});

