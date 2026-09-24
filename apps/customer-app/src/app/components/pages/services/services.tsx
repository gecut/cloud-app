import { useMemo } from "react";
import { Tabs } from "@heroui/react";
import { ServerSquareCloud, Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { HeartPulse } from "@solar-icons/react-perf/category/medicine/BoldDuotone";
import { LinkRound } from "@solar-icons/react-perf/category/text-formatting/BoldDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { ChatRoundDots } from "@solar-icons/react-perf/category/messages/BoldDuotone";
import { HeadphonesRound } from "@solar-icons/react-perf/category/devices/BoldDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/BoldDuotone";
import { Widget5Linear } from "@solar-icons/react-perf";
import { useQuery } from "@tanstack/react-query";

import { Service } from "@/app/data";
import { ServiceDetailList } from "./service-detail-list";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";

const FALLBACK_CATEGORIES = [
  { id: "domain", slug: "domain", name: "دامنه" },
  { id: "hosting", slug: "hosting", name: "هاست" },
  { id: "server", slug: "server", name: "سرور" },
  { id: "sms", slug: "sms", name: "پنل پیامکی" },
  { id: "support", slug: "support", name: "پشتیبانی متنی" },
  { id: "image", slug: "image", name: "تصویر" },
  { id: "other", slug: "other", name: "سایر" },
];

function getCategoryIcon(slug?: string, name?: string) {
  const s = (slug || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (s.includes("domain") || n.includes("دامنه")) return <LinkRound size={24} />;
  if (s.includes("server") || n.includes("سرور")) return <Server2 size={24} />;
  if (s.includes("host") || n.includes("هاست") || n.includes("میزبانی")) {
    return <ServerSquareCloud size={24} className="*:stroke-1" />;
  }
  if (s.includes("sms") || n.includes("پیامک")) return <ChatRoundDots size={24} />;
  if (s.includes("support") || n.includes("پشتیبانی")) return <HeadphonesRound size={24} />;
  if (s.includes("image") || n.includes("تصویر") || n.includes("عکس")) return <GalleryWide size={24} />;
  if (s.includes("package") || n.includes("پکیج") || n.includes("بسته")) return <HeartPulse size={24} />;
  return <Widget5Linear size={24} className="*:stroke-1" />;
}

function isServiceInCat(svc: Service, cat: any) {
  const catId = String(cat.id || "").toLowerCase().trim();
  const catSlug = String(cat.slug || "").toLowerCase().trim();
  const catName = String(cat.name || "").toLowerCase().trim();

  const sTypeId = String(svc.serviceType?.id || "").toLowerCase().trim();
  const sTypeSlug = String(svc.serviceType?.slug || "").toLowerCase().trim();
  const sTypeName = String(svc.serviceType?.name || "").toLowerCase().trim();
  const sName = String(svc.name || "").toLowerCase().trim();

  // 1. Direct ID match
  if (catId && sTypeId === catId) return true;
  // 2. Direct Slug match
  if (catSlug && (sTypeSlug === catSlug || catSlug.includes(sTypeSlug) || sTypeSlug.includes(catSlug))) return true;
  // 3. Direct Name match
  if (catName && (sTypeName === catName || sTypeName.includes(catName) || catName.includes(sTypeName))) return true;

  // 4. Standard semantic heuristics
  if (catSlug === "domain" && (sTypeName.includes("دامنه") || sName.includes("دامنه"))) return true;
  if (catSlug === "hosting" && (sTypeName.includes("هاست") || sName.includes("هاست") || sTypeName.includes("میزبانی"))) return true;
  if (catSlug === "server" && (sTypeName.includes("سرور") || sName.includes("سرور") || sName.includes("vps"))) return true;
  if (catSlug === "sms" && (sTypeName.includes("پیامک") || sName.includes("پیامک") || sName.includes("sms"))) return true;
  if (catSlug === "support" && (sTypeName.includes("پشتیبانی") || sName.includes("پشتیبانی"))) return true;
  if (catSlug === "image" && (sTypeName.includes("تصویر") || sName.includes("تصویر") || sName.includes("عکس"))) return true;
  if (catSlug === "other" && (sTypeName.includes("سایر") || sTypeName.includes("متفرقه"))) return true;

  return false;
}

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
        `/services${queryParam ? `?${queryParam}&` : "?"}limit=100`,
      );
    },
    enabled: true,
  });

  const { data: apiInvoices } = useQuery({
    queryKey: ["customer", "invoices", activeUser?.id, activeUser?.customerId],
    queryFn: () => {
      const queryParam = activeUser?.customerId
        ? `customerId=${activeUser.customerId}`
        : activeUser?.id
        ? `customerId=${activeUser.id}`
        : "";
      return apiClient<{ items: any[]; total: number }>(
        `/invoices${queryParam ? `?${queryParam}&` : "?"}limit=100`,
      );
    },
    enabled: true,
  });

  const { data: apiCategories } = useQuery({
    queryKey: ["customer", "categories"],
    queryFn: () => apiClient<{ items: any[] }>("/categories"),
  });
  const dynamicCategories: any[] = apiCategories?.items || [];

  const activeCategories = useMemo(() => {
    if (dynamicCategories.length > 0) {
      return dynamicCategories.filter((c: any) => c.isActive !== false);
    }
    return FALLBACK_CATEGORIES;
  }, [dynamicCategories]);

  // Map real backend services without any fake mock fallbacks (newest first)
  const sortedRawServices = [...(apiServices?.items || [])].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.purchaseDate || a.startDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.purchaseDate || b.startDate || 0).getTime();
    return timeB - timeA;
  });

  const allServices: Service[] = sortedRawServices.map((item: any, idx: number) => {
    const matchedCategory = dynamicCategories.find(
      (c: any) =>
        c.id === item.serviceTypeId ||
        c.slug === item.serviceType?.slug ||
        c.id === item.serviceType?.id ||
        c.slug === item.serviceTypeSlug ||
        c.id === item.parentService?.serviceTypeId ||
        c.slug === item.parentService?.serviceType?.slug ||
        (item.serviceTypeSnapshot && (c.name === item.serviceTypeSnapshot || c.slug === item.serviceTypeSnapshot))
    );

    const actualCategoryName =
      matchedCategory?.name ||
      item.serviceType?.name ||
      item.parentService?.serviceType?.name ||
      item.serviceTypeSnapshot ||
      "سایر";

    const catSlug = (
      matchedCategory?.slug ||
      item.serviceType?.slug ||
      item.parentService?.serviceType?.slug ||
      item.serviceTypeSlug ||
      "other"
    ).toLowerCase();

    const trackingType = (item.trackingType || "HYBRID").toUpperCase() as "HYBRID" | "TIME" | "QUANTITY";

    const totalQty = Number(item.quantity) || 1;
    const usedQty = Number(item.usedQuantity) || 0;
    const remainedQty = Math.max(0, totalQty - usedQty);

    const svcInvoices = (apiInvoices?.items || []).filter((inv: any) =>
      inv.items?.some((it: any) => it.serviceId === item.id)
    );
    const hasUnpaid = svcInvoices.some((inv: any) => inv.status === "UNPAID");
    const paymentStatus: "PAID" | "UNPAID" = hasUnpaid ? "UNPAID" : "PAID";

    const renewal = item.renewalDate ? new Date(item.renewalDate) : null;
    const isDateValid = !renewal || renewal.getTime() >= Date.now();
    const hasRemainingQuota = remainedQty > 0;

    let effectiveStatus = (item.status || "ACTIVE") as Service["status"];
    if (isDateValid && hasRemainingQuota && effectiveStatus === "INACTIVE") {
      effectiveStatus = "ACTIVE";
    }

    return {
      id: item.id || `svc_${idx}`,
      type: catSlug,
      name: item.name || actualCategoryName,
      description: item.description || actualCategoryName,
      status: effectiveStatus,
      priceToman: Number(item.priceToman ?? item.price ?? 0),
      trackingType,
      quantity: totalQty,
      usedQuantity: usedQty,
      remainedQuantity: remainedQty,
      billingCycle: item.billingCycle || "MONTHLY",
      autoRenew: item.autoRenew !== false,
      paymentStatus,
      startDate: item.startDate ? new Date(item.startDate) : new Date(),
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      renewalDate: item.renewalDate
        ? new Date(item.renewalDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      serviceType: {
        id: matchedCategory?.id || item.serviceType?.id || item.serviceTypeId || "srv_type",
        name: actualCategoryName,
        slug: catSlug,
      },
    };
  });

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
    ...activeCategories.map((cat: any) => {
      const catServices = allServices.filter((s) => isServiceInCat(s, cat));
      return {
        id: cat.slug || cat.id,
        label: cat.name,
        icon: getCategoryIcon(cat.slug, cat.name),
        content: (
          <ServiceDetailList
            data={catServices}
            emptyTitle={`هیچ موردی در دسته «${cat.name}» ثبت نشده است`}
            emptyDescription={`در حال حاضر هیچ سرویسی در دسته ${cat.name} برای حساب شما فعال نیست.`}
          />
        ),
      };
    }),
  ];

  return (
    <Tabs defaultSelectedKey="all" className="mx-auto w-full">
      <Tabs.ListContainer>
        <Tabs.List
          aria-label="Services Tabs"
          className="flex gap-4 bg-surface h-20 p-2 rounded-2xl overflow-x-auto flex-nowrap"
        >
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              id={tab.id}
              className="relative px-8 flex h-full min-w-[76px] flex-1 flex-col items-center justify-center rounded-xl text-sm shrink-0 px-2"
            >
              {tab.icon}
              <span className="text-xs whitespace-nowrap">{tab.label}</span>
              <Tabs.Indicator className="bg-accent px-4 rounded-xl" />
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
