import { Button, Card } from "@heroui/react";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

import { mockGetInvoiceById } from "@/modules/invoices/_mock/invoices.mock";
import { mockGetInvoicePaymentStatus, mockSimulatePayInvoice } from "@/modules/payments/_mock/payments.mock";
import { PaymentsErrorState } from "@/modules/payments/states/payments-error-state";
import { PaymentsPageSkeleton } from "@/modules/payments/skeletons/payments-page-skeleton";

interface PaymentDetailPageProps {
  id: string;
  queryClient: QueryClient;
}

export function PaymentDetailPage({ id, queryClient }: PaymentDetailPageProps) {
  const invoiceQuery = useQuery({ queryKey: ["invoices", "detail", id], queryFn: () => mockGetInvoiceById(id) });
  const paymentStatusQuery = useQuery({
    queryKey: ["payments", "detail", id],
    queryFn: () => mockGetInvoicePaymentStatus(id),
  });

  const simulatePayMutation = useMutation({
    mutationFn: mockSimulatePayInvoice,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices", "detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["payments", "detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["payments", "list"] }),
      ]);
    },
  });

  if (invoiceQuery.isPending || paymentStatusQuery.isPending) return <PaymentsPageSkeleton />;
  if (invoiceQuery.isError || paymentStatusQuery.isError) return <PaymentsErrorState />;

  return (
    <main className="space-y-4 p-4 md:p-6">
      <Card className="p-4" variant="secondary">
        <h1 className="text-lg font-semibold">{invoiceQuery.data.invoiceNumber}</h1>
        <p className="text-sm mt-1 opacity-70">وضعیت پرداخت: {paymentStatusQuery.data.status}</p>
      </Card>
      <Card className="p-4" variant="secondary">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">مبلغ</span>
          <strong>{invoiceQuery.data.amountToman.toLocaleString("fa-IR")} تومان</strong>
        </div>
        <Button
          className="mt-4"
          isDisabled={simulatePayMutation.isPending || paymentStatusQuery.data.status === "PAID"}
          onPress={() => {
            simulatePayMutation.mutate({
              invoiceId: id,
              provider: "zarinpal",
              gatewayRef: `MOCK-${Date.now()}`,
              amountToman: invoiceQuery.data.amountToman,
            });
          }}
        >
          {simulatePayMutation.isPending ? "در حال پردازش..." : "پرداخت آزمایشی"}
        </Button>
      </Card>
    </main>
  );
}
