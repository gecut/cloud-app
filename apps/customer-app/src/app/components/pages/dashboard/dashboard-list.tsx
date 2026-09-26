import { Service } from "@/app/data";
import { DashboardCard } from "./dashboard-card";
import { Factor } from "./factor";
import { useNavigate } from "@tanstack/react-router";

interface DashboardListProps {
  data: Service[];
}

export function DashboardList({ data }: DashboardListProps) {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 rounded-[24px] bg-surface/50 border border-dashed border-border/40 text-center gap-3">
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground">هنوز سرویسی برای شما تعریف نشده است</span>
          <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            به محض تعریف و اتصال سرویس، هاستینگ یا دامنه توسط تیم مدیریت جیکات، مشخصات و وضعیت آنلاین آن در اینجا نمایش داده می‌شود.
          </span>
        </div>
      </div>
    );
  }

  const totalPrice = data.reduce((acc, s) => acc + (Number(s.priceToman) || 0), 0);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
        {data.map((service) => (
          <DashboardCard key={service.id} data={service} />
        ))}
      </div>

      <Factor
        price={totalPrice}
        title="مجموع هزینه سرویس‌ها"
        actionText="مشاهده و پرداخت صورت‌حساب"
        showAction={totalPrice > 0}
        onAction={() => navigate({ to: "/payments" })}
      />
    </div>
  );
}
