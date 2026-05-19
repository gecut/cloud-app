import { createFileRoute } from "@tanstack/react-router";

import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/endpoints/")({
  component: AdminUendpointsListPage,
});

function AdminUendpointsListPage() {
  return (
    <AppShell header={<AdminHeader />}>
      <div>Hello World</div>
    </AppShell>
  );
}
