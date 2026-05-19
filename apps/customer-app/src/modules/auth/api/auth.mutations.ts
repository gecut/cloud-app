import type { RouterAppContext } from "@/routes/__root";
import { authKeys } from "@/modules/auth/api/auth.keys";

export function loginMutationOptions(context: Pick<RouterAppContext, "orpc" | "queryClient">) {
  return context.orpc.auth.login.mutationOptions({
    onSuccess: async () => {
      await context.queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
