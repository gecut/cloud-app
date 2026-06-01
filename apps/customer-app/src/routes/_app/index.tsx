import { createFileRoute } from "@tanstack/react-router";
import { dataTypes } from "./data";
import { Services } from "@/app/components/pages/dashboard/services";
import { ServicesSlider } from "@/app/components/pages/dashboard/banner";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

export function DashboardPage() {
  return (
    <div className="w-full flex flex-col gap-2">
      <ServicesSlider />
      <h2 className="text-xl py-1">داشبورد</h2>
      <Services data={dataTypes.services} />
    </div>
  );
}
