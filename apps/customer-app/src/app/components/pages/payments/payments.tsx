import { useState, useMemo, useEffect } from "react";
import { Tabs, toast } from "@heroui/react";
import { Factor } from "../dashboard/factor";
import { Documents } from "@solar-icons/react-perf/category/notes/Linear";
import { CardTransfer } from "@solar-icons/react-perf/category/money/LineDuotone";
import { InvoiceList } from "./payment/invoice-list";
import { Payments as PaymentsType, ServiceType } from "@/app/data";
import { Transactions } from "./transactions/transaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";

function normalizeCustomerSearchText(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

export function Payments() {
  const queryClient = useQueryClient();
  const activeUser = getActiveCustomerUser();
  const [selectedTab, setSelectedTab] = useState<string>("payments");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PAID" | "CANCELLED">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-desc" | "price-asc" | "pending-first">("newest");

  // Handle return from Zibal gateway callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status") || urlParams.get("payment");

    if (status === "success") {
      toast.success("پرداخت آنلاین با موفقیت انجام شد و صورت‌حساب تسویه گردید");
      queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "services"] });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "failed") {
      toast.danger("پرداخت ناموفق بود یا توسط کاربر لغو گردید.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["customer", "invoices", activeUser?.id, activeUser?.customerId],
    queryFn: () => {
      const queryParam = activeUser?.customerId
        ? `customerId=${activeUser.customerId}`
        : activeUser?.id
        ? `customerId=${activeUser.id}`
        : "";
      return apiClient<{ items: any[]; total: number }>(
        `/invoices${queryParam ? `?${queryParam}&` : "?"}limit=50`,
      );
    },
    enabled: true,
  });

  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["customer", "payments", activeUser?.id, activeUser?.customerId],
    queryFn: () => {
      const queryParam = activeUser?.customerId
        ? `customerId=${activeUser.customerId}`
        : activeUser?.id
        ? `customerId=${activeUser.id}`
        : "";
      return apiClient<{ items: any[]; total: number }>(
        `/payments${queryParam ? `?${queryParam}&` : "?"}limit=50`,
      );
    },
    enabled: true,
  });

  const { data: servicesData } = useQuery({
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
    enabled: true,
  });

  const isLoading = isLoadingInvoices || isLoadingPayments;

  const rawInvoicesList = Array.isArray(invoicesData) ? invoicesData : invoicesData?.items || [];
  const rawPaymentsList = Array.isArray(paymentsData) ? paymentsData : paymentsData?.items || [];
  const rawServicesList = (Array.isArray(servicesData) ? servicesData : servicesData?.items || []).filter(
    (s: any) => (!s.childServices || s.childServices.length === 0) && !s.isParent && Boolean(s.customerId),
  );

  // Calculate real unpaid balance from unpaid invoices
  const unpaidTotal = rawInvoicesList
    .filter((inv: any) => String(inv.status).toUpperCase() === "UNPAID")
    .reduce((sum: number, inv: any) => sum + (Number(inv.totalToman) || 0), 0);

  // Calculate total periodic cost of active services (e.g. monthly fees)
  const totalPeriodicCost = rawServicesList
    .filter((s: any) => s.status === "ACTIVE")
    .reduce((sum: number, s: any) => sum + Number(s.priceToman || s.price || 0), 0);

  // Map real backend invoices (newest first)
  const sortedRawInvoices = [...rawInvoicesList].sort((a: any, b: any) => {
    const timeA = new Date(a.issuedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.issuedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const mappedInvoices: PaymentsType[] = sortedRawInvoices.map((inv: any) => {
    const firstItem = inv.items?.[0];
    const categoryName =
      firstItem?.service?.serviceType?.name ||
      firstItem?.serviceTypeSnapshot ||
      "";
    const title = firstItem?.title || inv.invoiceNumber || "صورتحساب خدمات";
    const subTitle =
      inv.items?.length > 1
        ? `شامل ${inv.items.length} ردیف خدمات`
        : categoryName
        ? `دسته‌بندی: ${categoryName}`
        : firstItem?.description || "سرویس فعال";

    const lower = (title + " " + subTitle + " " + categoryName).toLowerCase();
    let type: ServiceType = "OTHER";
    if (lower.includes("domain") || lower.includes("دامنه")) {
      type = "DOMAIN";
    } else if (
      lower.includes("server") ||
      lower.includes("سرور") ||
      lower.includes("hosting") ||
      lower.includes("هاست") ||
      lower.includes("vps")
    ) {
      type = "SERVER";
    } else if (lower.includes("package") || lower.includes("بسته") || lower.includes("پکیج")) {
      type = "PACKAGE";
    } else if (lower.includes("api") || lower.includes("وب‌سرویس")) {
      type = "SERVICE";
    } else {
      type = "OTHER";
    }

    const st = String(inv.status || "").toUpperCase();
    return {
      id: inv.id,
      factorNumber: inv.invoiceNumber || inv.id,
      title,
      subTitle,
      type,
      factorCreated: inv.issuedAt || inv.createdAt,
      volume: inv.items?.length || 1,
      price: Number(inv.totalToman || 0),
      paymentDeadline: inv.dueDate || inv.issuedAt || new Date(),
      status:
        st === "PAID"
          ? "paid"
          : st === "CANCELLED"
          ? "cancelled"
          : "Awaiting payment",
    };
  });

  // Map real backend payments (or paid invoices as fallback) (newest first)
  const sortedRawPayments = [...rawPaymentsList].sort((a: any, b: any) => {
    const timeA = new Date(a.paidAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.paidAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const rawPayments = sortedRawPayments;
  const mappedTransactions: PaymentsType[] = rawPayments.map((pay: any) => {
    const inv = pay.invoice;
    const firstItem = inv?.items?.[0];
    const categoryName =
      firstItem?.service?.serviceType?.name ||
      firstItem?.serviceTypeSnapshot ||
      "";
    const title =
      firstItem?.title ||
      (inv?.invoiceNumber ? `پرداخت فاکتور ${inv.invoiceNumber}` : "پرداخت آنلاین");
    const subTitle = pay.gatewayRef
      ? `کد پیگیری: ${pay.gatewayRef}${categoryName ? ` • ${categoryName}` : ""}`
      : pay.provider
      ? `درگاه ${pay.provider}${categoryName ? ` • ${categoryName}` : ""}`
      : categoryName
      ? `دسته‌بندی: ${categoryName}`
      : "تراکنش بانکی موفق";

    const lower = (title + " " + subTitle + " " + categoryName).toLowerCase();
    let type: ServiceType = "OTHER";
    if (lower.includes("domain") || lower.includes("دامنه")) {
      type = "DOMAIN";
    } else if (
      lower.includes("server") ||
      lower.includes("سرور") ||
      lower.includes("hosting") ||
      lower.includes("هاست")
    ) {
      type = "SERVER";
    } else if (lower.includes("package") || lower.includes("بسته") || lower.includes("پکیج")) {
      type = "PACKAGE";
    } else if (lower.includes("api") || lower.includes("وب‌سرویس")) {
      type = "SERVICE";
    } else {
      type = "OTHER";
    }

    return {
      id: pay.id,
      factorNumber: inv?.invoiceNumber || pay.gatewayRef || pay.id,
      title,
      subTitle,
      type,
      factorCreated: pay.paidAt || pay.createdAt,
      volume: 1,
      price: Number(pay.amountToman || 0),
      paymentDeadline: pay.paidAt || pay.createdAt,
      status: "paid",
    };
  });

  if (mappedTransactions.length === 0) {
    const paidInvoices = mappedInvoices.filter((inv) => inv.status === "paid");
    mappedTransactions.push(...paidInvoices);
  }

  // Include pending payments (unpaid invoices awaiting payment)
  const mappedPendingTransactions: PaymentsType[] = rawInvoicesList
    .filter((inv: any) => inv.status === "UNPAID")
    .map((inv: any) => {
      const firstItem = inv.items?.[0];
      const categoryName =
        firstItem?.service?.serviceType?.name ||
        firstItem?.serviceTypeSnapshot ||
        "";
      const title = firstItem?.title || inv.invoiceNumber || "صورتحساب خدمات";
      const subTitle = `فاکتور معلق ${inv.invoiceNumber || inv.id}${categoryName ? ` • ${categoryName}` : " • در انتظار پرداخت"}`;

      const lower = (title + " " + subTitle + " " + categoryName).toLowerCase();
      let type: ServiceType = "OTHER";
      if (lower.includes("domain") || lower.includes("دامنه")) {
        type = "DOMAIN";
      } else if (
        lower.includes("server") ||
        lower.includes("سرور") ||
        lower.includes("hosting") ||
        lower.includes("هاست") ||
        lower.includes("vps")
      ) {
        type = "SERVER";
      } else if (lower.includes("package") || lower.includes("بسته") || lower.includes("پکیج")) {
        type = "PACKAGE";
      } else if (lower.includes("api") || lower.includes("وب‌سرویس")) {
        type = "SERVICE";
      } else {
        type = "OTHER";
      }

      return {
        id: inv.id,
        factorNumber: inv.invoiceNumber || inv.id,
        title,
        subTitle,
        type,
        factorCreated: inv.issuedAt || inv.createdAt,
        volume: inv.items?.length || 1,
        price: Number(inv.totalToman || 0),
        paymentDeadline: inv.dueDate || inv.issuedAt || new Date(),
        status: "Awaiting payment",
      };
    });

  const allTransactions: PaymentsType[] = [
    ...mappedPendingTransactions,
    ...mappedTransactions,
  ].sort((a, b) => {
    const timeA = new Date(a.factorCreated || 0).getTime();
    const timeB = new Date(b.factorCreated || 0).getTime();
    return timeB - timeA;
  });

  // Payment mutation using backend Zibal gateway
  const payMutation = useMutation({
    mutationFn: async (invoice: PaymentsType) => {
      if (!invoice.id) {
        throw new Error("شناسه فاکتور معتبر نیست");
      }
      return apiClient<{ paymentUrl: string; trackId: number }>("/payments/zibal/request", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoice.id,
          returnUrl: typeof window !== "undefined" ? `${window.location.origin}/payments` : undefined,
        }),
      });
    },
    onSuccess: (data) => {
      if (data?.paymentUrl) {
        toast.info("در حال اتصال و انتقال به درگاه پرداخت زیبال...");
        window.location.href = data.paymentUrl;
      } else {
        toast.danger("آدرس درگاه پرداخت دریافت نشد.");
      }
    },
    onError: (err: any) => {
      toast.danger(err.message || "خطا در برقراری ارتباط با درگاه پرداخت زیبال");
    },
    onSettled: () => {
      setPayingId(null);
    },
  });

  const handlePay = (invoice: PaymentsType) => {
    if (payMutation.isPending) return;
    setPayingId(invoice.id || "current");
    payMutation.mutate(invoice);
  };

  const handlePayFirstUnpaid = () => {
    const firstUnpaid = mappedInvoices.find((inv) => inv.status !== "paid");
    if (firstUnpaid) {
      handlePay(firstUnpaid);
    } else {
      toast.success("تمامی فاکتورهای شما قبلاً پرداخت و تسویه شده‌اند");
    }
  };

  const filterAndSort = (items: PaymentsType[]) => {
    return items
      .filter((item) => {
        if (statusFilter === "PENDING" && item.status !== "Awaiting payment") return false;
        if (statusFilter === "PAID" && item.status !== "paid") return false;
        if (statusFilter === "CANCELLED" && item.status !== "cancelled") return false;

        if (searchQuery.trim()) {
          const q = normalizeCustomerSearchText(searchQuery);
          const matchTitle = normalizeCustomerSearchText(item.title).includes(q);
          const matchSub = normalizeCustomerSearchText(item.subTitle).includes(q);
          const matchNum = normalizeCustomerSearchText(item.factorNumber).includes(q);
          const matchPrice = normalizeCustomerSearchText(item.price).includes(q);
          return matchTitle || matchSub || matchNum || matchPrice;
        }
        return true;
      })
      .sort((a, b) => {
        const getTime = (d: any) => {
          if (!d) return 0;
          const t = new Date(d).getTime();
          return isNaN(t) ? 0 : t;
        };

        if (sortBy === "newest") {
          return getTime(b.factorCreated) - getTime(a.factorCreated);
        }
        if (sortBy === "oldest") {
          return getTime(a.factorCreated) - getTime(b.factorCreated);
        }
        if (sortBy === "price-desc") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "price-asc") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sortBy === "pending-first") {
          if (a.status === "Awaiting payment" && b.status !== "Awaiting payment") return -1;
          if (a.status !== "Awaiting payment" && b.status === "Awaiting payment") return 1;
          return 0;
        }
        return 0;
      });
  };

  const filteredInvoices = useMemo(
    () => filterAndSort(mappedInvoices),
    [mappedInvoices, statusFilter, searchQuery, sortBy],
  );
  const filteredTransactions = useMemo(
    () => filterAndSort(allTransactions),
    [allTransactions, statusFilter, searchQuery, sortBy],
  );

  return (
    <div className="w-full flex flex-col gap-5 p-0">
      <div className="w-full flex flex-col gap-3">
        <Factor
          price={unpaidTotal}
          title={unpaidTotal > 0 ? "مانده فاکتورهای پرداخت نشده" : "مانده بدهی (حساب تسویه شده)"}
          actionText={payingId ? "در حال پرداخت..." : "پرداخت بدهی"}
          showAction={unpaidTotal > 0}
          onAction={handlePayFirstUnpaid}
        />

        {totalPeriodicCost > 0 && (
          <div className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-surface/70 border border-border/40 text-xs">
            <span className="text-muted-foreground">مجموع هزینه دوره سرویس‌های فعال</span>
            <span className="font-semibold text-foreground font-mono">
              {totalPeriodicCost.toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">تومان / دوره‌ای</span>
            </span>
          </div>
        )}
      </div>

      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(String(key))}
        className="w-full p-0"
      >
        <Tabs.ListContainer>
          <Tabs.List className="bg-surface " aria-label="Options">
            <Tabs.Tab
              id="transactions"
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center cursor-pointer"
            >
              <Tabs.Indicator className="bg-accent rounded-2xl" />
              <CardTransfer size={20} />
              <span>تراکنش ها</span>
            </Tabs.Tab>
            <Tabs.Tab
              className="w-full h-full flex flex-col items-center p-4 gap-1 justify-center cursor-pointer"
              id="payments"
            >
              <Documents size={20} />
              فاکتورها
              <Tabs.Indicator className="bg-accent rounded-2xl" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Search, Filter and Sort Toolbar */}
        <div className="w-full flex flex-col gap-2.5 p-3 my-3 rounded-2xl bg-surface border border-border/40 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در فاکتورها، عنوان یا شماره پیگیری..."
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

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 text-xs rounded-xl border border-border/70 bg-background text-foreground transition-all focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="pending-first">اول در انتظار پرداخت</option>
                <option value="price-desc">بیشترین مبلغ</option>
                <option value="price-asc">کمترین مبلغ</option>
              </select>
            </div>
          </div>

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
              همه
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-surface-hover/50 text-amber-600 hover:bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              در انتظار پرداخت
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-surface-hover/50 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20"
              }`}
            >
              تسویه‌شده / موفق
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CANCELLED")}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                statusFilter === "CANCELLED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-surface-hover/50 text-rose-600 hover:bg-rose-500/10 border border-rose-500/20"
              }`}
            >
              لغو شده
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="w-full mt-4 flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full p-5 rounded-2xl bg-surface/50 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/40" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-28 bg-muted/40 rounded-md" />
                    <div className="h-3 w-20 bg-muted/30 rounded-md" />
                  </div>
                </div>
                <div className="h-5 w-20 bg-muted/30 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Tabs.Panel className="p-0" id="transactions">
              <Transactions data={filteredTransactions} onPay={handlePay} payingId={payingId} />
            </Tabs.Panel>
            <Tabs.Panel className="p-0" id="payments">
              <InvoiceList
                data={filteredInvoices}
                onPay={handlePay}
                payingId={payingId}
              />
            </Tabs.Panel>
          </>
        )}
      </Tabs>
    </div>
  );
}
