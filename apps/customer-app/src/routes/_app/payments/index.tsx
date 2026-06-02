import { createFileRoute } from "@tanstack/react-router";
import { Payments } from "@/app/components/pages/payments/payments";

export const Route = createFileRoute("/_app/payments/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Payments  />;
}
