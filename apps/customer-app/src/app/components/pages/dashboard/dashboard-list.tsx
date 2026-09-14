import { Service } from "@/app/data";
import { DashboardCard } from "./dashboard-card";

interface DashboardListProps {
  data: Service[];
}

export function DashboardList({ data }: DashboardListProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((service) => (
        <DashboardCard key={service.id} data={service} />
      ))}
    </div>
  );
}
