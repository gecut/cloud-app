import { createFileRoute } from "@tanstack/react-router";

import { InvoiceDetailPage } from "@/modules/invoices/views/invoice-detail-page";

export const Route = createFileRoute("/_app/invoices/$id")({
  component: CustomerInvoiceDetailRoute,
});

function CustomerInvoiceDetailRoute() {
  return <InvoiceDetailPage />;
}
