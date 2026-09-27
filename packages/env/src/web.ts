import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().url().default("https://api.app.gecut.ir"),
  },
  runtimeEnv: {
    VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
  },
  emptyStringAsUndefined: true,
});
