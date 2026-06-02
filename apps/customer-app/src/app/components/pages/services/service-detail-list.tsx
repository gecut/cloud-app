import { Service } from "@/routes/_app/data";
import { ServiceDetailCard } from "./service-detail-card";

interface ServiceDetailListProps {
  data: Service[];
  showIcon?: boolean;
}

export function ServiceDetailList({
  data,
  showIcon = true,
}: ServiceDetailListProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {data.map((service) => (
        <ServiceDetailCard
          key={service.id}
          data={service}
          showIcon={showIcon}
        />
      ))}
    </div>
  );
}
