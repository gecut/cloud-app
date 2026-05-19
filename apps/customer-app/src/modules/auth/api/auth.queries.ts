import type { RouterAppContext } from "@/routes/__root";

export function meQueryOptions(context: Pick<RouterAppContext, "orpc">) {
  return context.orpc.auth.me.queryOptions();
}
