import { buildLessonTargetText } from "@snp/shared";

export const buildTargetText = buildLessonTargetText;

export function buildResultPayload({ lesson, engine, targetText, mode, duration }) {
  const isKhmer = lesson.language === "km";
  return {
    lessonId: lesson.id,
    startedAt: (engine.startedAt ?? new Date()).toISOString(),
    duration: Math.max(duration ?? engine.elapsedTime, 0.1),
    totalTyped: engine.totalTyped,
    totalCharacters: isKhmer ? targetText.length : engine.targetSegments.length,
    correctCharacters: isKhmer ? 0 : engine.correctCharacters,
    incorrectCharacters: isKhmer ? 0 : engine.incorrectCharacters,
    totalGraphemes: engine.targetSegments.length,
    correctGraphemes: engine.correctGraphemes,
    incorrectGraphemes: engine.incorrectGraphemes,
    errors: engine.errors,
    mode,
  };
}
