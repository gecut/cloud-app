import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/modules/dashboard/views/dashboard-page";

export const Route = createFileRoute("/_app/")({
  component: CustomerDashboardRoute,
});

function CustomerDashboardRoute() {
  const routeContext = Route.useRouteContext();

  return <DashboardPage routeContext={routeContext} />;
}
