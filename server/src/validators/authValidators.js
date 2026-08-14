import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(64),
    password: z.string().min(8).max(128),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(80, "Use no more than 80 characters."),
    lastName: z.string().trim().max(80).optional().default(""),
    khmerName: z.string().trim().max(160).optional().default(""),
    gender: z.enum(["female", "male", "other", "unspecified"]).optional().default("unspecified"),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Use at least 3 characters.")
      .max(64, "Use no more than 64 characters.")
      .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, numbers, dots, underscores, or hyphens."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use no more than 128 characters.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(32).optional(),
  }),
});

export const logoutSchema = refreshSchema;
