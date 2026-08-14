import { buildLessonTargetText, segmentGraphemes } from "@snp/shared";

const apiUrl = process.env.SNP_SMOKE_API_URL ?? "http://127.0.0.1:5012/api";
const password = process.env.SNP_SMOKE_PASSWORD;

if (!password) throw new Error("SNP_SMOKE_PASSWORD is required.");

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-SNP-Client": "electron",
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(`${options.method ?? "GET"} ${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function lessonText(lesson) {
  return buildLessonTargetText(lesson);
}

function perfectResult(lesson) {
  const text = lessonText(lesson);
  const segments = segmentGraphemes(text, lesson.language === "km" ? "km" : "en");
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
    mode: "lesson",
  };
}

const username = `smoke-${Date.now().toString(36)}`;
const registration = await request("/auth/register", {
  method: "POST",
  body: JSON.stringify({ firstName: "Smoke", lastName: "Learner", username, password }),
}, 201);
const authorization = { Authorization: `Bearer ${registration.data.accessToken}` };
const english = await request("/lessons?language=en", { headers: authorization });
const englishBasics = english.data.lessons.filter(
  (lesson) => lesson.category === "keyboard-basics",
);

if (english.data.lessons.length !== 118) throw new Error(`Visible English lesson count is incorrect: ${english.data.lessons.length}.`);
if (englishBasics[0].isLocked || !englishBasics[1].isLocked) {
  throw new Error("The first English lesson should be open and the second should be locked.");
}

const lockedLesson = await request(`/lessons/${englishBasics[1].id}`, { headers: authorization }, 403);
if (lockedLesson.error?.code !== "LESSON_LOCKED") throw new Error("A locked lesson URL did not return LESSON_LOCKED.");

const lockedResult = await request("/results", {
  method: "POST",
  headers: authorization,
  body: JSON.stringify(perfectResult(englishBasics[1])),
}, 403);
if (lockedResult.error?.code !== "LESSON_LOCKED") throw new Error("A locked result submission did not return LESSON_LOCKED.");

const firstEnglish = englishBasics[0];
const englishLesson = await request(`/lessons/${firstEnglish.id}`, { headers: authorization });
const savedEnglish = await request("/results", {
  method: "POST",
  headers: authorization,
  body: JSON.stringify(perfectResult(englishLesson.data.lesson)),
}, 201);

if (!savedEnglish.data.result.passed || savedEnglish.data.result.stars !== 3) {
  throw new Error("A perfect English result did not pass with three stars.");
}

await request(`/lessons/${englishBasics[1].id}`, { headers: authorization });

const englishAfter = await request("/lessons?language=en&level=1", { headers: authorization });
const basicsAfter = englishAfter.data.lessons.filter(
  (lesson) => lesson.category === "keyboard-basics",
);
if (basicsAfter.length !== englishBasics.length) throw new Error("A saved result changed the visible lesson set.");
if (basicsAfter[1].isLocked) throw new Error("Passing the prerequisite did not unlock the next English lesson.");

const khmer = await request("/lessons?language=km", { headers: authorization });
if (khmer.data.lessons.length !== 68) throw new Error(`Visible Khmer lesson count is incorrect: ${khmer.data.lessons.length}.`);
const firstKhmer = khmer.data.lessons.find(
  (lesson) => lesson.category === "khmer-consonants" && lesson.order === 1,
);
const khmerLesson = await request(`/lessons/${firstKhmer.id}`, { headers: authorization });
const savedKhmer = await request("/results", {
  method: "POST",
  headers: authorization,
  body: JSON.stringify(perfectResult(khmerLesson.data.lesson)),
}, 201);

if (!savedKhmer.data.result.passed || savedKhmer.data.result.cpm <= 0) {
  throw new Error("Khmer grapheme result was not scored correctly.");
}

const progress = await request("/progress/me", { headers: authorization });
if (
  progress.data.stats.lessonsCompleted < 2 ||
  progress.data.languages.en.completedLessons < 1 ||
  progress.data.languages.km.completedLessons < 1 ||
  progress.data.recent.length < 2
) {
  throw new Error("Saved results did not update progress summaries.");
}

console.log("Self-registration, sequential lesson protection, results, Khmer scoring, and progress smoke tests passed.");
