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
    KAVENEGAR_API_KEY: z.string().default("46437751615871547A59364B75376339706E72384266734A596F3476644B653641356171462F557A5747383D"),
    KAVENEGAR_OTP_TEMPLATE: z.string().default("gcotp"),
    ADMIN_JWT_ACCESS_EXPIRATION: z.coerce.number().int().default(86400),
    ADMIN_JWT_REFRESH_EXPIRATION: z.coerce.number().int().default(604800),
    JWT_ACCESS_EXPIRATION: z.coerce.number().int().default(2592000),
    JWT_REFRESH_EXPIRATION: z.coerce.number().int().default(7776000),
    ZIBAL_MERCHANT: z.string().default("zibal"),
    ZIBAL_CALLBACK_URL: z.string().optional(),
    SERVER_URL: z.string().default("https://api.app.gecut.ir"),
    CUSTOMER_APP_URL: z.string().default("https://app.gecut.ir"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
