import { buildLessonTargetText, segmentGraphemes } from "@snp/shared";

const apiUrl = process.env.SNP_SMOKE_API_URL ?? "http://127.0.0.1:5012/api";
const passwords = {
  admin: process.env.SNP_SMOKE_ADMIN_PASSWORD,
  teacher: process.env.SNP_SMOKE_TEACHER_PASSWORD,
  student: process.env.SNP_SMOKE_STUDENT_PASSWORD,
};
if (Object.values(passwords).some((value) => !value)) throw new Error("All SNP smoke passwords are required.");

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-SNP-Client": "electron", ...options.headers },
  });
  const payload = response.status === 204 ? null : await response.json();
  if (response.status !== expectedStatus) throw new Error(`${options.method ?? "GET"} ${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

async function login(username, password) {
  return (await request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) })).data;
}

function auth(session) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

function lessonText(lesson) {
  return buildLessonTargetText(lesson);
}

function perfectResult(lesson, mode = "lesson") {
  const text = lessonText(lesson);
  const segments = segmentGraphemes(text, lesson.language);
  const isKhmer = lesson.language === "km";
  return {
    lessonId: lesson.id,
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    duration: 60,
    totalTyped: segments.length,
    totalCharacters: isKhmer ? text.length : segments.length,
    correctCharacters: isKhmer ? 0 : segments.length,
    incorrectCharacters: 0,
    totalGraphemes: segments.length,
    correctGraphemes: segments.length,
    incorrectGraphemes: 0,
    errors: 0,
    mode,
  };
}

const admin = await login("admin", passwords.admin);
const teacher = await login("teacher", passwords.teacher);
const student = await login("dara", passwords.student);
if (admin.user.role !== "admin" || teacher.user.role !== "teacher" || student.user.role !== "student") throw new Error("Role logins returned incorrect roles.");

const adminHeaders = auth(admin);
const teacherHeaders = auth(teacher);
const studentHeaders = auth(student);
const managed = await request("/lessons/manage", { headers: adminHeaders });
if (managed.data.stats.total !== 212 || managed.data.stats.english !== 129 || managed.data.stats.khmer !== 83 || managed.data.stats.needsReview !== 26) {
  throw new Error(`Seed curriculum totals are incorrect: ${JSON.stringify(managed.data.stats)}`);
}
await request("/lessons/manage", { headers: studentHeaders }, 403);

const english = await request("/lessons?language=en", { headers: studentHeaders });
const khmer = await request("/lessons?language=km", { headers: studentHeaders });
if (english.data.lessons.length !== 118 || khmer.data.lessons.length !== 68) throw new Error("Published student lesson totals are incorrect.");
const basics = english.data.lessons.filter((lesson) => lesson.category === "keyboard-basics");
if (basics.length !== 14 || basics[0].isLocked || !basics[1].isLocked) throw new Error("English lesson unlocking is incorrect before completion.");

const firstEnglish = (await request(`/lessons/${basics[0].id}`, { headers: studentHeaders })).data.lesson;
const savedEnglish = await request("/results", { method: "POST", headers: studentHeaders, body: JSON.stringify(perfectResult(firstEnglish)) }, 201);
if (!savedEnglish.data.result.passed || savedEnglish.data.result.stars !== 3 || savedEnglish.data.result.wpm <= 0) throw new Error("English result metrics are incorrect.");
const englishAfter = await request("/lessons?language=en&level=1", { headers: studentHeaders });
const basicsAfter = englishAfter.data.lessons.filter((lesson) => lesson.category === "keyboard-basics");
if (basicsAfter[1].isLocked || !basicsAfter[2].isLocked) throw new Error("English result did not unlock exactly the next lesson.");

const firstKhmerSummary = khmer.data.lessons.find((lesson) => lesson.category === "khmer-consonants" && lesson.order === 1);
const firstKhmer = (await request(`/lessons/${firstKhmerSummary.id}`, { headers: studentHeaders })).data.lesson;
const savedKhmer = await request("/results", { method: "POST", headers: studentHeaders, body: JSON.stringify(perfectResult(firstKhmer)) }, 201);
if (!savedKhmer.data.result.passed || savedKhmer.data.result.cpm <= 0 || savedKhmer.data.result.correctGraphemes !== segmentGraphemes(lessonText(firstKhmer), "km").length) throw new Error("Khmer grapheme metrics are incorrect.");

for (const [type, mode] of [["test", "test"], ["game", "game"]]) {
  const summary = (await request(`/lessons?language=en&type=${type}`, { headers: studentHeaders })).data.lessons[0];
  const lesson = (await request(`/lessons/${summary.id}`, { headers: studentHeaders })).data.lesson;
  await request("/results", { method: "POST", headers: studentHeaders, body: JSON.stringify(perfectResult(lesson, mode)) }, 201);
}
const practiceSummary = (await request("/lessons?language=km&category=practice-templates", { headers: studentHeaders })).data.lessons[0];
const practiceLesson = (await request(`/lessons/${practiceSummary.id}`, { headers: studentHeaders })).data.lesson;
await request("/results", { method: "POST", headers: studentHeaders, body: JSON.stringify(perfectResult(practiceLesson, "practice")) }, 201);

const classes = await request("/classes", { headers: teacherHeaders });
const schoolClass = classes.data.classes[0];
const classId = schoolClass.id ?? schoolClass._id;
await request(`/classes/${classId}`, { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ freePracticeMode: true }) });
const freePracticeLessons = await request("/lessons?language=en&level=1", { headers: studentHeaders });
if (freePracticeLessons.data.lessons.some((lesson) => lesson.isLocked)) throw new Error("Free Practice Mode did not unlock lessons.");
await request(`/classes/${classId}`, { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ freePracticeMode: false }) });
const lockedAgain = await request("/lessons?language=en&level=1", { headers: studentHeaders });
if (!lockedAgain.data.lessons.find((lesson) => lesson.category === "keyboard-basics" && lesson.order === 3).isLocked) throw new Error("Disabling Free Practice Mode did not restore prerequisites.");

const unique = Date.now().toString(36);
const createdClass = await request("/classes", { method: "POST", headers: teacherHeaders, body: JSON.stringify({ name: `Smoke Class ${unique}`, level: "Audit", academicYear: "2026-2027", status: "active", freePracticeMode: false, students: [] }) }, 201);
await request(`/classes/${createdClass.data.class.id ?? createdClass.data.class._id}`, { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ status: "archived" }) });
const createdStudent = await request("/students", { method: "POST", headers: teacherHeaders, body: JSON.stringify({ studentId: `SMK-${unique}`, firstName: "Smoke", lastName: "Student", khmerName: "", gender: "unspecified", class: classId, username: `smoke-${unique}`, password: "SmokePass123!", status: "active" }) }, 201);
await request(`/students/${createdStudent.data.student.id}`, { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ status: "inactive" }) });

const students = await request("/students", { headers: teacherHeaders });
const vanna = students.data.students.find((item) => item.username === "vanna");
await request(`/students/${vanna.id}/reset-password`, { method: "POST", headers: teacherHeaders, body: JSON.stringify({ password: "TempPass123!" }) }, 204);
const vannaLogin = await login("vanna", "TempPass123!");
if (vannaLogin.user.username !== "vanna") throw new Error("Teacher password reset did not work.");
await request(`/students/${vanna.id}/reset-password`, { method: "POST", headers: teacherHeaders, body: JSON.stringify({ password: passwords.student }) }, 204);

const assignment = await request("/assignments", { method: "POST", headers: teacherHeaders, body: JSON.stringify({ title: "Smoke Lesson Assignment", description: "API verification", targetType: "class", students: [], class: classId, activityType: "lesson", lesson: basics[0].id, language: "en", customText: "", startDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000).toISOString(), status: "active" }) }, 201);
const assignments = await request("/assignments", { headers: teacherHeaders });
if (!assignments.data.assignments.some((item) => (item.id ?? item._id) === (assignment.data.assignment.id ?? assignment.data.assignment._id))) throw new Error("Assignment was not listed after creation.");
await request(`/assignments/${assignment.data.assignment.id ?? assignment.data.assignment._id}`, { method: "DELETE", headers: teacherHeaders }, 204);

const customPayload = {
  title: `Smoke Lesson ${unique}`, titleKhmer: "", description: "Audit lesson", slug: `smoke-lesson-${unique}`, language: "en", category: `smoke-audit-${unique}`,
  level: 1, order: 1, difficulty: "easy", type: "word", instructions: "Type the smoke words.", contentItems: ["safe", "school", "student", "typing", "practice", "accuracy", "keyboard", "lesson", "progress", "review", "challenge", "success", "careful", "steady", "learning"],
  contentBlocks: [{ kind: "items", items: ["safe", "school", "student", "typing", "practice", "accuracy", "keyboard", "lesson", "progress", "review", "challenge", "success", "careful", "steady", "learning"] }], minimumAccuracy: 70, minimumSpeed: 0, timeLimit: 0,
  starsEnabled: true, allowBackspace: true, isLocked: false, isPublished: true, isActive: true, sourceBook: "Smoke Audit", sourceExercise: "Automated", contentStatus: "custom", reviewNotes: "",
};
const custom = await request("/lessons", { method: "POST", headers: adminHeaders, body: JSON.stringify(customPayload) }, 201);
const copy = await request(`/lessons/${custom.data.lesson.id}/duplicate`, { method: "POST", headers: adminHeaders }, 201);
await request("/lessons/reorder", { method: "POST", headers: adminHeaders, body: JSON.stringify({ items: [{ id: custom.data.lesson.id, order: 2 }, { id: copy.data.lesson.id, order: 1 }] }) });
const moved = await request(`/lessons/${copy.data.lesson.id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ level: 2, category: `${customPayload.category}-moved`, order: 1, isPublished: true }) });
if (moved.data.lesson.level !== 2 || !moved.data.lesson.isPublished) throw new Error("Lesson move/publish did not persist.");
await request(`/lessons/${custom.data.lesson.id}`, { method: "DELETE", headers: adminHeaders });
await request(`/lessons/${copy.data.lesson.id}`, { method: "DELETE", headers: adminHeaders });

