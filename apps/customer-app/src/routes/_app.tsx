import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/app/components/layout/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
