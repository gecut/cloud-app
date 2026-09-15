import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/app/components/layout/app-layout";
import { validateSession } from "@/lib/api-client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const isValid = await validateSession();
    if (!isValid) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
