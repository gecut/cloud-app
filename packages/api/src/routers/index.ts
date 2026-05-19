import type { RouterClient } from "@orpc/server";

import { adminRouter } from "./admin/index";
import { authRouter } from "./auth";
import { customerRouter } from "./customer/index";
import { publicRouter } from "./public";
import { systemRouter } from "./system/index";

export const appRouter = {
  public: publicRouter,
  auth: authRouter,
  admin: adminRouter,
  customer: customerRouter,
  system: systemRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
