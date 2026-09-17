import { useState } from "react";
import { Tabs, toast } from "@heroui/react";
import { Factor } from "../dashboard/factor";
import { Documents } from "@solar-icons/react-perf/category/notes/Linear";
import { CardTransfer } from "@solar-icons/react-perf/category/money/LineDuotone";
import { InvoiceList } from "./payment/invoice-list";
import { Payments as PaymentsType, ServiceType } from "@/app/data";
import { Transactions } from "./transactions/transaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getActiveCustomerUser } from "@/lib/api-client";

export function Payments() {
  const queryClient = useQueryClient();
  const activeUser = getActiveCustomerUser();
  const [selectedTab, setSelectedTab] = useState<string>("payments");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

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

  // Calculate real unpaid balance from unpaid invoices
  const unpaidTotal = (invoicesData?.items || [])
    .filter((inv: any) => inv.status === "UNPAID")
    .reduce((sum: number, inv: any) => sum + (Number(inv.totalToman) || 0), 0);

  // Calculate total periodic cost of active services (e.g. monthly fees)
  const totalPeriodicCost = (servicesData?.items || [])
    .filter((s: any) => s.status === "ACTIVE")
    .reduce((sum: number, s: any) => sum + Number(s.priceToman || s.price || 0), 0);

  // Map real backend invoices (newest first)
  const sortedRawInvoices = [...(invoicesData?.items || [])].sort((a: any, b: any) => {
    const timeA = new Date(a.issuedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.issuedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const mappedInvoices: PaymentsType[] = sortedRawInvoices.map((inv: any) => {
    const firstItem = inv.items?.[0];
    const title = firstItem?.title || inv.invoiceNumber || "صورتحساب خدمات";
    const subTitle =
      inv.items?.length > 1
        ? `شامل ${inv.items.length} ردیف خدمات`
        : firstItem?.description || "سرویس ابری فعال";

    const lower = (title + " " + subTitle).toLowerCase();
    let type: ServiceType = "SERVICE";
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
      status:
        inv.status === "PAID"
          ? "paid"
          : inv.status === "CANCELLED"
          ? "cancelled"
          : "Awaiting payment",
    };
  });

  // Map real backend payments (or paid invoices as fallback) (newest first)
  const sortedRawPayments = [...(paymentsData?.items || [])].sort((a: any, b: any) => {
    const timeA = new Date(a.paidAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.paidAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const rawPayments = sortedRawPayments;
  const mappedTransactions: PaymentsType[] = rawPayments.map((pay: any) => {
    const inv = pay.invoice;
    const firstItem = inv?.items?.[0];
    const title =
      firstItem?.title ||
      (inv?.invoiceNumber ? `پرداخت فاکتور ${inv.invoiceNumber}` : "پرداخت آنلاین");
    const subTitle = pay.gatewayRef
      ? `کد پیگیری: ${pay.gatewayRef}`
      : pay.provider
      ? `درگاه ${pay.provider}`
      : "تراکنش بانکی موفق";

    const lower = (title + " " + subTitle).toLowerCase();
    let type: ServiceType = "SERVICE";
    if (lower.includes("domain") || lower.includes("دامنه")) {
      type = "DOMAIN";
    } else if (
      lower.includes("server") ||
      lower.includes("سرور") ||
      lower.includes("hosting") ||
      lower.includes("هاست")
    ) {
      type = "SERVER";
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

  // Payment mutation using backend POST /payments
  const payMutation = useMutation({
    mutationFn: async (invoice: PaymentsType) => {
      if (!invoice.id) {
        throw new Error("شناسه فاکتور معتبر نیست");
      }
      return apiClient("/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoice.id,
          amountToman: Number(invoice.price),
          provider: "online",
          gatewayRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      });
    },
    onSuccess: () => {
      toast.success("پرداخت فاکتور با موفقیت انجام شد و رسید صادر گردید");
      queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "payments"] });
      // Switch tab to transactions to show the new payment receipt
      setSelectedTab("transactions");
    },
    onError: (err: any) => {
      toast.danger(err.message || "خطا در برقراری ارتباط با درگاه پرداخت");
    },
    onSettled: () => {
      setPayingId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (invoice: PaymentsType) => {
      if (!invoice.id) throw new Error("شناسه فاکتور معتبر نیست");
      return apiClient(`/invoices/${invoice.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "لغو توسط مشتری" }),
      });
    },
    onSuccess: () => {
      toast.success("فاکتور با موفقیت لغو شد");
      queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
    },
    onError: (err: any) => {
      toast.danger(err.message || "خطا در لغو فاکتور");
    },
    onSettled: () => {
      setCancellingId(null);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (invoice: PaymentsType) => {
      if (!invoice.id) throw new Error("شناسه فاکتور معتبر نیست");
      return apiClient(`/invoices/${invoice.id}/reactivate`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      toast.success("فاکتور مجدداً با موفقیت فعال شد و آماده پرداخت است");
      queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
    },
    onError: (err: any) => {
      toast.danger(err.message || "خطا در فعال‌سازی مجدد فاکتور");
    },
    onSettled: () => {
      setReactivatingId(null);
    },
  });

  const handlePay = (invoice: PaymentsType) => {
    if (payMutation.isPending) return;
    setPayingId(invoice.id || "current");
    payMutation.mutate(invoice);
  };

  const handleCancel = (invoice: PaymentsType) => {
    if (cancelMutation.isPending || !invoice.id) return;
    setCancellingId(invoice.id);
    cancelMutation.mutate(invoice);
  };

  const handleReactivate = (invoice: PaymentsType) => {
    if (reactivateMutation.isPending || !invoice.id) return;
    setReactivatingId(invoice.id);
    reactivateMutation.mutate(invoice);
  };

  const handlePayFirstUnpaid = () => {
    const firstUnpaid = mappedInvoices.find((inv) => inv.status !== "paid");
    if (firstUnpaid) {
      handlePay(firstUnpaid);
    } else {
      toast.success("تمامی فاکتورهای شما قبلاً پرداخت و تسویه شده‌اند");
    }
  };

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
              <Transactions data={mappedTransactions} />
            </Tabs.Panel>
            <Tabs.Panel className="p-0" id="payments">
              <InvoiceList
                data={mappedInvoices}
                onPay={handlePay}
                payingId={payingId}
                onCancel={handleCancel}
                cancellingId={cancellingId}
                onReactivate={handleReactivate}
                reactivatingId={reactivatingId}
              />
            </Tabs.Panel>
          </>
        )}
      </Tabs>
    </div>
  );
}
