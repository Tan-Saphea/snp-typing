import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

function booleanFromEnvironment(defaultValue) {
  return z.preprocess((value) => {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }

    return value;
  }, z.boolean());
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters."),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters."),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  ALLOW_NULL_ORIGIN: booleanFromEnvironment(false),
  TRUST_PROXY: booleanFromEnvironment(false),
  COOKIE_NAME: z.string().min(1).default("snp_refresh"),
  SEED_ADMIN_PASSWORD: z.string().min(10).optional(),
  SEED_TEACHER_PASSWORD: z.string().min(10).optional(),
  SEED_STUDENT_PASSWORD: z.string().min(10).optional(),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment:\n${issues}`);
}

const parsed = parsedEnvironment.data;

export const env = Object.freeze({
  ...parsed,
  CLIENT_ORIGINS: parsed.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});
