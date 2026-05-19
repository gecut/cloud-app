import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGINS: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SESSION_SECRET: z.string().min(32),
    SESSION_COOKIE_NAME: z.string().min(1).default("gecut_session"),
    SESSION_TTL_SECONDS: z.coerce.number().int().min(300).default(604800),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
