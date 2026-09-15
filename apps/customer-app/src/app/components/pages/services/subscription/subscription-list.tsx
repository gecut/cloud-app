import { Subscription } from "@/app/data";
import { SubscriptionCard } from "./subscription-card";

interface SubscriptionListProps {
  data: Subscription[];
}

export function SubscriptionList({ data }: SubscriptionListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 rounded-[24px] bg-surface/50 border border-dashed border-border/40 text-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground">هیچ اشتراک فعالی ثبت نشده است</span>
          <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            در حال حاضر هیچ طرح یا اشتراک تکرارشونده‌ای برای حساب شما فعال نیست.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {data.map((subscription) => (
        <SubscriptionCard key={subscription.title} data={subscription} />
      ))}
    </div>
  );
}
