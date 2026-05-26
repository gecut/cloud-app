import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/test/")({
  component: TestListRoute,
});

function TestListRoute() {
  return (
    <h1>List of Test</h1>
  );
}
