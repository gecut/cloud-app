import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { mockListPaymentAttempts } from "@/modules/payments/_mock/payments.mock";
import { PaymentsEmptyState } from "@/modules/payments/states/payments-empty-state";
import { PaymentsErrorState } from "@/modules/payments/states/payments-error-state";
import { PaymentsPageSkeleton } from "@/modules/payments/skeletons/payments-page-skeleton";

export function PaymentsListPage() {
  const query = useQuery({ queryKey: ["payments", "list"], queryFn: () => mockListPaymentAttempts() });

  if (query.isPending) return <PaymentsPageSkeleton />;
  if (query.isError) return <PaymentsErrorState />;
  if (!query.data.items.length) return <PaymentsEmptyState />;

  return (
    <main className="space-y-3 p-4 md:p-6">
      {query.data.items.map((attempt) => (
        <Card key={attempt.id} className="p-4" variant="secondary">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-medium">{attempt.provider}</h2>
              <p className="text-xs opacity-70 mt-1">{attempt.status}</p>
            </div>
            <span className="font-semibold text-sm">{attempt.amountToman.toLocaleString("fa-IR")} تومان</span>
          </div>
        </Card>
      ))}
    </main>
  );
}
