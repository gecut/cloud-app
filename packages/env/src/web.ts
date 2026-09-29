import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const sanitizeUrl = (val: unknown): string | undefined => {
  if (typeof val !== "string") return undefined;
  const cleaned = val
    .trim()
    .replace(/^[{(["']+|[})\]"']+$/g, "")
    .trim();
  return cleaned || undefined;
};

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().optional().default("http://192.168.43.134:3000"),
  },
  runtimeEnv: {
    VITE_SERVER_URL: sanitizeUrl(import.meta.env.VITE_SERVER_URL),
  },
  emptyStringAsUndefined: true,
});
