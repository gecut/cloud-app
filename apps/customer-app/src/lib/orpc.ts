import type { AppRouterClient } from "@gecut-cloud/api/routers/index";
import { env } from "@gecut-cloud/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { toast } from "@heroui/react";
import { QueryCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.danger("Request failed", {
        actionProps: {
          children: "Retry",
          onPress: query.invalidate,
          variant: "tertiary",
        },
        description: error.message,
      });
    },
  }),
});

export const link = new RPCLink({
  url: `${env.VITE_SERVER_URL}/rpc`,
  fetch: (input, init) => {
    return fetch(input, {
      ...init,
      credentials: "include",
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
