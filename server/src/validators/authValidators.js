import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(64),
    password: z.string().min(8).max(128),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(32).optional(),
  }),
});

export const logoutSchema = refreshSchema;
