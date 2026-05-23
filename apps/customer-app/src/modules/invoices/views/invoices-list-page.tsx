import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { mockListInvoices } from "@/modules/invoices/_mock/invoices.mock";
import { InvoicesEmptyState } from "@/modules/invoices/states/invoices-empty-state";
import { InvoicesErrorState } from "@/modules/invoices/states/invoices-error-state";
import { InvoicesPageSkeleton } from "@/modules/invoices/skeletons/invoices-page-skeleton";

export function InvoicesListPage() {
  const query = useQuery({ queryKey: ["invoices", "list"], queryFn: () => mockListInvoices() });

  if (query.isPending) return <InvoicesPageSkeleton />;
  if (query.isError) return <InvoicesErrorState />;
  if (!query.data.items.length) return <InvoicesEmptyState />;

  return (
    <main className="space-y-3 p-4 md:p-6">
      {query.data.items.map((invoice) => (
        <Card key={invoice.id} className="p-4" variant="secondary">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-medium">{invoice.invoiceNumber}</h2>
              <p className="text-xs opacity-70 mt-1">{invoice.status}</p>
            </div>
            <span className="font-semibold text-sm">{invoice.amountToman.toLocaleString("fa-IR")} تومان</span>
          </div>
        </Card>
      ))}
    </main>
  );
}
