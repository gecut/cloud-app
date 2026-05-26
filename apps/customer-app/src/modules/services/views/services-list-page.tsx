import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { mockListServices } from "@/modules/services/_mock/services.mock";
import { ServicesEmptyState } from "@/modules/services/states/services-empty-state";
import { ServicesErrorState } from "@/modules/services/states/services-error-state";
import { ServicesPageSkeleton } from "@/modules/services/skeletons/services-page-skeleton";

export function ServicesListPage() {
  const query = useQuery({
    queryKey: ["services", "list"],
    queryFn: () => mockListServices(),
  });

  if (query.isPending) return <ServicesPageSkeleton />;
  if (query.isError) return <ServicesErrorState />;
  if (!query.data.items.length) return <ServicesEmptyState />;

  return (
    <main className="w-fll flex flex-col gap-4">
      {query.data.items.map((service) => (
        <Card key={service.id} className="p-4" variant="secondary">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-medium">{service.name}</h2>
              <p className="text-xs opacity-70 mt-1">
                {service.serviceType.name}
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">
                {service.priceToman.toLocaleString("fa-IR")} تومان
              </p>
              <p className="text-xs opacity-70 mt-1">{service.status}</p>
            </div>
          </div>
        </Card>
      ))}
    </main>
  );
}
