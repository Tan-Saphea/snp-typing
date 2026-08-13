import { segmentGraphemes } from "./graphemes.js";

export const LESSON_TARGET_MIN_GRAPHEMES = 100;
export const LESSON_TARGET_MAX_GRAPHEMES = 300;

export function buildContentBlockTarget(block) {
  if (!block) return "";

  switch (block.kind) {
    case "picture":
      return block.answer ?? "";
    case "items":
    case "sentences":
      return block.items?.join(" ") ?? "";
    case "formatting":
    case "paragraph":
    case "story":
    case "text":
      return block.text ?? "";
    default:
      if (block.text) return block.text;
      if (block.items?.length) return block.items.join(" ");
      return block.answer ?? "";
  }
}

export function buildLessonTargetText(lesson) {
  const blocks = lesson?.content?.blocks ?? lesson?.contentBlocks ?? [];

  return blocks
    .map(buildContentBlockTarget)
    .filter(Boolean)
    .join("\n\n")
    .normalize("NFC");
}

export function countLessonTargetGraphemes(lesson) {
  const locale = lesson?.language === "km" ? "km" : "en";
  return segmentGraphemes(buildLessonTargetText(lesson), locale).length;
}

export function isLessonTargetLengthValid(lesson) {
  const count = countLessonTargetGraphemes(lesson);
  return count >= LESSON_TARGET_MIN_GRAPHEMES && count <= LESSON_TARGET_MAX_GRAPHEMES;
}
