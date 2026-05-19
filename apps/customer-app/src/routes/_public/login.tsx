import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/modules/auth/api/auth.queries";
import { LoginPage } from "@/modules/auth/views/login-page";

export const Route = createFileRoute("/_public/login")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions(context)).catch(() => null);

    if (me?.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: CustomerLoginRoute,
});

function CustomerLoginRoute() {
  const routeContext = Route.useRouteContext();

  return <LoginPage routeContext={routeContext} />;
}
