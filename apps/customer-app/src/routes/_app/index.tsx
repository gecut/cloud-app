import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: DashboardRoute,
});

async function DashboardRoute() {
  return <h1>DashBoard</h1>
}
