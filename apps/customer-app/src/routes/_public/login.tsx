import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/modules/auth/views/login-page";

export const Route = createFileRoute("/_public/login")({
  component: CustomerLoginRoute,
});

function CustomerLoginRoute() {
  return <LoginPage />;
}
