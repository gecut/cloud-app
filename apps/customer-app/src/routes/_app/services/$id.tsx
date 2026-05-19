import { createFileRoute } from "@tanstack/react-router";

import { ServiceDetailPage } from "@/modules/services/views/service-detail-page";

export const Route = createFileRoute("/_app/services/$id")({
  component: CustomerServiceDetailRoute,
});

function CustomerServiceDetailRoute() {
  return <ServiceDetailPage />;
}
