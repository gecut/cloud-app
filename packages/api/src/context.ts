import { resolveSessionUser, verifySessionToken } from "@gecut-cloud/core";
import type { SessionClaims } from "@gecut-cloud/core";
import { getCookie } from "hono/cookie";
import type { Context as HonoContext } from "hono";

import { env } from "@gecut-cloud/env/server";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const rawToken = getCookie(context, env.SESSION_COOKIE_NAME);
  const session = verifySessionToken(rawToken);

  const user = session ? await resolveSessionUser(session) : null;

  return {
    hono: context,
    session: user ? (session as SessionClaims) : null,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
