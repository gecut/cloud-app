import { createFileRoute } from "@tanstack/react-router";

import { InvoicesListPage } from "@/modules/invoices/views/invoices-list-page";

export const Route = createFileRoute("/_app/invoices/")({
  component: CustomerInvoicesListRoute,
});

function CustomerInvoicesListRoute() {
  return <InvoicesListPage />;
}
