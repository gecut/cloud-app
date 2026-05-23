import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { mockGetServiceById, mockListServiceEndpoints } from "@/modules/services/_mock/services.mock";
import { ServicesErrorState } from "@/modules/services/states/services-error-state";
import { ServicesPageSkeleton } from "@/modules/services/skeletons/services-page-skeleton";

interface ServiceDetailPageProps {
  id: string;
}

export function ServiceDetailPage({ id }: ServiceDetailPageProps) {
  const serviceQuery = useQuery({ queryKey: ["services", "detail", id], queryFn: () => mockGetServiceById(id) });
  const endpointsQuery = useQuery({
    queryKey: ["services", "detail", id, "endpoints"],
    queryFn: () => mockListServiceEndpoints(id),
  });

  if (serviceQuery.isPending || endpointsQuery.isPending) return <ServicesPageSkeleton />;
  if (serviceQuery.isError || endpointsQuery.isError) return <ServicesErrorState />;

  return (
    <main className="space-y-4 p-4 md:p-6">
      <Card className="p-4" variant="secondary">
        <h1 className="text-lg font-semibold">{serviceQuery.data.name}</h1>
        <p className="text-sm opacity-80 mt-2">{serviceQuery.data.description ?? "-"}</p>
      </Card>
      <Card className="p-4" variant="secondary">
        <h2 className="text-sm font-medium mb-3">Endpointها</h2>
        <div className="space-y-2">
          {endpointsQuery.data.map((endpoint) => (
            <div key={endpoint.id} className="text-sm flex items-center justify-between gap-3">
              <span className="truncate">{endpoint.url}</span>
              <span className="text-xs opacity-70">{endpoint.status}</span>
            </div>
          ))}
          {!endpointsQuery.data.length ? <p className="text-sm opacity-70">هنوز endpoint عمومی ثبت نشده است.</p> : null}
        </div>
      </Card>
    </main>
  );
}
