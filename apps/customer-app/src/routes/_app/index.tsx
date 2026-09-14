import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dataTypes } from "@/app/data";
import { ServicesSlider } from "@/app/components/pages/dashboard/banner";
import { DashboardList } from "@/app/components/pages/dashboard/dashboard-list";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

export function DashboardPage() {
  const activeUser = getActiveCustomerUser();

  const { data: apiServices, isLoading } = useQuery({
    queryKey: ["customer", "services", activeUser.id],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        `/services?customerId=${activeUser.id}&limit=20`,
      ),
  });

  // Merge or map backend services to UI format, fallback to existing rich data
  const servicesList =
    apiServices?.items && apiServices.items.length > 0
      ? apiServices.items.map((item: any, idx: number) => ({
          id: item.id || `svc_${idx}`,
          type: item.type || "SERVICE",
          name: item.name,
          description: item.description || "سرویس ابری و هاستینگ",
          status: item.status || "ACTIVE",
          priceToman: item.priceToman || 2000000,
          startDate: item.startDate ? new Date(item.startDate) : new Date("2026-01-01"),
          renewalDate: item.renewalDate ? new Date(item.renewalDate) : new Date("2026-12-01"),
          serviceType: {
            id: item.serviceTypeId || "srv_type_1",
            name: item.serviceTypeName || "Cloud Infrastructure",
          },
        }))
      : dataTypes.services;

  return (
    <div className="w-full flex flex-col gap-2">
      <ServicesSlider />
      <div className="flex items-center justify-between py-1 px-4">
        <h2 className="text-xl font-medium">داشبورد و سرویس‌های من</h2>
        {isLoading && <span className="text-xs text-muted-foreground">در حال بروزرسانی...</span>}
      </div>
      <DashboardList data={servicesList} />
    </div>
  );
}

