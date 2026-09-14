import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/test/$id")({
  component: TestDetailRoute,
});

function TestDetailRoute() {
  const { id } = Route.useParams();

  return <h1>Test Of {id}</h1>;
}
