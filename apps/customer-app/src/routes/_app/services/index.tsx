import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/")({
  component: ServiceListRoute,
});

function ServiceListRoute() {
  return (
    <h1>List of Services</h1>
  );
}
