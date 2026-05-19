import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { PublicHeader } from "@/components/layout/public-header";

export const Route = createFileRoute("/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <AppShell header={<PublicHeader />}>
      <div>Hello World</div>
    </AppShell>
  );
}
