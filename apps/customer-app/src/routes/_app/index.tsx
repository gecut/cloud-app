import { useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "active" | "inactive" | "price-desc" | "price-asc" | "renewal-asc">("newest");

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

  const { data: apiCategories } = useQuery({
    queryKey: ["customer", "categories"],
    queryFn: () => apiClient<{ items: any[] }>("/categories"),
  });
  const dynamicCategories: any[] = apiCategories?.items || [];

  // Map real backend services created by admin, NO fake mock fallback
  const servicesList = useMemo(() => {
    if (!apiServices?.items || apiServices.items.length === 0) return [];

    return apiServices.items.map((item: any, idx: number) => {
      const matchedCategory = dynamicCategories.find(
        (c: any) =>
          c.id === item.serviceTypeId ||
          c.slug === item.serviceType?.slug ||
          c.id === item.serviceType?.id ||
          c.name === item.serviceType?.name ||
          c.id === item.parentService?.serviceTypeId ||
          c.slug === item.parentService?.serviceType?.slug,
      );

      const actualCategoryName =
        matchedCategory?.name ||
        item.serviceType?.name ||
        item.parentService?.serviceType?.name ||
        item.serviceTypeSnapshot ||
        "";

      const catSlug = (
        matchedCategory?.slug ||
        item.serviceType?.slug ||
        item.parentService?.serviceType?.slug ||
        ""
      ).toLowerCase();
      const sName = (item.name || "").toLowerCase();
      const typeName = (actualCategoryName || "").toLowerCase();
      const trackingType = (item.trackingType || "HYBRID").toUpperCase() as "HYBRID" | "TIME" | "QUANTITY";

      let detectedType: ServiceType = "OTHER";
      if (catSlug.includes("domain") || sName.includes("دامنه") || typeName.includes("دامنه")) {
        detectedType = "DOMAIN";
      } else if (
        catSlug.includes("server") ||
        catSlug.includes("host") ||
        sName.includes("سرور") ||
        sName.includes("هاست") ||
        sName.includes("میزبانی") ||
        sName.includes("vps") ||
        typeName.includes("سرور") ||
        typeName.includes("هاست")
      ) {
        detectedType = "SERVER";
      } else if (
        catSlug.includes("package") ||
        trackingType === "QUANTITY" ||
        (trackingType === "HYBRID" && Number(item.quantity) > 1) ||
        sName.includes("بسته") ||
        sName.includes("پکیج")
      ) {
        detectedType = "PACKAGE";
      } else if (
        catSlug.includes("api") ||
        sName.includes("api") ||
        sName.includes("وب‌سرویس")
      ) {
        detectedType = "SERVICE";
      } else {
        detectedType = "OTHER";
      }

      const totalQty = Number(item.quantity) || 1;
      const usedQty = Number(item.usedQuantity) || 0;
      const remainedQty = Math.max(0, totalQty - usedQty);

      const renewal = item.renewalDate ? new Date(item.renewalDate) : null;
      const isDateValid = !renewal || renewal.getTime() >= Date.now();
      const hasRemainingQuota = remainedQty > 0;

      let effectiveStatus = item.status || "ACTIVE";
      if (isDateValid && hasRemainingQuota && effectiveStatus === "INACTIVE") {
        effectiveStatus = "ACTIVE";
      }

      return {
        id: item.id || `svc_${idx}`,
        type: detectedType as any,
        name: item.name || actualCategoryName || "سرویس",
        description: item.description || (actualCategoryName ? `سرویس فعال در دسته‌بندی ${actualCategoryName}` : "سرویس فعال جیکات"),
        status: effectiveStatus,
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
          id: matchedCategory?.id || item.serviceType?.id || item.serviceTypeId || "srv_type",
          name: actualCategoryName,
          slug: catSlug,
        },
      };
    });
  }, [apiServices, dynamicCategories]);

  const activeCount = useMemo(
    () => servicesList.filter((s: any) => s.status === "ACTIVE").length,
    [servicesList],
  );
  const suspendedCount = useMemo(
    () => servicesList.filter((s: any) => s.status !== "ACTIVE").length,
    [servicesList],
  );

  const filteredServices = useMemo(() => {
    return servicesList
      .filter((svc: any) => {
        if (statusFilter === "ACTIVE" && svc.status !== "ACTIVE") {
          return false;
        }
        if (statusFilter === "SUSPENDED" && svc.status === "ACTIVE") {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = svc.name?.toLowerCase().includes(q);
          const matchDesc = svc.description?.toLowerCase().includes(q);
          const matchType = svc.serviceType?.name?.toLowerCase().includes(q);
          return matchName || matchDesc || matchType;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "newest") {
          const tA = new Date(a.createdAt || a.startDate || 0).getTime();
          const tB = new Date(b.createdAt || b.startDate || 0).getTime();
          return tB - tA;
        }
        if (sortBy === "oldest") {
          const tA = new Date(a.createdAt || a.startDate || 0).getTime();
          const tB = new Date(b.createdAt || b.startDate || 0).getTime();
          return tA - tB;
        }
        if (sortBy === "active") {
          if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
          if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
          return 0;
        }
        if (sortBy === "inactive") {
          const isNotActiveA = a.status !== "ACTIVE";
          const isNotActiveB = b.status !== "ACTIVE";
          if (isNotActiveA && !isNotActiveB) return -1;
          if (!isNotActiveA && isNotActiveB) return 1;
          return 0;
        }
        if (sortBy === "price-desc") {
          return (Number(b.priceToman) || 0) - (Number(a.priceToman) || 0);
        }
        if (sortBy === "price-asc") {
          return (Number(a.priceToman) || 0) - (Number(b.priceToman) || 0);
        }
        if (sortBy === "renewal-asc") {
          const rA = new Date(a.renewalDate || 0).getTime();
          const rB = new Date(b.renewalDate || 0).getTime();
          return rA - rB;
        }
        return 0;
      });
  }, [servicesList, statusFilter, searchQuery, sortBy]);

  return (
    <div className="w-full flex flex-col gap-3 animate-entrance">
      <ServicesSlider />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 px-1 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium text-foreground">سرویس‌های من</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-mono">
            {servicesList.length.toLocaleString("fa-IR")}
          </span>
        </div>
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">
            در حال بروزرسانی سرویس‌ها...
          </span>
        )}
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="w-full flex flex-col gap-2.5 p-3 rounded-2xl bg-surface border border-border/40 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، توضیحات یا نوع سرویس..."
              className="w-full h-9 px-3 text-xs rounded-xl border border-border/70 bg-background text-foreground placeholder:text-muted-foreground transition-all focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 text-xs rounded-xl border border-border/70 bg-background text-foreground transition-all focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer"
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="active">اول سرویس‌های فعال</option>
              <option value="inactive">اول سرویس‌های معلق</option>
              <option value="price-desc">بیشترین هزینه</option>
              <option value="price-asc">کمترین هزینه</option>
              <option value="renewal-asc">نزدیک‌ترین زمان تمدید</option>
            </select>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-surface-hover/50 text-muted-foreground hover:text-foreground border border-border/30"
            }`}
          >
            همه ({servicesList.length.toLocaleString("fa-IR")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-surface-hover/50 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            فعال ({activeCount.toLocaleString("fa-IR")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("SUSPENDED")}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              statusFilter === "SUSPENDED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-surface-hover/50 text-amber-600 hover:bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            معلق ({suspendedCount.toLocaleString("fa-IR")})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full p-8 rounded-[20px] bg-surface/40 animate-pulse flex flex-col gap-4">
          <div className="h-6 w-1/3 bg-muted/40 rounded-lg" />
          <div className="h-4 w-1/2 bg-muted/30 rounded-lg" />
          <div className="h-2 w-full bg-muted/20 rounded-full mt-4" />
        </div>
      ) : (
        <DashboardList data={filteredServices} />
      )}
    </div>
  );
}
