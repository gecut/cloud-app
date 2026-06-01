import { TopTabs } from "@/app/components/pages/services/top-tabs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/")({
  component: ServiceListRoute,
});

function ServiceListRoute() {
  return (
    <div className="w-full flex flex-col gap-4 mt-4 items-stretch">
      <h1 className="text-xl">سرویس ها</h1>
      <div className="w-full">
        {" "}
        <TopTabs />
      </div>
    </div>
  );
}
