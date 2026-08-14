import { z } from "zod";

export const leaderboardQuerySchema = z.object({
  query: z.object({
    period: z.enum(["today", "week", "month", "all"]).default("week"),
    category: z.enum(["english-wpm", "khmer-cpm", "accuracy", "score", "stars"]).default("score"),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
