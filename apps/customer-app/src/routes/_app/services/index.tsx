import { createFileRoute } from "@tanstack/react-router";

import { ServicesListPage } from "@/modules/services/views/services-list-page";

export const Route = createFileRoute("/_app/services/")({
  component: CustomerServicesListRoute,
});

function CustomerServicesListRoute() {
  return <ServicesListPage />;
}
