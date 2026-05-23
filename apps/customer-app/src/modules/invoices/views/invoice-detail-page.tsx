import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { mockGetInvoiceById, mockGetInvoiceItems } from "@/modules/invoices/_mock/invoices.mock";
import { InvoicesErrorState } from "@/modules/invoices/states/invoices-error-state";
import { InvoicesPageSkeleton } from "@/modules/invoices/skeletons/invoices-page-skeleton";

interface InvoiceDetailPageProps {
  id: string;
}

export function InvoiceDetailPage({ id }: InvoiceDetailPageProps) {
  const invoiceQuery = useQuery({ queryKey: ["invoices", "detail", id], queryFn: () => mockGetInvoiceById(id) });
  const itemsQuery = useQuery({ queryKey: ["invoices", "detail", id, "items"], queryFn: () => mockGetInvoiceItems(id) });

  if (invoiceQuery.isPending || itemsQuery.isPending) return <InvoicesPageSkeleton />;
  if (invoiceQuery.isError || itemsQuery.isError) return <InvoicesErrorState />;

  return (
    <main className="space-y-4 p-4 md:p-6">
      <Card className="p-4" variant="secondary">
        <h1 className="text-lg font-semibold">{invoiceQuery.data.invoiceNumber}</h1>
        <p className="text-sm opacity-70 mt-1">وضعیت: {invoiceQuery.data.status}</p>
      </Card>
      <Card className="p-4" variant="secondary">
        <h2 className="text-sm font-medium mb-3">آیتم‌ها</h2>
        <div className="space-y-2">
          {itemsQuery.data.map((item) => (
            <div key={item.id} className="text-sm flex items-center justify-between gap-3">
              <span>{item.title}</span>
              <span>{item.amountToman.toLocaleString("fa-IR")} تومان</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
