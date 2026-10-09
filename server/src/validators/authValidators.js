import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(64),
    password: z.string().min(6).max(128),
  }),
});

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, "Please enter your name.").max(120).optional(),
      firstName: z.string().trim().max(80).optional(),
      lastName: z.string().trim().max(80).optional().default(""),
      khmerName: z.string().trim().max(160).optional().default(""),
      gender: z.enum(["female", "male", "other", "unspecified"]).optional().default("unspecified"),
      securityQuestion: z
        .string()
        .trim()
        .max(200)
        .optional()
        .default("Recovery Key"),
      securityAnswer: z
        .string()
        .trim()
        .min(2, "Use at least 2 characters for the recovery key.")
        .max(200),
      username: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, "Use at least 3 characters.")
        .max(64, "Use no more than 64 characters.")
        .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, numbers, dots, underscores, or hyphens."),
      password: z
        .string()
        .min(6, "Use at least 6 characters.")
        .max(128, "Use no more than 128 characters."),
    })
    .refine((data) => Boolean(data.name || data.firstName), {
      message: "Please enter your name.",
      path: ["name"],
    }),
});

export const findUsernameSchema = z.object({
  body: z.object({
    query: z.string().trim().optional(),
    firstName: z.string().trim().optional(),
    khmerName: z.string().trim().max(160).optional(),
    lastName: z.string().trim().max(80).optional(),
  }),
});

export const verifyAccountSchema = z.object({
  body: z.object({
    username: z.string().trim().toLowerCase().min(3, "Please enter a valid username."),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    username: z.string().trim().toLowerCase().min(3, "Please enter a valid username."),
    newPassword: z
      .string()
      .min(6, "Use at least 6 characters.")
      .max(128, "Use no more than 128 characters."),
    securityAnswer: z
      .string()
      .trim()
      .min(2, "Enter the recovery key.")
      .max(200),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(32).optional(),
  }),
});

export const logoutSchema = refreshSchema;
