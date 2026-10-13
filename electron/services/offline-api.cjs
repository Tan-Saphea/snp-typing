const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);

const defaultPreferences = Object.freeze({
  soundEnabled: true,
  soundStyle: "soft",
  soundVolume: 0.35,
  virtualKeyboard: true,
  handGuide: true,
  keyboardLayout: "en",
  fontSize: "normal",
  theme: "light",
  superGuest: false,
});

class OfflineApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function apiError(status, code, message, details) {
  throw new OfflineApiError(status, code, message, details);
}

function randomId(bytes = 12) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return { salt: salt.toString("hex"), hash: derived.toString("hex") };
}

async function verifyPassword(password, record) {
  const derived = await scrypt(password, Buffer.from(record.salt, "hex"), 64);
  const stored = Buffer.from(record.hash, "hex");
  return stored.length === derived.length && crypto.timingSafeEqual(stored, derived);
}

function sanitizeUser(user) {
  const { password, securityAnswer, ...safeUser } = user;
  return { ...safeUser, preferences: { ...defaultPreferences, ...safeUser.preferences } };
}

function calculateStars(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

function calculateTypingMetrics({ language, duration, correctUnits, incorrectUnits, errors }) {
  const minutes = Math.max(duration / 60, 1 / 600);
  const totalTyped = correctUnits + incorrectUnits;
  const accuracy = totalTyped === 0 ? 0 : (correctUnits / totalTyped) * 100;
  const cpm = correctUnits / minutes;
  const approximateWpm = correctUnits / 5 / minutes;
  const wpm = language === "en" ? approximateWpm : 0;
  const speedValue = language === "en" ? wpm : cpm / 5;
  const score = Math.min(1000, Math.max(0, Math.round(accuracy * 6 + speedValue * 8 + Math.max(0, 200 - errors * 5))));

  return {
    accuracy: Number(accuracy.toFixed(2)),
    approximateWpm: Number(approximateWpm.toFixed(2)),
    cpm: Number(cpm.toFixed(2)),
    score,
    stars: calculateStars(accuracy),
    wpm: Number(wpm.toFixed(2)),
  };
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function periodStart(period) {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") return new Date(now.getTime() - 7 * 86400000);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

function chooseBestResult(current, candidate) {
  if (!current) return candidate;
  if (candidate.stars !== current.stars) return candidate.stars > current.stars ? candidate : current;
  if (candidate.score !== current.score) return candidate.score > current.score ? candidate : current;
  return candidate.accuracy > current.accuracy ? candidate : current;
}

class OfflineApi {
  constructor({ dataPath, fallbackPaths = [], lessonsPath }) {
    this.dataPath = dataPath;
    this.fallbackPaths = Array.isArray(fallbackPaths) ? fallbackPaths : [];
    this.lessonsPath = lessonsPath;
    this.database = null;
    this.lessons = [];
    this.lessonsById = new Map();
    this.accessTokens = new Map();
    this.initializePromise = null;
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    if (this.database) return;

    if (this.initializePromise) {
      await this.initializePromise;
      return;
    }

    this.initializePromise = this.loadData();

    try {
      await this.initializePromise;
    } finally {
      this.initializePromise = null;
    }
  }

  async loadData() {
    const lessonBundle = JSON.parse(await fs.readFile(this.lessonsPath, "utf8"));
    this.lessons = lessonBundle.lessons;
    this.lessonsById = new Map(this.lessons.map((lesson) => [lesson.id, lesson]));

    let loaded = null;
    try {
      loaded = JSON.parse(await fs.readFile(this.dataPath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;

      if (error instanceof SyntaxError) {
        const recoveryPath = `${this.dataPath}.corrupt-${Date.now()}`;
        await fs.rename(this.dataPath, recoveryPath).catch(() => {});
      }
    }

    if (!loaded || (!loaded.users?.length && !loaded.results?.length)) {
      for (const fallback of this.fallbackPaths) {
        try {
          const candidate = JSON.parse(await fs.readFile(fallback, "utf8"));
          if (candidate && (candidate.users?.length || candidate.results?.length)) {
            loaded = candidate;
            break;
          }
        } catch {
          // Ignore non-existent or invalid fallback candidates
        }
      }
    }

    if (loaded) {
      this.database = loaded;
      this.database.schemaVersion ??= 1;
      this.database.users ??= [];
      this.database.sessions ??= [];
      this.database.results ??= [];

      if (this.database.users.length > 0 || this.database.results.length > 0) {
        try {
          await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
          await fs.writeFile(
            `${this.dataPath}.bak`,
            `${JSON.stringify(this.database, null, 2)}\n`,
            "utf8",
          );
        } catch {
          // Non-blocking safety backup
        }
      }
    } else {
      this.database = { schemaVersion: 1, users: [], sessions: [], results: [] };
    }

    await this.save();
  }

  async save() {
    const contents = `${JSON.stringify(this.database, null, 2)}\n`;
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      const temporaryPath = `${this.dataPath}.tmp`;
      await fs.writeFile(temporaryPath, contents, { encoding: "utf8", mode: 0o600 });
      await fs.rename(temporaryPath, this.dataPath);
    });
    await this.writeQueue;
  }

  issueAccessToken(userId) {
    const token = crypto.randomBytes(32).toString("base64url");
    this.accessTokens.set(token, userId);
    return token;
  }

  async issueSession(userId, replacedRefreshToken) {
    if (replacedRefreshToken) {
      const replacedHash = hashToken(replacedRefreshToken);
      this.database.sessions = this.database.sessions.filter((session) => session.tokenHash !== replacedHash);
    }

    const refreshToken = crypto.randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    this.database.sessions.push({
      tokenHash: hashToken(refreshToken),
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    this.database.sessions = this.database.sessions
      .filter((session) => new Date(session.expiresAt) > new Date())
      .slice(-100);
    await this.save();

    const user = this.database.users.find((item) => item.id === userId);
    return {
      user: sanitizeUser(user),
      accessToken: this.issueAccessToken(userId),
      refreshToken,
      refreshExpiresAt: expiresAt,
    };
  }

  authenticatedUser(accessToken) {
    const userId = this.accessTokens.get(accessToken);
    const user = this.database.users.find((item) => item.id === userId && item.status === "active");
    if (!user) apiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
    return user;
  }

  userResults(userId) {
    return this.database.results.filter((result) => result.student === userId);
  }

  progressByLesson(userId) {
    const progress = new Map();
    const results = this.userResults(userId).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    for (const result of results) {
      const current = progress.get(result.lesson);
      progress.set(result.lesson, {
        attempts: (current?.attempts ?? 0) + 1,
        best: chooseBestResult(current?.best, result),
        completed: true,
        passed: Boolean(current?.passed || result.passed),
      });
    }
    return progress;
  }

  lessonProgressPayload(value) {
    if (!value) return { attempts: 0, completed: false, passed: false, bestAccuracy: 0, bestCpm: 0, bestScore: 0, bestStars: 0, bestWpm: 0 };
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

  assertLessonUnlocked(userId, lesson) {
    const user = this.database.users.find((item) => item.id === userId);
    if (user?.preferences?.superGuest || user?.role === "superadmin" || user?.role === "admin") return;
    if (!lesson.prerequisiteLesson) return;
    const passed = this.userResults(userId).some((result) => result.lesson === lesson.prerequisiteLesson && result.passed);
    if (passed) return;
    const prerequisite = this.lessonsById.get(lesson.prerequisiteLesson);
    apiError(403, "LESSON_LOCKED", `Complete “${prerequisite?.title || "the previous lesson"}” with a passing score to unlock this lesson.`);
  }

  listLessons(userId, params = {}) {
    const user = this.database.users.find((item) => item.id === userId);
    const isSuperGuest = Boolean(user?.preferences?.superGuest || user?.role === "superadmin" || user?.role === "admin");
    const progress = this.progressByLesson(userId);
    return this.lessons
      .filter((lesson) => lesson.isActive && lesson.isPublished)
      .filter((lesson) => !params.language || lesson.language === params.language)
      .filter((lesson) => !params.level || lesson.level === Number(params.level))
      .filter((lesson) => !params.category || lesson.category === params.category)
      .filter((lesson) => !params.type || lesson.type === params.type)
      .sort((a, b) => a.language.localeCompare(b.language) || a.level - b.level || a.order - b.order || a.category.localeCompare(b.category))
      .map((lesson) => {
        const prerequisiteProgress = lesson.prerequisiteLesson ? progress.get(lesson.prerequisiteLesson) : null;
        const isLocked = isSuperGuest ? false : Boolean(lesson.prerequisiteLesson && !prerequisiteProgress?.passed);
        const prerequisite = this.lessonsById.get(lesson.prerequisiteLesson);
        return {
          ...lesson,
          progress: this.lessonProgressPayload(progress.get(lesson.id)),
          isLocked,
          unlockRequirement: isLocked ? {
            lessonId: lesson.prerequisiteLesson,
            title: prerequisite?.title || "the previous lesson",
            language: prerequisite?.language,
            level: prerequisite?.level,
            order: prerequisite?.order,
          } : null,
        };
      });
  }

  getUserProgress(userId) {
    const lessons = this.lessons
      .filter((lesson) => lesson.isActive && lesson.isPublished)
      .filter((lesson) => lesson.category !== "practice-templates")
      .filter((lesson) => !["test", "game"].includes(lesson.type))
      .sort((a, b) => a.language.localeCompare(b.language) || a.level - b.level || a.order - b.order);
    const typingLessons = lessons.filter((lesson) => lesson.type !== "computer-skill");
    const computerSkillLessons = lessons.filter((lesson) => lesson.type === "computer-skill");
    const results = this.userResults(userId).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const passedLessons = new Set(results.filter((result) => result.passed).map((result) => result.lesson));
    const bestByLesson = new Map();
    for (const result of results) bestByLesson.set(result.lesson, chooseBestResult(bestByLesson.get(result.lesson), result));

    const now = new Date();
    const weekly = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = startOfUtcDay(new Date(now.getTime() - offset * 86400000));
      const nextDate = new Date(date.getTime() + 86400000);
      const dayResults = results.filter((result) => new Date(result.completedAt) >= date && new Date(result.completedAt) < nextDate);
      weekly.push({
        date: date.toISOString(),
        label: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }),
        minutes: Number((dayResults.reduce((sum, result) => sum + result.duration, 0) / 60).toFixed(1)),
      });
    }

    const languageSummary = (language) => {
      const languageLessons = typingLessons.filter((lesson) => lesson.language === language);
      const completed = languageLessons.filter((lesson) => passedLessons.has(lesson.id)).length;
      const next = languageLessons.find((lesson) => !passedLessons.has(lesson.id) && (!lesson.prerequisiteLesson || passedLessons.has(lesson.prerequisiteLesson)));
      return {
        completedLessons: completed,
        totalLessons: languageLessons.length,
        percent: languageLessons.length ? Math.round((completed / languageLessons.length) * 100) : 0,
        continueLesson: next ?? null,
      };
    };

    const computerSkillsSummary = () => {
      const completed = computerSkillLessons.filter((lesson) => passedLessons.has(lesson.id)).length;
      const next = computerSkillLessons.find((lesson) => !passedLessons.has(lesson.id) && (!lesson.prerequisiteLesson || passedLessons.has(lesson.prerequisiteLesson)));
      return {
        completedLessons: completed,
        totalLessons: computerSkillLessons.length,
        percent: computerSkillLessons.length ? Math.round((completed / computerSkillLessons.length) * 100) : 0,
        continueLesson: next ?? null,
      };
    };

    const accuracyValues = results.map((result) => result.accuracy);
    const englishWpm = results.filter((result) => result.language === "en").map((result) => result.wpm);
    const khmerCpm = results.filter((result) => result.language === "km").map((result) => result.cpm);
    const resultDays = new Set(results.map((result) => startOfUtcDay(new Date(result.completedAt)).toISOString()));
    let dailyStreak = 0;
    for (let offset = 0; offset < 366; offset += 1) {
      const day = startOfUtcDay(new Date(now.getTime() - offset * 86400000)).toISOString();
      if (!resultDays.has(day)) {
        if (offset === 0) continue;
        break;
      }
      dailyStreak += 1;
    }

    const currentLevel = (language) => {
      const languageLessons = typingLessons.filter((lesson) => lesson.language === language);
      const next = languageLessons.find((lesson) => !passedLessons.has(lesson.id));
      return next?.level ?? languageLessons.at(-1)?.level ?? 1;
    };

    return {
      stats: {
        totalPracticeSeconds: results.reduce((sum, result) => sum + result.duration, 0),
        bestWpm: englishWpm.length ? Math.max(...englishWpm) : 0,
        averageWpm: englishWpm.length ? englishWpm.reduce((sum, value) => sum + value, 0) / englishWpm.length : 0,
        bestCpm: khmerCpm.length ? Math.max(...khmerCpm) : 0,
        averageAccuracy: accuracyValues.length ? accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length : 0,
        bestAccuracy: accuracyValues.length ? Math.max(...accuracyValues) : 0,
        stars: [...bestByLesson.values()].reduce((sum, result) => sum + result.stars, 0),
        lessonsCompleted: lessons.filter((lesson) => passedLessons.has(lesson.id)).length,
        testsCompleted: results.filter((result) => result.mode === "test").length,
        dailyStreak,
        currentEnglishLevel: currentLevel("en"),
        currentKhmerLevel: currentLevel("km"),
      },
      languages: { en: languageSummary("en"), km: languageSummary("km") },
      computerSkills: computerSkillsSummary(),
      recent: results.slice(0, 6).map((result) => {
        const lesson = this.lessonsById.get(result.lesson);
        return {
          id: result.id,
          lesson: lesson ? { id: lesson.id, title: lesson.title, language: lesson.language, level: lesson.level } : null,
          accuracy: result.accuracy,
          cpm: result.cpm,
          completedAt: result.completedAt,
          score: result.score,
          stars: result.stars,
          wpm: result.wpm,
        };
      }),
      weekly,
    };
  }

  async register(data) {
    const username = String(data.username ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");
    const rawName = String(data.name ?? data.firstName ?? "").trim();
    const securityQuestion = String(data.securityQuestion ?? "Recovery Key").trim() || "Recovery Key";
    const securityAnswer = String(data.securityAnswer ?? "").trim().toLowerCase();
    const details = [];
    if (!rawName) details.push({ field: "body.name", message: "Enter your name." });
    if (username.length < 3 || username.length > 64 || !/^[a-z0-9._-]+$/.test(username)) details.push({ field: "body.username", message: "Use 3-64 lowercase letters, numbers, dots, underscores, or hyphens." });
    if (password.length < 6 || password.length > 128) details.push({ field: "body.password", message: "Use 6-128 characters." });
    if (securityAnswer.length < 2 || securityAnswer.length > 200) details.push({ field: "body.securityAnswer", message: "Use 2-200 characters for the recovery key." });
    if (securityAnswer !== "admin.snpis@2013") details.push({ field: "body.securityAnswer", message: "Recovery Key មិនត្រឹមត្រូវទេ! សូមទាក់ទងលោកគ្រូ ឬអ្នកគ្រូ។ (The recovery key is incorrect.)" });
    if (details.length) apiError(400, "VALIDATION_ERROR", "Please check the submitted information.", details);
    if (this.database.users.some((user) => user.username === username)) apiError(409, "USERNAME_TAKEN", "That username is already in use. Choose another one.");

    const now = new Date().toISOString();
    const user = {
      id: randomId(),
      username,
      firstName: rawName,
      lastName: String(data.lastName ?? "").trim(),
      khmerName: String(data.khmerName ?? (/[ក-៿]/u.test(rawName) ? rawName : "")).trim(),
      gender: ["female", "male", "other", "unspecified"].includes(data.gender) ? data.gender : "unspecified",
      status: "active",
      preferences: { ...defaultPreferences },
      password: await createPasswordRecord(password),
      securityQuestion,
      securityAnswer: await createPasswordRecord(securityAnswer),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    this.database.users.push(user);
    return this.issueSession(user.id);
  }

  async login(data) {
    const username = String(data.username ?? "").trim().toLowerCase();
    const user = this.database.users.find((item) => item.username === username);
    if (!user || !(await verifyPassword(String(data.password ?? ""), user.password))) apiError(401, "INVALID_CREDENTIALS", "The username or password is incorrect.");
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;
    return this.issueSession(user.id);
  }

  findUsername(criteria = {}) {
    const query = String(criteria.query ?? criteria.firstName ?? criteria.name ?? "").trim().toLowerCase();
    if (!query) apiError(400, "MISSING_CRITERIA", "Please enter a name or username to search.");

    return this.database.users
      .filter((user) => user.status === "active")
      .filter((user) => [user.username, user.firstName, user.lastName, user.khmerName]
        .some((value) => String(value ?? "").toLowerCase().includes(query)))
      .slice(0, 10)
      .map((user) => ({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName || "",
        khmerName: user.khmerName || "",
      }));
  }

  getAccountVerificationInfo(username) {
    const normalizedUsername = String(username ?? "").trim().toLowerCase();
    const user = this.database.users.find((item) => item.username === normalizedUsername && item.status === "active");
    if (!user) apiError(404, "USER_NOT_FOUND", "No active account found with this username.");

    return {
      username: user.username,
      firstName: user.firstName,
      securityQuestion: user.securityQuestion || "Recovery Key",
      hasSecurityQuestion: Boolean(user.securityAnswer),
    };
  }

  async resetPassword(data) {
    const username = String(data.username ?? "").trim().toLowerCase();
    const newPassword = String(data.newPassword ?? "");
    const providedAnswer = String(data.securityAnswer ?? "").trim().toLowerCase();
    const user = this.database.users.find((item) => item.username === username && item.status === "active");
    if (!user) apiError(404, "USER_NOT_FOUND", "No active account found with this username.");
    if (!user.securityAnswer) apiError(409, "RECOVERY_NOT_CONFIGURED", "Password recovery is not configured for this account.");
    if (newPassword.length < 6 || newPassword.length > 128) apiError(400, "VALIDATION_ERROR", "Use 6-128 characters for the new password.");
    if (providedAnswer.length < 2) apiError(400, "VALIDATION_ERROR", "Enter the recovery key.");

    const answerMatches = typeof user.securityAnswer === "object"
      ? await verifyPassword(providedAnswer, user.securityAnswer)
      : String(user.securityAnswer).trim().toLowerCase() === providedAnswer;
    if (!answerMatches) apiError(400, "SECURITY_ANSWER_INCORRECT", "The recovery key is incorrect.");

    user.password = await createPasswordRecord(newPassword);
    user.passwordChangedAt = new Date().toISOString();
    user.updatedAt = user.passwordChangedAt;
    this.database.sessions = this.database.sessions.filter((session) => session.userId !== user.id);
    for (const [token, userId] of this.accessTokens) {
      if (userId === user.id) this.accessTokens.delete(token);
    }
    await this.save();

    return { message: "Password reset successfully. Please sign in with your new password." };
  }

  async refresh(refreshToken) {
    const tokenHash = hashToken(String(refreshToken ?? ""));
    const session = this.database.sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt) > new Date());
    if (!session) apiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again.");
    return this.issueSession(session.userId, refreshToken);
  }

  async logout(refreshToken) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    this.database.sessions = this.database.sessions.filter((session) => session.tokenHash !== tokenHash);
    await this.save();
  }

  leaderboard(params = {}) {
    const period = params.period ?? "week";
    const category = params.category ?? "score";
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const start = periodStart(period);
    const matching = this.database.results.filter((result) => {
      if (start && new Date(result.completedAt) < start) return false;
      if (category === "english-wpm" && result.language !== "en") return false;
      if (category === "khmer-cpm" && result.language !== "km") return false;
      return true;
    });
    const grouped = new Map();

    for (const result of matching) {
      const current = grouped.get(result.student) ?? { value: category === "accuracy" || category.endsWith("wpm") || category.endsWith("cpm") ? 0 : 0, totalScore: 0, stars: 0, attempts: 0 };
      const candidate = { "english-wpm": result.wpm, "khmer-cpm": result.cpm, accuracy: result.accuracy }[category];
      current.value = category === "score" ? current.value + result.score : category === "stars" ? current.value + result.stars : Math.max(current.value, candidate ?? 0);
      current.totalScore += result.score;
      current.stars += result.stars;
      current.attempts += 1;
      grouped.set(result.student, current);
    }

    const entries = [...grouped.entries()]
      .map(([userId, values]) => {
        const user = this.database.users.find((item) => item.id === userId);
        return user ? { ...values, student: { id: user.id, firstName: user.firstName, lastName: user.lastName, khmerName: user.khmerName, studentId: user.studentId } } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value || b.totalScore - a.totalScore)
      .slice(0, limit);
    return { entries, category, period };
  }

  async createResult(userId, input) {
    const lesson = this.lessonsById.get(input.lessonId);
    if (!lesson || !lesson.isActive || !lesson.isPublished) apiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
    this.assertLessonUnlocked(userId, lesson);
    const duration = Number(input.duration);
    if (!Number.isFinite(duration) || duration <= 0) apiError(400, "VALIDATION_ERROR", "The result duration is invalid.");

    const isKhmer = lesson.language === "km";
    const correctUnits = Number(isKhmer ? input.correctGraphemes : input.correctCharacters) || 0;
    const incorrectUnits = Number(isKhmer ? input.incorrectGraphemes : input.incorrectCharacters) || 0;
    const metrics = calculateTypingMetrics({ language: lesson.language, duration, correctUnits, incorrectUnits, errors: Number(input.errors) || 0 });
    const speed = isKhmer ? metrics.cpm : metrics.wpm;
    const completedAt = new Date().toISOString();
    const result = {
      id: randomId(),
      student: userId,
      lesson: lesson.id,
      language: lesson.language,
      mode: ["lesson", "test", "practice", "game"].includes(input.mode) ? input.mode : "lesson",
      startedAt: input.startedAt,
      completedAt,
      duration,
      totalTyped: Number(input.totalTyped) || 0,
      totalCharacters: Number(input.totalCharacters) || 0,
      correctCharacters: Number(input.correctCharacters) || 0,
      incorrectCharacters: Number(input.incorrectCharacters) || 0,
      totalGraphemes: Number(input.totalGraphemes) || 0,
      correctGraphemes: Number(input.correctGraphemes) || 0,
      incorrectGraphemes: Number(input.incorrectGraphemes) || 0,
      errors: Number(input.errors) || 0,
      passed: metrics.accuracy >= lesson.minimumAccuracy && speed >= lesson.minimumSpeed,
      ...metrics,
      createdAt: completedAt,
      updatedAt: completedAt,
    };
    this.database.results.push(result);
    await this.save();
    return { result, progress: this.getUserProgress(userId) };
  }

  async updatePreferences(user, preferences) {
    const allowed = ["soundEnabled", "soundStyle", "soundVolume", "virtualKeyboard", "handGuide", "keyboardLayout", "fontSize", "theme", "superGuest"];
    user.preferences ??= { ...defaultPreferences };
    for (const key of allowed) if (Object.hasOwn(preferences, key)) user.preferences[key] = preferences[key];
    user.updatedAt = new Date().toISOString();
    await this.save();
    return sanitizeUser(user);
  }

  async dispatch({ method = "GET", path: requestPath, data = {}, params = {}, accessToken }) {
    await this.initialize();
    const route = String(requestPath ?? "").split("?")[0];
    const verb = method.toUpperCase();

    if (verb === "POST" && route === "/auth/register") return { status: 201, data: await this.register(data) };
    if (verb === "POST" && route === "/auth/login") return { status: 200, data: await this.login(data) };
    if (verb === "POST" && route === "/auth/find-username") return { status: 200, data: this.findUsername(data) };
    if (verb === "POST" && route === "/auth/verify-account") return { status: 200, data: this.getAccountVerificationInfo(data.username) };
    if (verb === "POST" && route === "/auth/reset-password") return { status: 200, data: await this.resetPassword(data) };
    if (verb === "POST" && route === "/auth/refresh") return { status: 200, data: await this.refresh(data.refreshToken) };
    if (verb === "POST" && route === "/auth/logout") { await this.logout(data.refreshToken); return { status: 204, data: null }; }
    if (verb === "POST" && route === "/auth/session") return { status: 200, data: null };

    const user = this.authenticatedUser(accessToken);
    if (verb === "GET" && route === "/auth/me") return { status: 200, data: { user: sanitizeUser(user) } };
    if (verb === "GET" && route === "/lessons") return { status: 200, data: { lessons: this.listLessons(user.id, params) } };
    if (verb === "GET" && route.startsWith("/lessons/")) {
      const lesson = this.lessonsById.get(route.slice("/lessons/".length));
      if (!lesson || !lesson.isActive || !lesson.isPublished) apiError(404, "LESSON_NOT_FOUND", "The requested lesson was not found.");
      this.assertLessonUnlocked(user.id, lesson);
      const nextLesson = this.lessons.find((item) => item.prerequisiteLesson === lesson.id && item.isActive && item.isPublished);
      return { status: 200, data: { lesson, nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, level: nextLesson.level } : null } };
    }
    if (verb === "POST" && route === "/results") return { status: 201, data: await this.createResult(user.id, data) };
    if (verb === "GET" && route === "/progress/me") return { status: 200, data: this.getUserProgress(user.id) };
    if (verb === "GET" && route === "/leaderboard") return { status: 200, data: this.leaderboard(params) };
    if (verb === "PATCH" && route === "/settings/me") return { status: 200, data: { user: await this.updatePreferences(user, data) } };

    apiError(404, "ROUTE_NOT_FOUND", `The offline route ${verb} ${route} does not exist.`);
  }

  async request(input) {
    try {
      const response = await this.dispatch(input ?? {});
      return { ok: true, status: response.status, body: response.status === 204 ? null : { data: response.data } };
    } catch (error) {
      const normalized = error instanceof OfflineApiError
        ? error
        : new OfflineApiError(500, "OFFLINE_STORAGE_ERROR", "SNP Typing could not access its offline data.");
      if (!(error instanceof OfflineApiError)) console.error("Offline API error", error);
      return {
        ok: false,
        status: normalized.status,
        body: { error: { code: normalized.code, message: normalized.message, ...(normalized.details ? { details: normalized.details } : {}) } },
      };
    }
  }
}

function createOfflineApi(options) {
  return new OfflineApi(options);
}

module.exports = { createOfflineApi };
