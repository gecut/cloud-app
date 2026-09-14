import { Services } from "@/app/components/pages/services/services";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/")({
  component: ServiceListRoute,
});

function ServiceListRoute() {
  return (
    <div className="w-full flex flex-col gap-4 mt-4 items-stretch">
      <h1 className="text-xl  px-4">سرویس ها</h1>
      <div className="w-full">
        <Services />
      </div>
    </div>
  );
}
