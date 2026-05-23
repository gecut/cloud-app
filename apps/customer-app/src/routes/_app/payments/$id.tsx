import { createFileRoute } from "@tanstack/react-router";

import { PaymentDetailPage } from "@/modules/payments/views/payment-detail-page";

export const Route = createFileRoute("/_app/payments/$id")({
  component: CustomerPaymentDetailRoute,
});

function CustomerPaymentDetailRoute() {
  const routeContext = Route.useRouteContext();
  const { id } = Route.useParams();

  return <PaymentDetailPage id={id} queryClient={routeContext.queryClient} />;
}
