import { Tabs } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { HeartPulse } from "@solar-icons/react-perf/category/medicine/BoldDuotone";
import { LinkRound } from "@solar-icons/react-perf/category/text-formatting/BoldDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { useQuery } from "@tanstack/react-query";

import { Service, ServiceType } from "@/app/data";
import { ServiceDetailList } from "./service-detail-list";
import { SubscriptionList } from "./subscription/subscription-list";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";

export function Services() {
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
        `/services${queryParam ? `?${queryParam}&` : "?"}limit=50`,
      );
    },
    enabled: !!(activeUser?.id || activeUser?.customerId),
  });

  // Map real backend services without any fake mock fallbacks
  const allServices: Service[] = (apiServices?.items || []).map((item: any, idx: number) => {
    const typeName = item.serviceType?.name || item.name || "سرویس ابری";
    const slug = (item.serviceType?.slug || "").toLowerCase();
    const lowerCombined = (typeName + " " + slug + " " + (item.name || "")).toLowerCase();
    const isPackage = slug === "package" || item.quantity;

    let detectedType: ServiceType = "SERVICE";
    if (isPackage) {
      detectedType = "PACKAGE";
    } else if (lowerCombined.includes("domain") || lowerCombined.includes("دامنه")) {
      detectedType = "DOMAIN";
    } else if (
      lowerCombined.includes("server") ||
      lowerCombined.includes("سرور") ||
      lowerCombined.includes("hosting") ||
      lowerCombined.includes("هاست") ||
      lowerCombined.includes("میزبانی") ||
      lowerCombined.includes("vps")
    ) {
      detectedType = "SERVER";
    }

    return {
      id: item.id || `svc_${idx}`,
      type: detectedType,
      name: item.name || item.serviceType?.name || "سرویس ابری",
      description: item.description || item.serviceType?.name || "سرویس فعال زیرساخت ابری جیکات",
      status: (item.status || "ACTIVE") as Service["status"],
      priceToman: Number(item.priceToman ?? item.price ?? 0),
      quantity: item.quantity ? Number(item.quantity) : undefined,
      remainedQuantity: item.quantity ? Number(item.quantity) : undefined,
      billingCycle: item.billingCycle || "MONTHLY",
      autoRenew: item.autoRenew !== false,
      startDate: item.startDate ? new Date(item.startDate) : new Date(),
      renewalDate: item.renewalDate
        ? new Date(item.renewalDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      serviceType: {
        id: item.serviceType?.id || item.serviceTypeId || "srv_type",
        name: item.name || item.serviceType?.name || "سرویس ابری",
        slug: item.serviceType?.slug,
      },
    };
  });

  const cloudServices = allServices.filter((s) => s.type === "SERVICE");
  const domainServices = allServices.filter((s) => s.type === "DOMAIN");
  const hostingServices = allServices.filter((s) => s.type === "SERVER");
  const packageServices = allServices.filter((s) => s.type === "PACKAGE" || (s.quantity && s.quantity > 0));

  const subscriptionsList = packageServices.map((s) => ({
    id: s.id,
    title: s.name,
    subTitle: s.description || `بسته تعدادی (${(s.quantity || 1).toLocaleString("fa-IR")} عدد)`,
    totalVolume: s.quantity || 1,
    remainedVolume: s.remainedQuantity ?? s.quantity ?? 1,
    buyData: s.startDate,
    price: s.priceToman,
  }));

  const tabs = [
    {
      id: "all",
      label: "همه",
      icon: <LayersMinimalistic size={24} />,
      content: (
        <ServiceDetailList
          data={allServices}
          emptyTitle="هنوز سرویسی برای شما تعریف نشده است"
          emptyDescription="به محض ایجاد سرویس توسط مدیریت جیکات، سرویس‌های فعال شما در این قسمت نمایش داده خواهند شد."
        />
      ),
    },
    {
      id: "services",
      label: "سرویس‌ها",
      icon: <ServerSquareCloud size={24} className="*:stroke-1" />,
      content: (
        <ServiceDetailList
          data={cloudServices}
          emptyTitle="هیچ سرویس ابری ثبت نشده است"
          emptyDescription="در حال حاضر هیچ سرویس ابری یا وب‌سرویسی برای حساب شما تعریف نشده است."
        />
      ),
    },
    {
      id: "domains",
      label: "دامنه",
      icon: <LinkRound size={24} />,
      content: (
        <ServiceDetailList
          data={domainServices}
          emptyTitle="هیچ دامنه‌ای ثبت نشده است"
          emptyDescription="در حال حاضر هیچ دامنه فعالی برای حساب شما ثبت نشده است."
        />
      ),
    },
    {
      id: "hosting",
      label: "میزبانی",
      icon: <Server2 size={24} />,
      content: (
        <ServiceDetailList
          data={hostingServices}
          emptyTitle="هیچ سرویس میزبانی یا سروری ثبت نشده است"
          emptyDescription="در حال حاضر هیچ سرور یا هاستینگی برای حساب شما فعال نیست."
        />
      ),
    },
    {
      id: "shares",
      label: "اشتراک و بسته‌ها",
      icon: <HeartPulse size={24} />,
      content: <SubscriptionList data={subscriptionsList} />,
    },
  ];

  return (
    <Tabs defaultSelectedKey="all" className="mx-auto w-full">
      <Tabs.ListContainer>
        <Tabs.List
          aria-label="Services Tabs"
          className="bg-surface h-20 p-2 rounded-2xl"
        >
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              id={tab.id}
              className="relative flex h-full w-full flex-col items-center justify-center rounded-xl text-sm"
            >
              {tab.icon}
              <span className="text-xs whitespace-nowrap">{tab.label}</span>
              <Tabs.Indicator className="bg-accent rounded-xl" />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      {isLoading ? (
        <div className="w-full mt-4 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full p-6 rounded-3xl bg-surface/50 animate-pulse flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/40" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-muted/40 rounded-md" />
                    <div className="h-3 w-20 bg-muted/30 rounded-md" />
                  </div>
                </div>
                <div className="w-16 h-6 rounded-md bg-muted/30" />
              </div>
              <div className="h-2 w-full bg-muted/20 rounded-full mt-2" />
              <div className="h-10 w-full bg-muted/30 rounded-md mt-2" />
            </div>
          ))}
        </div>
      ) : (
        tabs.map((tab) => (
          <Tabs.Panel key={tab.id} id={tab.id} className="w-full p-0 mt-4">
            {tab.content}
          </Tabs.Panel>
        ))
      )}
    </Tabs>
  );
}
