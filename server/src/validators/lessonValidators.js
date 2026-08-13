import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const lessonType = z.enum(["letter", "word", "sentence", "paragraph", "story", "test", "game", "computer-skill"]);
const difficulty = z.enum(["beginner", "easy", "medium", "challenge", "advanced"]);
const contentStatus = z.enum(["verified", "needs_review", "custom"]);
const contentBlock = z.object({
  kind: z.enum(["text", "items", "sentences", "paragraph", "story", "picture", "formatting"]),
  text: z.string().max(20000).optional(),
  items: z.array(z.string().max(2000)).max(500).optional(),
  image: z.string().max(2000).optional(),
  answer: z.string().max(2000).optional(),
  question: z.string().max(2000).optional(),
  options: z.array(z.string().max(500)).max(10).optional(),
});

export const listLessonsSchema = z.object({
  query: z.object({
    language: z.enum(["en", "km"]).optional(),
    level: z.coerce.number().int().min(1).max(20).optional(),
    category: z.string().trim().max(80).optional(),
    type: lessonType.optional(),
  }),
});

export const manageLessonsSchema = z.object({
  query: z.object({
    language: z.enum(["en", "km"]).optional(),
    level: z.coerce.number().int().min(1).max(20).optional(),
    type: lessonType.optional(),
    difficulty: difficulty.optional(),
    published: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    contentStatus: contentStatus.optional(),
    includeInactive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  }),
});

const lessonFields = z.object({
  title: z.string().trim().min(2).max(160),
  titleKhmer: z.string().trim().max(160).default(""),
  description: z.string().trim().max(500).default(""),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  language: z.enum(["en", "km"]),
  category: z.string().trim().min(2).max(80),
  level: z.number().int().min(1).max(20),
  order: z.number().int().min(1),
  difficulty,
  type: lessonType,
  instructions: z.string().max(2000).default(""),
  contentItems: z.array(z.string().max(2000)).max(500).default([]),
  contentBlocks: z.array(contentBlock).min(1).max(100),
  minimumAccuracy: z.number().min(0).max(100).default(70),
  minimumSpeed: z.number().min(0).default(0),
  timeLimit: z.number().int().min(0).max(36000).default(0),
  starsEnabled: z.boolean().default(true),
  allowBackspace: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  prerequisiteLesson: objectId.nullable().optional(),
  isPublished: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sourceBook: z.string().max(300).default(""),
  sourcePage: z.number().int().min(1).optional(),
  sourceExercise: z.string().max(300).default(""),
  contentStatus: contentStatus.default("custom"),
  reviewNotes: z.string().max(2000).default(""),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const createLessonSchema = z.object({ body: lessonFields });
export const updateLessonSchema = z.object({ body: lessonFields.partial().refine((value) => Object.keys(value).length > 0) });
export const reorderLessonsSchema = z.object({ body: z.object({ items: z.array(z.object({ id: objectId, order: z.number().int().min(1), level: z.number().int().min(1).max(20).optional(), category: z.string().max(80).optional() })).min(1).max(500) }) });
