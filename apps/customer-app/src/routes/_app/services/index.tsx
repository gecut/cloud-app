import { TopTabs } from "@/modules/services/views/top-tabs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/")({
  component: CustomerServicesListRoute,
});

function CustomerServicesListRoute() {
  return (
    <div className="w-full">
      <TopTabs />
    </div>
  );
}
