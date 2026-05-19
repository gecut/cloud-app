import {
  changePasswordInputSchema,
  loginInputSchema,
  loginOutputSchema,
  meOutputSchema,
} from "@gecut-cloud/contracts";
import { changePassword, loginWithPhonePassword } from "@gecut-cloud/core";
import { deleteCookie, setCookie } from "hono/cookie";

import { env } from "@gecut-cloud/env/server";

import { publicProcedure } from "../index";
import { requireAuth } from "../procedures/guards";
import { withErrorHandling } from "../procedures/errors";

export const authRouter = {
  login: publicProcedure
    .input(loginInputSchema)
    .output(loginOutputSchema)
    .handler(
      withErrorHandling(async ({ input, context }) => {
        const result = await loginWithPhonePassword(input.phone, input.password);

        setCookie(context.hono, env.SESSION_COOKIE_NAME, result.token, {
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
          secure: env.NODE_ENV === "production",
          maxAge: env.SESSION_TTL_SECONDS,
        });

        return {
          user: result.user,
        };
      }),
    ),
  logout: publicProcedure.handler(
    withErrorHandling(async ({ context }) => {
      deleteCookie(context.hono, env.SESSION_COOKIE_NAME, {
        path: "/",
      });

      return { success: true };
    }),
  ),
  me: publicProcedure.output(meOutputSchema).handler(
    withErrorHandling(async ({ context }) => {
      if (!context.session || !context.user) {
        return {
          isAuthenticated: false,
        };
      }

      return {
        isAuthenticated: true,
        user: context.user,
      };
    }),
  ),
  changePassword: publicProcedure
    .input(changePasswordInputSchema)
    .handler(
      withErrorHandling(async ({ input, context }) => {
        const auth = requireAuth(context);

        await changePassword(auth.session.userId, input.currentPassword, input.newPassword);

        deleteCookie(context.hono, env.SESSION_COOKIE_NAME, {
          path: "/",
        });

        return {
          success: true,
        };
      }),
    ),
};
