import { createFileRoute } from "@tanstack/react-router";

import { InvoiceDetailPage } from "@/modules/invoices/views/invoice-detail-page";

export const Route = createFileRoute("/_app/invoices/$id")({
  component: CustomerInvoiceDetailRoute,
});

function CustomerInvoiceDetailRoute() {
  const { id } = Route.useParams();

  return <InvoiceDetailPage id={id} />;
}
