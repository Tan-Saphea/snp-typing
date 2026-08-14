import { z } from "zod";

const lessonType = z.enum(["letter", "word", "sentence", "paragraph", "story", "test", "game", "computer-skill"]);

export const listLessonsSchema = z.object({
  query: z.object({
    language: z.enum(["en", "km"]).optional(),
    level: z.coerce.number().int().min(1).max(20).optional(),
    category: z.string().trim().max(80).optional(),
    type: lessonType.optional(),
  }),
});
