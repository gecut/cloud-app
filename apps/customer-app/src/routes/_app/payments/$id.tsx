import { createFileRoute } from "@tanstack/react-router";

import { PaymentDetailPage } from "@/modules/payments/views/payment-detail-page";

export const Route = createFileRoute("/_app/payments/$id")({
  component: CustomerPaymentDetailRoute,
});

function CustomerPaymentDetailRoute() {
  return <PaymentDetailPage />;
}
