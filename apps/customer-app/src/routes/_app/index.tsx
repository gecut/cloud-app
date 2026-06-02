import { createFileRoute } from "@tanstack/react-router";
import { dataTypes } from "./data";
import { ServicesSlider } from "@/app/components/pages/dashboard/banner";
import { DashboardList } from "@/app/components/pages/dashboard/dashboard-list";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

export function DashboardPage() {
  return (
    <div className="w-full flex flex-col gap-2">
      <ServicesSlider />
      <h2 className="text-xl font-medium py-1 px-4">داشبورد</h2>
      <DashboardList data={dataTypes.services} />
    </div>
  );
}
