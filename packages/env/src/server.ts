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
    KAVENEGAR_API_KEY: z.string().optional(),
    ZIBAL_MERCHANT: z.string().default("zibal"),
    ZIBAL_CALLBACK_URL: z.string().optional(),
    SERVER_URL: z.string().default("https://api.app.gecut.ir"),
    CUSTOMER_APP_URL: z.string().default("https://app.gecut.ir"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
