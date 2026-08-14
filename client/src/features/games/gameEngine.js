import { normalizeForComparison, segmentGraphemes } from "@snp/shared";

export const GAME_CONFIGS = {
  "falling-words": {
    id: "falling-words",
    title: "Falling Words",
    lessonName: "Falling Words",
    icon: "☄️",
    duration: 60,
    lives: 3,
    accent: "sky",
    description: "Type each word before it reaches the bottom.",
    instruction: "Press Enter after every word. Missed words cost one heart.",
  },
  "balloon-typing": {
    id: "balloon-typing",
    title: "Balloon Pop",
    lessonName: "Balloon Typing",
    icon: "🎈",
    duration: 45,
    lives: null,
    accent: "rose",
    description: "Type the word correctly to pop each balloon.",
    instruction: "Build a streak to earn larger score bonuses.",
  },
  "picture-typing": {
    id: "picture-typing",
    title: "Picture Typing",
    lessonName: "Picture Typing",
    icon: "🖼️",
    duration: 90,
    lives: null,
    accent: "amber",
    description: "Look at each picture and type its name.",
    instruction: "Complete every picture before the timer reaches zero.",
  },
  "speed-challenge": {
    id: "speed-challenge",
    title: "Speed Sprint",
    lessonName: "Speed Challenge",
    icon: "⚡",
    duration: 45,
    lives: null,
    accent: "violet",
    description: "Type as many correct words as possible.",
    instruction: "Stay accurate—your streak multiplies each correct answer.",
  },
};

export const GAME_LIST = Object.values(GAME_CONFIGS);

export function getGameConfig(gameId) {
  return GAME_CONFIGS[gameId] ?? null;
}

export function createGameSession(config) {
  return {
    index: 0,
    correctWords: 0,
    correctUnits: 0,
    incorrectUnits: 0,
    typedUnits: 0,
    errors: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    lives: config?.lives ?? null,
  };
}

function comparable(value) {
  return normalizeForComparison(String(value ?? "").trim()).toLocaleLowerCase();
}

export function evaluateGameAttempt(expected, received, language = "en") {
  const expectedText = comparable(expected);
  const receivedText = comparable(received);
  return {
    isCorrect: Boolean(receivedText) && expectedText === receivedText,
    expectedUnits: segmentGraphemes(expectedText, language).length,
    receivedUnits: segmentGraphemes(receivedText, language).length,
  };
}

export function applyGameAttempt(session, attempt) {
  if (attempt.isCorrect) {
    const streak = session.streak + 1;
    const streakBonus = Math.min(streak, 10) * 5;
    return {
      ...session,
      index: session.index + 1,
      correctWords: session.correctWords + 1,
      correctUnits: session.correctUnits + attempt.expectedUnits,
      typedUnits: session.typedUnits + attempt.receivedUnits,
      streak,
      bestStreak: Math.max(session.bestStreak, streak),
      score: session.score + attempt.expectedUnits * 10 + streakBonus,
    };
  }

  return {
    ...session,
    incorrectUnits:
      session.incorrectUnits
      + Math.max(attempt.expectedUnits, attempt.receivedUnits, 1),
    typedUnits: session.typedUnits + attempt.receivedUnits,
    errors: session.errors + 1,
    streak: 0,
    score: Math.max(0, session.score - 10),
  };
}

export function applyMissedWord(session, expected, language = "en") {
  const missedUnits = Math.max(
    segmentGraphemes(comparable(expected), language).length,
    1,
  );
  return {
    ...session,
    index: session.index + 1,
    incorrectUnits: session.incorrectUnits + missedUnits,
    errors: session.errors + 1,
    streak: 0,
    lives: session.lives === null ? null : Math.max(0, session.lives - 1),
  };
}

export function calculateGameAccuracy(session) {
  const total = session.correctUnits + session.incorrectUnits;
  return total ? (session.correctUnits / total) * 100 : 0;
}

export function buildGameResultPayload({ lesson, session, startedAt, duration }) {
  const isKhmer = lesson.language === "km";
  const totalUnits = session.correctUnits + session.incorrectUnits;
  return {
    lessonId: lesson.id,
    startedAt: (startedAt ?? new Date()).toISOString(),
    duration: Math.max(Number(duration) || 0, 0.1),
    totalTyped: session.typedUnits,
    totalCharacters: isKhmer ? 0 : totalUnits,
    correctCharacters: isKhmer ? 0 : session.correctUnits,
    incorrectCharacters: isKhmer ? 0 : session.incorrectUnits,
    totalGraphemes: totalUnits,
    correctGraphemes: session.correctUnits,
    incorrectGraphemes: session.incorrectUnits,
    errors: session.errors,
    mode: "game",
  };
}

export function shuffledItems(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
