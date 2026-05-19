import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
  component: PublicLayoutRoute,
});

function PublicLayoutRoute() {
  return (
    <div className="flex min-h-svh max-w-md mx-auto flex-col">
      <Outlet />
    </div>
  );
}
