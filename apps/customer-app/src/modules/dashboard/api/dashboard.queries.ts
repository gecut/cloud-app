import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./dashboard.keys";

import type { RouterAppContext } from "@/routes/__root";

export function useMyServicesQuery(context: Pick<RouterAppContext, "orpc">) {
  return useQuery(
    context.orpc.customer.services.listMyServices.queryOptions({
      queryKey: dashboardKeys.myServices(),
    })
  );
}
