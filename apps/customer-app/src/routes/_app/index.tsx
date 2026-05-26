import { DashboardPage } from "@/modules/dashboard/views/dashboard-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: CustomerDashboardRoute,
});

async function CustomerDashboardRoute() {
  return await (<DashboardPage />);
}
