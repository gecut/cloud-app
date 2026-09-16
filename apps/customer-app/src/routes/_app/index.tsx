import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ServicesSlider } from "@/app/components/pages/dashboard/banner";
import { DashboardList } from "@/app/components/pages/dashboard/dashboard-list";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";
import { ServiceType } from "@/app/data";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

export function DashboardPage() {
  const activeUser = getActiveCustomerUser();

  const { data: apiServices, isLoading } = useQuery({
    queryKey: ["customer", "services", activeUser?.id, activeUser?.customerId],
    queryFn: () => {
      const queryParam = activeUser?.customerId
        ? `customerId=${activeUser.customerId}`
        : activeUser?.id
        ? `customerId=${activeUser.id}`
        : "";
      return apiClient<{ items: any[]; total: number }>(
        `/services${queryParam ? `?${queryParam}&` : "?"}limit=100`,
      );
    },
    enabled: true,
  });

  // Map real backend services created by admin, NO fake mock fallback
  const servicesList =
    apiServices?.items && apiServices.items.length > 0
      ? apiServices.items.map((item: any, idx: number) => {
          const slug = (item.serviceType?.slug || "").toLowerCase();
          const name = (item.name || "").toLowerCase();
          const typeName = (item.serviceType?.name || "").toLowerCase();
          const trackingType = (item.trackingType || "HYBRID").toUpperCase() as "HYBRID" | "TIME" | "QUANTITY";

          let detectedType: ServiceType = "SERVICE";
          if (slug === "domain" || name.includes("domain") || name.includes("دامنه") || typeName.includes("دامنه")) {
            detectedType = "DOMAIN";
          } else if (
            slug === "server" ||
            slug === "hosting" ||
            name.includes("server") ||
            name.includes("سرور") ||
            name.includes("hosting") ||
            name.includes("هاست") ||
            name.includes("میزبانی") ||
            name.includes("vps") ||
            typeName.includes("سرور") ||
            typeName.includes("هاست")
          ) {
            detectedType = "SERVER";
          } else if (slug === "package" || trackingType === "QUANTITY" || (trackingType === "HYBRID" && Number(item.quantity) > 1)) {
            detectedType = "PACKAGE";
          } else {
            detectedType = "SERVICE";
          }

          const totalQty = Number(item.quantity) || 1;
          const usedQty = Number(item.usedQuantity) || 0;
          const remainedQty = Math.max(0, totalQty - usedQty);

          return {
            id: item.id || `svc_${idx}`,
            type: detectedType as any,
            name: item.name || item.serviceType?.name || "سرویس ابری",
            description: item.description || item.serviceType?.name || "سرویس ابری فعال جیکات",
            status: item.status || "ACTIVE",
            priceToman: Number(item.priceToman ?? item.price ?? 0),
            trackingType,
            quantity: totalQty,
            usedQuantity: usedQty,
            remainedQuantity: remainedQty,
            billingCycle: item.billingCycle || "MONTHLY",
            autoRenew: item.autoRenew !== false,
            startDate: item.startDate ? new Date(item.startDate) : new Date(),
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            renewalDate: item.renewalDate
              ? new Date(item.renewalDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            serviceType: {
              id: item.serviceType?.id || item.serviceTypeId || "srv_type",
              name: item.name || item.serviceType?.name || "سرویس ابری",
              slug: item.serviceType?.slug,
            },
          };
        })
      : [];

  return (
    <div className="w-full flex flex-col gap-2 animate-entrance">
      <ServicesSlider />
      <div className="flex items-center justify-between py-1 px-4">
        <h2 className="text-xl font-medium">سرویس‌های من</h2>
        {isLoading && <span className="text-xs text-muted-foreground animate-pulse">در حال دریافت سرویس‌ها...</span>}
      </div>
      {isLoading ? (
        <div className="w-full p-8 rounded-[20px] bg-surface/40 animate-pulse flex flex-col gap-4">
          <div className="h-6 w-1/3 bg-muted/40 rounded-lg" />
          <div className="h-4 w-1/2 bg-muted/30 rounded-lg" />
          <div className="h-2 w-full bg-muted/20 rounded-full mt-4" />
        </div>
      ) : (
        <DashboardList data={servicesList} />
      )}
    </div>
  );
}

