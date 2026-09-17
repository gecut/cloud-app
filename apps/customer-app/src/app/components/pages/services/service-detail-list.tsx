import { Service } from "@/app/data";
import { ServiceDetailCard } from "./service-detail-card";

interface ServiceDetailListProps {
  data: Service[];
  showIcon?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ServiceDetailList({
  data,
  showIcon = true,
  emptyTitle,
  emptyDescription,
}: ServiceDetailListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 rounded-[24px] bg-surface/50 border border-dashed border-border/40 text-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground">
            {emptyTitle || "هیچ سرویسی در این دسته وجود ندارد"}
          </span>
          <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {emptyDescription || "به محض ایجاد سرویس یا اتصال منابع توسط مدیریت، در این بخش نمایش داده خواهد شد."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 mt-6">
      {data.map((service) => (
        <ServiceDetailCard
          key={service.id}
          serviceDetail={service}
          showIcon={showIcon}
        />
      ))}
    </div>
  );
}
