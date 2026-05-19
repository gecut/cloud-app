import { createFileRoute } from "@tanstack/react-router";

import { PaymentsListPage } from "@/modules/payments/views/payments-list-page";

export const Route = createFileRoute("/_app/payments/")({
  component: CustomerPaymentsListRoute,
});

function CustomerPaymentsListRoute() {
  return <PaymentsListPage />;
}