const preferences = await request("/settings/me", { method: "PATCH", headers: studentHeaders, body: JSON.stringify({ soundEnabled: false, virtualKeyboard: true, fontSize: "large", theme: "system" }) });
if (preferences.data.user.preferences.soundEnabled !== false || preferences.data.user.preferences.fontSize !== "large") throw new Error("Account settings did not persist.");
const leaderboard = await request("/leaderboard?period=all&category=score", { headers: studentHeaders });
if (!leaderboard.data.entries.some((entry) => entry.student.username === undefined && entry.student.firstName === student.user.firstName)) throw new Error("Leaderboard did not include saved student results.");
const schoolSettings = await request("/settings/school", { headers: teacherHeaders });
if (schoolSettings.data.settings.minimumPassingAccuracy !== 70) throw new Error("Default school settings are incorrect.");
const restrictedSettings = await request("/settings/school", { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ showLiveWpm: false, allowTypingGames: false, lessonUnlocking: false, leaderboardVisibility: "hidden", minimumPassingAccuracy: 75 }) });
if (restrictedSettings.data.settings.showLiveWpm !== false || restrictedSettings.data.settings.minimumPassingAccuracy !== 75) throw new Error("Teacher school settings did not persist.");
await request("/leaderboard?period=all&category=score", { headers: studentHeaders }, 403);
await request(`/lessons/${(await request("/lessons?language=en&type=game", { headers: adminHeaders })).data.lessons[0].id}`, { headers: studentHeaders }, 403);
await request("/settings/school", { method: "PATCH", headers: teacherHeaders, body: JSON.stringify({ showLiveWpm: true, allowTypingGames: true, lessonUnlocking: true, leaderboardVisibility: "school", minimumPassingAccuracy: 70 }) });
const teacherResults = await request("/results?limit=100", { headers: teacherHeaders });
const report = await request("/reports/summary", { headers: teacherHeaders });
if (teacherResults.data.results.length < 5 || report.data.summary.results < 5 || report.data.summary.students !== 3) throw new Error("Teacher results or report summary is incorrect.");

const progress = await request("/progress/me", { headers: studentHeaders });
if (progress.data.stats.lessonsCompleted < 2 || progress.data.stats.testsCompleted < 1 || progress.data.languages.en.completedLessons < 1 || progress.data.languages.km.completedLessons < 1) throw new Error("Student progress did not include saved activities.");
await request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: student.refreshToken }) }, 204);
const studentAgain = await login("dara", passwords.student);
const progressAgain = await request("/progress/me", { headers: auth(studentAgain) });
if (progressAgain.data.stats.lessonsCompleted !== progress.data.stats.lessonsCompleted) throw new Error("Progress did not persist after logout and login.");

console.log("Full SNP Typing API smoke test passed for admin, teacher, student, lessons, activities, management, reports, and persistence.");
