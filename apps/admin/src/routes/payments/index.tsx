import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import { formatJalaliDateTime } from "@gecut-cloud/contracts";
import { formatInvoiceNumber } from "@/utils/format";
import {
  CreditCard,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  Receipt,
  Layers,
  HardDrive,
  Server,
  Globe,
  Cpu,
  Package,
  Landmark,
  Search,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertCircle,
  User,
  Phone,
  Check,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/payments/")({
  component: AdminPaymentsListPage,
});

const PAYMENT_CONTENT_CATEGORIES = [
  { id: "ALL", label: "همه پرداخت‌ها", icon: Layers },
  { id: "HOSTING", label: "هاست و فضای ابری", icon: HardDrive },
  { id: "SERVER", label: "سرور اختصاصی و VPS", icon: Server },
  { id: "DOMAIN", label: "ثبت و تمدید دامنه", icon: Globe },
  { id: "API", label: "وب‌سرویس و API", icon: Cpu },
  { id: "PACKAGE", label: "بسته‌ها و پکیج‌ها", icon: Package },
  { id: "GATEWAY", label: "درگاه‌های آنلاین", icon: CreditCard },
  { id: "MANUAL", label: "حواله بانکی و کارت", icon: Landmark },
];

function getPaymentCategory(pay: any): string {
  const text = (
    (pay.invoice?.items?.[0]?.title || "") + " " +
    (pay.invoice?.notes || "") + " " +
    (pay.invoice?.customer?.name || "") + " " +
    (pay.invoice?.items?.[0]?.description || "") + " " +
    (pay.gatewayRef || "")
  ).toLowerCase();

  if (text.includes("هاست") || text.includes("host") || text.includes("ابری") || text.includes("cloud")) return "HOSTING";
  if (text.includes("سرور") || text.includes("server") || text.includes("vps") || text.includes("اختصاصی")) return "SERVER";
  if (text.includes("دامنه") || text.includes("domain") || text.includes(".ir") || text.includes(".com")) return "DOMAIN";
  if (text.includes("api") || text.includes("وب‌سرویس") || text.includes("سرویس")) return "API";
  if (text.includes("بسته") || text.includes("پکیج") || text.includes("عدد") || text.includes("package")) return "PACKAGE";
  return "HOSTING";
}

function getInvoiceCategory(inv: any): string {
  const text = (
    (inv.items?.[0]?.title || "") + " " +
    (inv.notes || "") + " " +
    (inv.customer?.name || "") + " " +
    (inv.items?.[0]?.description || "")
  ).toLowerCase();

  if (text.includes("هاست") || text.includes("host") || text.includes("ابری") || text.includes("cloud")) return "HOSTING";
  if (text.includes("سرور") || text.includes("server") || text.includes("vps") || text.includes("اختصاصی")) return "SERVER";
  if (text.includes("دامنه") || text.includes("domain") || text.includes(".ir") || text.includes(".com")) return "DOMAIN";
  if (text.includes("api") || text.includes("وب‌سرویس") || text.includes("سرویس")) return "API";
  if (text.includes("بسته") || text.includes("پکیج") || text.includes("عدد") || text.includes("package")) return "PACKAGE";
  return "HOSTING";
}

function isPaymentConfirmedByCustomer(pay: any): boolean {
  if (pay.confirmedBy === "CUSTOMER") return true;
  if (pay.provider === "ZARINPAL" || pay.provider === "PAYPING" || pay.provider === "online") return true;
  if (typeof pay.gatewayRef === "string" && (pay.gatewayRef.startsWith("TRX-") || pay.gatewayRef.startsWith("ZP_"))) return true;
  return false;
}

function AdminPaymentsListPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"SETTLED" | "PENDING">("SETTLED");
  const [approvalFilter, setApprovalFilter] = useState<"ALL" | "CUSTOMER" | "ADMIN">("ALL");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 30;

  // Form states
  const [invoiceId, setInvoiceId] = useState("");
  const [amountToman, setAmountToman] = useState<number>(2500000);
  const [gatewayRef, setGatewayRef] = useState("");
  const [provider, setProvider] = useState("MANUAL_TRANSFER");

  const { data: allInvoicesData, refetch: refetchInvoices } = useQuery({
    queryKey: ["admin", "invoices", "ALL"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/invoices?limit=300"),
  });

  const { data: paymentsData, isLoading, refetch: refetchPayments } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/payments?page=1&limit=300"),
  });

  const handleRefreshAll = () => {
    refetchPayments();
    refetchInvoices();
    toast.info("اطلاعات پرداخت‌ها و فاکتورها بروزرسانی شد");
  };

  const recordPaymentMutation = useMutation({
    mutationFn: (newPayment: any) =>
      apiClient("/payments", {
        method: "POST",
        body: JSON.stringify(newPayment),
      }),
    onSuccess: () => {
      toast.success("رسید پرداخت با موفقیت ثبت شد و فاکتور تسویه گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsRecordOpen(false);
      setInvoiceId("");
      setGatewayRef("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت پرداخت");
    },
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) {
      toast.error("انتخاب فاکتور پرداخت‌نشده الزامی است");
      return;
    }
    recordPaymentMutation.mutate({
      invoiceId,
      amountToman: Number(amountToman),
      gatewayRef: gatewayRef || `REF-${Date.now().toString().slice(-6)}`,
      provider,
    });
  };

  const handleOpenRecordForInvoice = (inv: any) => {
    setInvoiceId(inv.id);
    setAmountToman(Number(inv.totalToman || 0));
    setGatewayRef(`REF-${Date.now().toString().slice(-6)}`);
    setProvider("MANUAL_TRANSFER");
    setIsRecordOpen(true);
  };

  // Combine payments from payments table with any paid invoices to guarantee 100% of confirmed payments are shown
  const rawPayments = useMemo(() => {
    const directPayments = paymentsData?.items || [];
    const directInvoiceIds = new Set(directPayments.map((p: any) => p.invoiceId));
    const allInvoices = allInvoicesData?.items || [];

    const paidInvoicesWithoutDirectPayment = allInvoices
      .filter((inv: any) => inv.status === "PAID" && !directInvoiceIds.has(inv.id))
      .map((inv: any) => ({
        id: `pay_${inv.id}`,
        invoiceId: inv.id,
        amountToman: Number(inv.totalToman || 0),
        provider: inv.payment?.provider || "MANUAL_TRANSFER",
        gatewayRef: inv.payment?.gatewayRef || `CONFIRMED-${inv.invoiceNumber || inv.id}`,
        paidAt: inv.paidAt || inv.updatedAt || inv.createdAt,
        createdAt: inv.paidAt || inv.updatedAt || inv.createdAt,
        confirmedBy: "ADMIN",
        invoice: inv,
      }));

    return [...directPayments, ...paidInvoicesWithoutDirectPayment];
  }, [paymentsData?.items, allInvoicesData?.items]);

  const unpaidInvoices = useMemo(() => {
    const allInvoices = allInvoicesData?.items || [];
    return allInvoices.filter((inv: any) => inv.status === "UNPAID");
  }, [allInvoicesData?.items]);

  // Financial Summary Metrics
  const totalSettledAmount = useMemo(() => {
    return rawPayments.reduce((sum: number, p: any) => sum + (Number(p.amountToman) || 0), 0);
  }, [rawPayments]);

  const customerConfirmedPayments = useMemo(() => {
    return rawPayments.filter(isPaymentConfirmedByCustomer);
  }, [rawPayments]);

  const adminConfirmedPayments = useMemo(() => {
    return rawPayments.filter((p) => !isPaymentConfirmedByCustomer(p));
  }, [rawPayments]);

  const customerConfirmedTotal = useMemo(() => {
    return customerConfirmedPayments.reduce((sum: number, p: any) => sum + (Number(p.amountToman) || 0), 0);
  }, [customerConfirmedPayments]);

  const adminConfirmedTotal = useMemo(() => {
    return adminConfirmedPayments.reduce((sum: number, p: any) => sum + (Number(p.amountToman) || 0), 0);
  }, [adminConfirmedPayments]);

  const totalPendingAmount = useMemo(() => {
    return unpaidInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.totalToman) || 0), 0);
  }, [unpaidInvoices]);

  // Categorize, search, and sort payments (SETTLED)
  const processedPayments = useMemo(() => {
    let list = [...rawPayments];

    // Approval filter (Customer vs Admin confirmed)
    if (approvalFilter === "CUSTOMER") {
      list = list.filter(isPaymentConfirmedByCustomer);
    } else if (approvalFilter === "ADMIN") {
      list = list.filter((p) => !isPaymentConfirmedByCustomer(p));
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      if (selectedCategory === "GATEWAY") {
        list = list.filter((p: any) => p.provider === "ZARINPAL" || p.provider === "PAYPING" || p.provider === "online");
      } else if (selectedCategory === "MANUAL") {
        list = list.filter((p: any) => p.provider === "MANUAL_TRANSFER" || p.provider === "CASH");
      } else {
        list = list.filter((p: any) => getPaymentCategory(p) === selectedCategory);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p: any) => {
        const invNum = formatInvoiceNumber(p.invoice?.invoiceNumber || p.invoiceId);
        const custName = p.invoice?.customer?.name || p.invoice?.customer?.displayName || "";
        const custPhone = p.invoice?.customer?.phone || "";
        return (
          p.id?.toLowerCase().includes(q) ||
          invNum.toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          custPhone.toLowerCase().includes(q) ||
          p.gatewayRef?.toLowerCase().includes(q) ||
          p.provider?.toLowerCase().includes(q)
        );
      });
    }

    list.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.paidAt || a.createdAt || 0).getTime() - new Date(b.paidAt || b.createdAt || 0).getTime();
      }
      if (sortBy === "amount-desc") {
        return (b.amountToman || 0) - (a.amountToman || 0);
      }
      if (sortBy === "amount-asc") {
        return (a.amountToman || 0) - (b.amountToman || 0);
      }
      return 0;
    });

    return list;
  }, [rawPayments, approvalFilter, selectedCategory, searchQuery, sortBy]);

  // Categorize, search, and sort pending invoices (PENDING)
  const processedPendingInvoices = useMemo(() => {
    let list = [...unpaidInvoices];

    if (selectedCategory !== "ALL" && selectedCategory !== "GATEWAY" && selectedCategory !== "MANUAL") {
      list = list.filter((inv: any) => getInvoiceCategory(inv) === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((inv: any) => {
        const invNum = formatInvoiceNumber(inv.invoiceNumber || inv.id);
        const custName = inv.customer?.name || inv.customer?.displayName || "";
        const custPhone = inv.customer?.phone || "";
        const notes = inv.notes || "";
        const itemTitle = inv.items?.[0]?.title || "";
        return (
          inv.id?.toLowerCase().includes(q) ||
          invNum.toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          custPhone.toLowerCase().includes(q) ||
          notes.toLowerCase().includes(q) ||
          itemTitle.toLowerCase().includes(q)
        );
      });
    }

    list.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "amount-desc") {
        return (b.totalToman || 0) - (a.totalToman || 0);
      }
      if (sortBy === "amount-asc") {
        return (a.totalToman || 0) - (b.totalToman || 0);
      }
      return 0;
    });

    return list;
  }, [unpaidInvoices, selectedCategory, searchQuery, sortBy]);

  // Active items list based on current tab
  const activeItems = activeTab === "SETTLED" ? processedPayments : processedPendingInvoices;
  const totalItems = activeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_LIMIT;
    return activeItems.slice(start, start + PAGE_LIMIT);
  }, [activeItems, currentPage, PAGE_LIMIT]);

  // Category counts for settled tab
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rawPayments.length };
    for (const cat of PAYMENT_CONTENT_CATEGORIES) {
      if (cat.id === "ALL") continue;
      if (cat.id === "GATEWAY") {
        counts[cat.id] = rawPayments.filter((p: any) => p.provider === "ZARINPAL" || p.provider === "PAYPING" || p.provider === "online").length;
      } else if (cat.id === "MANUAL") {
        counts[cat.id] = rawPayments.filter((p: any) => p.provider === "MANUAL_TRANSFER" || p.provider === "CASH").length;
      } else {
        counts[cat.id] = rawPayments.filter((p: any) => getPaymentCategory(p) === cat.id).length;
      }
    }
    return counts;
  }, [rawPayments]);

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت پرداخت‌ها و تسویه‌حساب‌ها</h1>
            <p className="text-sm text-muted-foreground mt-1">
              پیگیری پرداخت‌های تاییدشده (مشتری و ادمین) و پایش فاکتورهای معلق کلاینت‌ها
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setInvoiceId("");
                setAmountToman(2500000);
                setIsRecordOpen(true);
              }}
              className="gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              ثبت دستی پرداخت
            </Button>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Settled Amount */}
          <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">کل پرداخت‌های تاییدشده</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalSettledAmount.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">تومان</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {rawPayments.length.toLocaleString("fa-IR")} تراکنش تسویه‌شده موفق
            </p>
          </Card>

          {/* 2. Customer Online Payments */}
          <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 font-semibold">تایید آنلاین توسط مشتری</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {customerConfirmedTotal.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">تومان</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {customerConfirmedPayments.length.toLocaleString("fa-IR")} پرداخت مستقیم از درگاه
            </p>
          </Card>

          {/* 3. Admin Approved / Manual Transfers */}
          <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 font-semibold">تایید و تسویه توسط ادمین</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {adminConfirmedTotal.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">تومان</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {adminConfirmedPayments.length.toLocaleString("fa-IR")} واریز حواله / کارت به کارت
            </p>
          </Card>

          {/* 4. Pending Client Invoices */}
          <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 font-semibold">مبالغ معلق کلاینت‌ها</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {totalPendingAmount.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">تومان</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {unpaidInvoices.length.toLocaleString("fa-IR")} فاکتور معلق در انتظار تسویه
            </p>
          </Card>
        </div>

        {/* Primary View Switcher: Settled vs Pending */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60 w-fit">
            <button
              onClick={() => {
                setActiveTab("SETTLED");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "SETTLED"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>پرداخت‌های تایید و تسویه‌شده</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {rawPayments.length.toLocaleString("fa-IR")}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("PENDING");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "PENDING"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-4 w-4 text-amber-500" />
              <span>پرداخت‌های معلق و در انتظار کلاینت</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                {unpaidInvoices.length.toLocaleString("fa-IR")}
              </span>
            </button>
          </div>

          {/* Approval Source Sub-filter (Customer vs Admin) */}
          {activeTab === "SETTLED" && (
            <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border/60 text-xs">
              <span className="text-[11px] text-muted-foreground px-2 font-medium">مرجع تایید:</span>
              <button
                onClick={() => {
                  setApprovalFilter("ALL");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  approvalFilter === "ALL"
                    ? "bg-muted text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                همه ({rawPayments.length.toLocaleString("fa-IR")})
              </button>
              <button
                onClick={() => {
                  setApprovalFilter("CUSTOMER");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  approvalFilter === "CUSTOMER"
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="h-3 w-3 text-blue-500" />
                <span>تایید مشتری ({customerConfirmedPayments.length.toLocaleString("fa-IR")})</span>
              </button>
              <button
                onClick={() => {
                  setApprovalFilter("ADMIN");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  approvalFilter === "ADMIN"
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-3 w-3 text-purple-500" />
                <span>تایید ادمین ({adminConfirmedPayments.length.toLocaleString("fa-IR")})</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Category Tabs */}
        {activeTab === "SETTLED" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PAYMENT_CONTENT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] || 0;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={
                activeTab === "SETTLED"
                  ? "جستجو در شماره فاکتور، نام کلاینت، کد رهگیری..."
                  : "جستجو در شماره فاکتور معلق، نام کلاینت، شرح خدمت..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pr-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>مرتب‌سازی:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="newest">جدیدترین موارد</option>
              <option value="oldest">قدیمی‌ترین موارد</option>
              <option value="amount-desc">بیشترین مبلغ</option>
              <option value="amount-asc">کمترین مبلغ</option>
            </select>
          </div>
        </div>

        {/* Record Payment Modal */}
        {isRecordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">ثبت و تسویه دستی پرداخت فاکتور</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRecordOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleRecordSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pinv" className="text-xs font-semibold">
                    فاکتور در انتظار پرداخت (کلاینت) *
                  </Label>
                  <select
                    id="pinv"
                    value={invoiceId}
                    onChange={(e) => {
                      setInvoiceId(e.target.value);
                      const inv = unpaidInvoices.find((i: any) => i.id === e.target.value);
                      if (inv?.totalToman) setAmountToman(inv.totalToman);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">-- یک فاکتور را انتخاب کنید --</option>
                    {unpaidInvoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        فاکتور {formatInvoiceNumber(inv.invoiceNumber || inv.id)} - {inv.customer?.displayName || inv.customer?.name || "مشتری"} - ({inv.totalToman?.toLocaleString("fa-IR")} تومان)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pamount" className="text-xs font-semibold">
                      مبلغ واریزی (تومان) *
                    </Label>
                    <Input
                      id="pamount"
                      type="number"
                      value={amountToman}
                      onChange={(e) => setAmountToman(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pprov" className="text-xs font-semibold">
                      نوع درگاه / شیوه واریز
                    </Label>
                    <select
                      id="pprov"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="MANUAL_TRANSFER">کارت به کارت / پایا</option>
                      <option value="ZARINPAL">زرین‌پال (ZarinPal)</option>
                      <option value="PAYPING">پی‌پینگ (PayPing)</option>
                      <option value="CASH">نقدی / چک</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pref" className="text-xs font-semibold">
                    کد رهگیری / شماره ارجاع بانکی
                  </Label>
                  <Input
                    id="pref"
                    value={gatewayRef}
                    onChange={(e) => setGatewayRef(e.target.value)}
                    placeholder="مثال: 98124018 یا شماره فیش واریزی"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRecordOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={recordPaymentMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {recordPaymentMutation.isPending ? "در حال ثبت..." : "تایید و تسویه فاکتور"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payments Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {activeTab === "SETTLED" ? (
                /* Settled Payments Table (Customer & Admin Confirmed) */
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="py-3.5 px-4">شناسه رسید</th>
                      <th className="py-3.5 px-4">شماره فاکتور</th>
                      <th className="py-3.5 px-4">کلاینت / مشتری</th>
                      <th className="py-3.5 px-4">مبلغ تسویه‌شده (تومان)</th>
                      <th className="py-3.5 px-4">کد رهگیری / ارجاع</th>
                      <th className="py-3.5 px-4">شیوه پرداخت</th>
                      <th className="py-3.5 px-4">مرجع تایید</th>
                      <th className="py-3.5 px-4">تاریخ پرداخت</th>
                      <th className="py-3.5 px-4">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-muted-foreground">
                          هیچ پرداختی در این دسته‌بندی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((pay: any) => {
                        const custName =
                          pay.invoice?.customer?.displayName ||
                          pay.invoice?.customer?.name ||
                          "مشتری";
                        const custPhone = pay.invoice?.customer?.phone;
                        const isCustomer = isPaymentConfirmedByCustomer(pay);

                        return (
                          <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[110px]">{pay.id}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                              {formatInvoiceNumber(pay.invoice?.invoiceNumber || pay.invoiceId)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {custName.charAt(0) || "م"}
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground block">
                                    {custName}
                                  </span>
                                  {custPhone && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      {custPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                              {(pay.amountToman || 0).toLocaleString("fa-IR")} تومان
                            </td>
                            <td className="py-3.5 px-4 font-mono text-muted-foreground">
                              {pay.gatewayRef || "---"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border">
                                {pay.provider === "MANUAL_TRANSFER" ? "کارت به کارت / پایا" :
                                 pay.provider === "ZARINPAL" ? "زرین‌پال" :
                                 pay.provider === "PAYPING" ? "پی‌پینگ" :
                                 pay.provider === "online" ? "درگاه آنلاین" :
                                 pay.provider === "CASH" ? "نقدی" : pay.provider}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isCustomer ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <UserCheck className="h-3 w-3" />
                                  تایید مشتری (آنلاین)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  <ShieldCheck className="h-3 w-3" />
                                  تایید ادمین (دستی)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                              {formatJalaliDateTime(pay.paidAt)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="h-3 w-3" />
                                تسویه شده
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* Pending Invoices / Unpaid Payments Table */
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="py-3.5 px-4">کلاینت / مشتری</th>
                      <th className="py-3.5 px-4">شماره فاکتور</th>
                      <th className="py-3.5 px-4">شرح خدمت / سرویس</th>
                      <th className="py-3.5 px-4">مبلغ معلق (تومان)</th>
                      <th className="py-3.5 px-4">تاریخ صدور</th>
                      <th className="py-3.5 px-4">مهلت سررسید</th>
                      <th className="py-3.5 px-4">وضعیت پرداخت</th>
                      <th className="py-3.5 px-4 text-center">عملیات تسویه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          هیچ فاکتور معلق یا پرداخت‌نشده‌ای یافت نشد. تمامی حساب‌ها تسویه هستند.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((inv: any) => {
                        const custName =
                          inv.customer?.displayName ||
                          inv.customer?.name ||
                          "مشتری";
                        const custPhone = inv.customer?.phone;
                        const custEmail = inv.customer?.email;
                        const itemTitle =
                          inv.items?.[0]?.title ||
                          inv.notes ||
                          "صورت‌حساب سرویس ابری";

                        const isOverdue = inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();

                        return (
                          <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {custName.charAt(0) || "ک"}
                                </div>
                                <div>
                                  <span className="font-bold text-foreground block">
                                    {custName}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                                    {custPhone && <span>{custPhone}</span>}
                                    {custPhone && custEmail && <span>•</span>}
                                    {custEmail && <span className="truncate max-w-[120px]">{custEmail}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                              {formatInvoiceNumber(inv.invoiceNumber || inv.id)}
                            </td>
                            <td className="py-3.5 px-4 max-w-[200px] truncate text-foreground font-medium">
                              {itemTitle}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                              {(inv.totalToman || 0).toLocaleString("fa-IR")} تومان
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                              {formatJalaliDateTime(inv.issuedAt || inv.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {inv.dueDate ? (
                                <span className={isOverdue ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                                  {formatJalaliDateTime(inv.dueDate)}
                                  {isOverdue && (
                                    <span className="mr-1.5 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-600">
                                      سررسید گذشته
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "---"
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3" />
                                معلق / در انتظار پرداخت
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenRecordForInvoice(inv)}
                                className="h-7 px-2.5 text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-medium cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                تسویه دستی
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs">
                <span className="text-muted-foreground">
                  نمایش صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} (مجموع {totalItems.toLocaleString("fa-IR")} مورد)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 gap-1 text-xs"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    قبلی
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8 gap-1 text-xs"
                  >
                    بعدی
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
