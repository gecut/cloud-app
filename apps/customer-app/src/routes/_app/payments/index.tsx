import { createFileRoute } from "@tanstack/react-router";
import { Payments } from "@/app/components/pages/payments/payments";

export const Route = createFileRoute("/_app/payments/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full flex flex-col gap-4 mt-2 items-stretch">
      <h1 className="text-xl px-4">مالی</h1>
      <div className="w-full">
        <Payments />
      </div>
    </div>
  );
}
