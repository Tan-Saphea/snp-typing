import { z } from "zod";

export const createResultSchema = z.object({
  body: z.object({
    lessonId: z.string().regex(/^[a-f\d]{24}$/i),
    startedAt: z.string().datetime(),
    duration: z.number().positive().max(36000),
    totalTyped: z.number().int().min(0).max(20000),
    totalCharacters: z.number().int().min(0).max(20000),
    correctCharacters: z.number().int().min(0).max(20000),
    incorrectCharacters: z.number().int().min(0).max(20000),
    totalGraphemes: z.number().int().min(0).max(20000),
    correctGraphemes: z.number().int().min(0).max(20000),
    incorrectGraphemes: z.number().int().min(0).max(20000),
    errors: z.number().int().min(0).max(20000),
    mode: z.enum(["lesson", "test", "practice", "game"]).default("lesson"),
  }),
});

export const listResultsSchema = z.object({
  query: z.object({
    student: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    class: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    language: z.enum(["en", "km"]).optional(),
    mode: z.enum(["lesson", "test", "practice", "game"]).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  }),
});
