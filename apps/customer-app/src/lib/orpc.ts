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
