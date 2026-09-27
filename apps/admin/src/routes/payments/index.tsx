import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { ModalPortal } from "@/components/common/modal-portal";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Chip } from "@heroui/react";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import { formatJalaliDateTime, formatJalaliDate } from "@gecut-cloud/contracts";
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
  Building2,
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

function normalizeSearchText(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function getItemOrInvoiceCategory(itemOrInv: any): string | null {
  if (!itemOrInv) return null;
  const items = itemOrInv.items || [itemOrInv];
  for (const it of items) {
    const sType = String(
      it?.serviceTypeSnapshot ||
        it?.service?.serviceType?.name ||
        it?.service?.serviceType?.slug ||
        it?.service?.type ||
        it?.type ||
        "",
    ).toUpperCase();
    if (sType === "SERVER" || sType === "VPS" || sType.includes("سرور")) return "SERVER";
    if (sType === "HOSTING" || sType.includes("هاست") || sType.includes("میزبانی")) return "HOSTING";
    if (sType === "DOMAIN" || sType.includes("دامنه")) return "DOMAIN";
    if (sType === "API" || sType.includes("وب‌سرویس") || sType.includes("API")) return "API";
    if (sType === "PACKAGE" || sType.includes("بسته") || sType.includes("پکیج")) return "PACKAGE";
  }

  const fullText = (
    items
      .map(
        (it: any) =>
          `${it?.title || ""} ${it?.serviceNameSnapshot || ""} ${it?.service?.name || ""} ${it?.description || ""}`,
      )
      .join(" ") +
    " " +
    (itemOrInv.notes || "")
  ).toLowerCase();

  if (fullText.includes("سرور") || fullText.includes("server") || fullText.includes("vps") || fullText.includes("اختصاصی") || fullText.includes("مجازی")) return "SERVER";
  if (fullText.includes("هاست") || fullText.includes("host") || fullText.includes("میزبانی") || fullText.includes("cpanel")) return "HOSTING";
  if (fullText.includes("دامنه") || fullText.includes("domain") || fullText.includes(".ir") || fullText.includes(".com") || fullText.includes("whois")) return "DOMAIN";
  if (fullText.includes("وب‌سرویس") || fullText.includes("وب سرویس") || fullText.includes("endpoint") || fullText.includes("api ") || fullText.endsWith("api") || fullText.startsWith("api")) return "API";
  if (fullText.includes("بسته") || fullText.includes("پکیج") || fullText.includes("package") || fullText.includes("پلن")) return "PACKAGE";
  if (fullText.includes("ابری") || fullText.includes("cloud")) return "HOSTING";

  return null;
}

function matchesCategory(p: any, catId: string): boolean {
  if (catId === "ALL") return true;
  if (catId === "GATEWAY") {
    const prov = String(p.provider || p.invoice?.payment?.provider || "").toUpperCase();
    const gRef = String(p.gatewayRef || p.invoice?.payment?.gatewayRef || "");
    return (
      prov === "ZIBAL" ||
      prov === "ZARINPAL" ||
      prov === "PAYPING" ||
      prov === "ONLINE" ||
      prov === "GATEWAY" ||
      gRef.startsWith("TRX-") ||
      gRef.startsWith("ZP_")
    );
  }
  if (catId === "MANUAL") {
    const prov = String(p.provider || p.invoice?.payment?.provider || "").toUpperCase();
    const gRef = String(p.gatewayRef || p.invoice?.payment?.gatewayRef || "");
    if (gRef.startsWith("TRX-") || gRef.startsWith("ZP_") || prov === "ONLINE" || prov === "ZIBAL" || prov === "ZARINPAL" || prov === "PAYPING") {
      return false;
    }
    return prov === "MANUAL_TRANSFER" || prov === "CASH" || prov === "CARD_TO_CARD" || prov === "MANUAL" || prov === "CART_TO_CART" || !prov;
  }

  const invCat = getItemOrInvoiceCategory(p.invoice || p);
  if (invCat === catId) return true;

  const items = p.invoice?.items || [];
  return items.some((it: any) => getItemOrInvoiceCategory(it) === catId);
}

function isPaymentConfirmedByCustomer(pay: any): boolean {
  if (pay.confirmedBy === "CUSTOMER") return true;
  const prov = String(pay.provider || "").toUpperCase();
  if (prov === "ZIBAL" || prov === "ZARINPAL" || prov === "PAYPING" || prov === "ONLINE") return true;
  const gRef = String(pay.gatewayRef || "");
  if (gRef.startsWith("TRX-") || gRef.startsWith("ZP_")) return true;
  return false;
}

function AdminPaymentsListPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "SETTLED">("ALL");
  const [approvalFilter, setApprovalFilter] = useState<"ALL" | "CUSTOMER" | "ADMIN">("ALL");
  const [counterpartyFilter, setCounterpartyFilter] = useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL");
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
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
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
    const invoicesMap = new Map(allInvoices.map((inv: any) => [inv.id, inv]));

    const enrichedDirectPayments = directPayments.map((p: any) => {
      const matchedInv = invoicesMap.get(p.invoiceId) || p.invoice;
      return {
        ...p,
        invoice: matchedInv || p.invoice,
      };
    });

    const paidInvoicesWithoutDirectPayment = allInvoices
      .filter((inv: any) => (inv.status === "PAID" || inv.status === "paid") && !directInvoiceIds.has(inv.id))
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

    return [...enrichedDirectPayments, ...paidInvoicesWithoutDirectPayment];
  }, [paymentsData?.items, allInvoicesData?.items]);

  const unpaidInvoices = useMemo(() => {
    const allInvoices = allInvoicesData?.items || [];
    return allInvoices.filter((inv: any) => inv.status === "UNPAID" || inv.status === "unpaid");
  }, [allInvoicesData?.items]);

  const getSortTime = (dateVal: any) => {
    if (!dateVal) return 0;
    const t = new Date(dateVal).getTime();
    return isNaN(t) ? 0 : t;
  };

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

  // Unified payments list combining both settled payments and pending (unpaid invoices)
  const allUnifiedPayments = useMemo(() => {
    const settled = rawPayments.map((p: any) => ({
      ...p,
      paymentStatus: "SETTLED" as const,
      sortDate: getSortTime(p.paidAt || p.createdAt),
    }));

    const pending = unpaidInvoices.map((inv: any) => ({
      id: `pending_${inv.id}`,
      invoiceId: inv.id,
      amountToman: Number(inv.totalToman || 0),
      provider: "MANUAL_TRANSFER",
      gatewayRef: "در انتظار پرداخت",
      paidAt: null,
      dueDate: inv.dueDate,
      createdAt: inv.issuedAt || inv.createdAt,
      confirmedBy: "NONE" as const,
      paymentStatus: "PENDING" as const,
      invoice: inv,
      sortDate: getSortTime(inv.issuedAt || inv.createdAt),
    }));

    return [...pending, ...settled];
  }, [rawPayments, unpaidInvoices]);

  // Unified filter, search, and sort
  const processedItems = useMemo(() => {
    let list: any[] = [];
    if (activeTab === "ALL") {
      list = [...allUnifiedPayments];
    } else if (activeTab === "PENDING") {
      list = allUnifiedPayments.filter((p) => p.paymentStatus === "PENDING");
    } else {
      list = allUnifiedPayments.filter((p) => p.paymentStatus === "SETTLED");
    }

    // Counterparty filter (Customer vs Supplier)
    if (counterpartyFilter === "CUSTOMER") {
      list = list.filter((p: any) => {
        const isSupplier = Boolean(p.invoice?.supplierId) || p.invoice?.counterpartyType === "SUPPLIER";
        return !isSupplier;
      });
    } else if (counterpartyFilter === "SUPPLIER") {
      list = list.filter((p: any) => {
        const isSupplier = Boolean(p.invoice?.supplierId) || p.invoice?.counterpartyType === "SUPPLIER";
        return isSupplier;
      });
    }

    // Approval filter (Customer vs Admin confirmed) - only applies to settled
    if (approvalFilter === "CUSTOMER") {
      list = list.filter((p) => p.paymentStatus === "SETTLED" && isPaymentConfirmedByCustomer(p));
    } else if (approvalFilter === "ADMIN") {
      list = list.filter((p) => p.paymentStatus === "SETTLED" && !isPaymentConfirmedByCustomer(p));
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      list = list.filter((p: any) => matchesCategory(p, selectedCategory));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery);
      list = list.filter((p: any) => {
        const inv = p.invoice;
        const invNum = normalizeSearchText(formatInvoiceNumber(inv?.invoiceNumber || p.invoiceId));
        const rawInvNum = normalizeSearchText(inv?.invoiceNumber || p.invoiceId);
        const custName = normalizeSearchText(inv?.customer?.name || inv?.customer?.displayName || "");
        const suppName = normalizeSearchText(inv?.supplier?.name || inv?.supplierName || "");
        const custPhone = normalizeSearchText(inv?.customer?.phone || "");
        const suppPhone = normalizeSearchText(inv?.supplier?.phone || "");
        const notes = normalizeSearchText(inv?.notes || "");
        const gRef = normalizeSearchText(p.gatewayRef || "");
        const prov = normalizeSearchText(p.provider || "");
        const amountStr = normalizeSearchText(p.amountToman);
        const idStr = normalizeSearchText(p.id);

        const itemsText = normalizeSearchText(
          (inv?.items || [])
            .map((it: any) => `${it.title || ""} ${it.serviceNameSnapshot || ""} ${it.service?.name || ""} ${it.description || ""}`)
            .join(" ")
        );

        return (
          idStr.includes(q) ||
          invNum.includes(q) ||
          rawInvNum.includes(q) ||
          custName.includes(q) ||
          suppName.includes(q) ||
          custPhone.includes(q) ||
          suppPhone.includes(q) ||
          notes.includes(q) ||
          itemsText.includes(q) ||
          gRef.includes(q) ||
          prov.includes(q) ||
          amountStr.includes(q)
        );
      });
    }

    list.sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return (b.sortDate || 0) - (a.sortDate || 0);
      }
      if (sortBy === "oldest") {
        return (a.sortDate || 0) - (b.sortDate || 0);
      }
      if (sortBy === "amount-desc") {
        return (Number(b.amountToman) || 0) - (Number(a.amountToman) || 0);
      }
      if (sortBy === "amount-asc") {
        return (Number(a.amountToman) || 0) - (Number(b.amountToman) || 0);
      }
      return 0;
    });

    return list;
  }, [allUnifiedPayments, activeTab, approvalFilter, counterpartyFilter, selectedCategory, searchQuery, sortBy]);

  // Active items list based on current tab
  const totalItems = processedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_LIMIT;
    return processedItems.slice(start, start + PAGE_LIMIT);
  }, [processedItems, currentPage, PAGE_LIMIT]);

  // Category counts
  const categoryCounts = useMemo(() => {
    let baseList =
      activeTab === "SETTLED"
        ? rawPayments
        : activeTab === "PENDING"
        ? unpaidInvoices
        : allUnifiedPayments;

    if (counterpartyFilter === "CUSTOMER") {
      baseList = baseList.filter((p: any) => !p.invoice?.supplierId && p.invoice?.counterpartyType !== "SUPPLIER");
    } else if (counterpartyFilter === "SUPPLIER") {
      baseList = baseList.filter((p: any) => Boolean(p.invoice?.supplierId) || p.invoice?.counterpartyType === "SUPPLIER");
    }

    const counts: Record<string, number> = { ALL: baseList.length };
    for (const cat of PAYMENT_CONTENT_CATEGORIES) {
      if (cat.id === "ALL") continue;
      counts[cat.id] = baseList.filter((p: any) => matchesCategory(p, cat.id)).length;
    }
    return counts;
  }, [activeTab, rawPayments, unpaidInvoices, allUnifiedPayments, counterpartyFilter]);

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
          <Card
            onClick={() => {
              setActiveTab("SETTLED");
              setApprovalFilter("ALL");
              setPage(1);
            }}
            className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
              activeTab === "SETTLED" && approvalFilter === "ALL"
                ? "border-emerald-500/80 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                : "border-border/60 bg-card hover:border-emerald-500/50"
            }`}
          >
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
          <Card
            onClick={() => {
              setActiveTab("SETTLED");
              setApprovalFilter("CUSTOMER");
              setPage(1);
            }}
            className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
              activeTab === "SETTLED" && approvalFilter === "CUSTOMER"
                ? "border-blue-500/80 bg-blue-500/10 ring-1 ring-blue-500/30"
                : "border-border/60 bg-card hover:border-blue-500/50"
            }`}
          >
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
          <Card
            onClick={() => {
              setActiveTab("SETTLED");
              setApprovalFilter("ADMIN");
              setPage(1);
            }}
            className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
              activeTab === "SETTLED" && approvalFilter === "ADMIN"
                ? "border-purple-500/80 bg-purple-500/10 ring-1 ring-purple-500/30"
                : "border-border/60 bg-card hover:border-purple-500/50"
            }`}
          >
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
          <Card
            onClick={() => {
              setActiveTab("PENDING");
              setPage(1);
            }}
            className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
              activeTab === "PENDING"
                ? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30"
                : "border-border/60 bg-card hover:border-amber-500/50"
            }`}
          >
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

        {/* Counterparty Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground font-medium ml-1">نوع طرف‌حساب:</span>
            <Button
              variant={counterpartyFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCounterpartyFilter("ALL");
                setPage(1);
              }}
              className={`text-xs rounded-xl h-8 px-3 cursor-pointer ${
                counterpartyFilter === "ALL" ? "bg-emerald-600 text-white shadow-xs" : ""
              }`}
            >
              همه طرف‌های حساب
            </Button>
            <Button
              variant={counterpartyFilter === "CUSTOMER" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCounterpartyFilter("CUSTOMER");
                setPage(1);
              }}
              className={`text-xs rounded-xl h-8 px-3 cursor-pointer gap-1.5 ${
                counterpartyFilter === "CUSTOMER" ? "bg-emerald-600 text-white shadow-xs" : ""
              }`}
            >
              <User className="h-3.5 w-3.5" />
              دریافتی از مشتریان (فروش)
            </Button>
            <Button
              variant={counterpartyFilter === "SUPPLIER" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCounterpartyFilter("SUPPLIER");
                setPage(1);
              }}
              className={`text-xs rounded-xl h-8 px-3 cursor-pointer gap-1.5 ${
                counterpartyFilter === "SUPPLIER" ? "bg-purple-600 text-white shadow-xs" : ""
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              پرداختی به تامین‌کنندگان (خرید)
            </Button>
          </div>
        </div>

        {/* Primary View Switcher: All vs Pending vs Settled */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60 w-fit">
            <button
              onClick={() => {
                setActiveTab("ALL");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>همه پرداخت‌ها (تسویه‌شده و معلق)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {allUnifiedPayments.length.toLocaleString("fa-IR")}
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
              <span>پرداخت‌های معلق</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                {unpaidInvoices.length.toLocaleString("fa-IR")}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("SETTLED");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "SETTLED"
                  ? "bg-card text-foreground shadow-xs border border-border/50 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>پرداخت‌های تسویه‌شده</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                {rawPayments.length.toLocaleString("fa-IR")}
              </span>
            </button>
          </div>

          {/* Approval Source Sub-filter (Customer vs Admin) */}
          {(activeTab === "SETTLED" || activeTab === "ALL") && (
            <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border/60 text-xs">
              <span className="text-[11px] text-muted-foreground px-2 font-medium">مرجع تایید تسویه:</span>
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
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !recordPaymentMutation.isPending) setIsRecordOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
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
                    فاکتور در انتظار پرداخت (طرف‌حساب) *
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
                    {unpaidInvoices.map((inv: any) => {
                      const isSupp = Boolean(inv.supplierId) || inv.counterpartyType === "SUPPLIER";
                      const partyName = isSupp
                        ? `[تامین‌کننده] ${inv.supplier?.name || inv.supplierName || "تامین‌کننده زیرساخت"}`
                        : `[مشتری] ${inv.customer?.displayName || inv.customer?.name || "مشتری"}`;
                      const svcName = inv.items?.[0]?.serviceNameSnapshot || inv.items?.[0]?.service?.name || inv.items?.[0]?.title;
                      return (
                        <option key={inv.id} value={inv.id}>
                          فاکتور {formatInvoiceNumber(inv.invoiceNumber || inv.id)} - {partyName} {svcName ? `(سرویس: ${svcName})` : ""} - ({(inv.totalToman || 0).toLocaleString("fa-IR")} تومان)
                        </option>
                      );
                    })}
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
        </ModalPortal>
      )}

        {/* Payments Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-4 px-6 whitespace-nowrap">شناسه رسید / نوع</th>
                    <th className="py-4 px-6 whitespace-nowrap">شماره فاکتور</th>
                    <th className="py-4 px-6 whitespace-nowrap">طرف‌حساب</th>
                    <th className="py-4 px-6 whitespace-nowrap">مبلغ (تومان)</th>
                    <th className="py-4 px-6 whitespace-nowrap">کد رهگیری / ارجاع</th>
                    <th className="py-4 px-6 whitespace-nowrap">شیوه پرداخت</th>
                    <th className="py-4 px-6 whitespace-nowrap">مرجع تایید</th>
                    <th className="py-4 px-6 whitespace-nowrap">تاریخ</th>
                    <th className="py-4 px-6 whitespace-nowrap">وضعیت پرداخت</th>
                    <th className="py-4 px-6 text-center whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 px-6 text-center text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <p className="text-sm">
                            {searchQuery
                              ? `موردی مطابق با عبارت جستجوی «${searchQuery}» یافت نشد.`
                              : activeTab === "PENDING"
                              ? "هیچ فاکتور معلق یا پرداخت‌نشده‌ای یافت نشد. تمامی حساب‌ها تسویه هستند."
                              : activeTab === "SETTLED"
                              ? "هیچ پرداخت تسویه‌شده‌ای در این فیلتر یافت نشد."
                              : "هیچ پرداختی در این دسته‌بندی یافت نشد."}
                          </p>
                          {(searchQuery || selectedCategory !== "ALL" || approvalFilter !== "ALL" || counterpartyFilter !== "ALL") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("ALL");
                                setApprovalFilter("ALL");
                                setCounterpartyFilter("ALL");
                                setPage(1);
                              }}
                              className="text-xs gap-1.5 h-8 cursor-pointer"
                            >
                              پاک کردن تمامی فیلترها
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item: any) => {
                      const isPending = item.paymentStatus === "PENDING";
                      const isSupplier = Boolean(item.invoice?.supplierId) || item.invoice?.counterpartyType === "SUPPLIER";
                      const partyName = isSupplier
                        ? item.invoice?.supplier?.name || item.invoice?.supplierName || "تامین‌کننده زیرساخت"
                        : item.invoice?.customer?.displayName || item.invoice?.customer?.name || "مشتری";
                      const partyPhone = isSupplier
                        ? item.invoice?.supplier?.phone || item.invoice?.supplier?.contactName
                        : item.invoice?.customer?.phone;
                      const isCustomer = !isPending && isPaymentConfirmedByCustomer(item);
                      const isOverdue =
                        isPending &&
                        item.dueDate &&
                        new Date(item.dueDate).getTime() < Date.now();

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isPending
                              ? "hover:bg-amber-500/5 bg-amber-500/[0.02]"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          {/* 1. شناسه رسید */}
                          <td className="py-4 px-6 font-mono font-medium text-foreground whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center gap-1.5 font-mono text-amber-600 dark:text-amber-400 font-bold">
                                <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                                <span>معلق</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[110px]">{item.id}</span>
                              </div>
                            )}
                          </td>

                          {/* 2. شماره فاکتور */}
                          <td className="py-4 px-6 font-mono font-bold text-foreground whitespace-nowrap">
                            {formatInvoiceNumber(item.invoice?.invoiceNumber || item.invoiceId)}
                          </td>

                          {/* 3. طرف‌حساب */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSupplier
                                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                    : isPending
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isSupplier ? (
                                  <Building2 className="h-3.5 w-3.5" />
                                ) : (
                                  partyName.charAt(0) || (isPending ? "ک" : "م")
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {isSupplier && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                                      تامین‌کننده
                                    </span>
                                  )}
                                  <span className="font-semibold text-foreground block whitespace-nowrap">
                                    {partyName}
                                  </span>
                                </div>
                                {partyPhone && (
                                  <span className="text-[10px] text-muted-foreground font-mono block whitespace-nowrap">
                                    {partyPhone}
                                  </span>
                                )}
                                {(item.invoice?.items?.[0]?.serviceNameSnapshot || item.invoice?.items?.[0]?.service?.name || item.invoice?.items?.[0]?.title) && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mt-0.5 whitespace-nowrap">
                                    <Server className="h-3 w-3 shrink-0 text-purple-500" />
                                    <span className="truncate max-w-[150px]" title={item.invoice.items[0].serviceNameSnapshot || item.invoice.items[0].service?.name || item.invoice.items[0].title}>
                                      سرویس: {item.invoice.items[0].serviceNameSnapshot || item.invoice.items[0].service?.name || item.invoice.items[0].title}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 4. مبلغ */}
                          <td className="py-4 px-6 font-bold whitespace-nowrap">
                            <span
                              className={
                                isPending
                                  ? "text-amber-600 dark:text-amber-400 font-mono"
                                  : "text-emerald-600 dark:text-emerald-400 font-mono"
                              }
                            >
                              {(item.amountToman || 0) === 0 ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">رایگان</span>
                              ) : (
                                `${(item.amountToman || 0).toLocaleString("fa-IR")} تومان`
                              )}
                            </span>
                          </td>

                          {/* 5. کد رهگیری */}
                          <td className="py-4 px-6 font-mono text-muted-foreground whitespace-nowrap">
                            {isPending ? (
                              <span className="text-muted-foreground/70 text-[11px]">
                                در انتظار پرداخت
                              </span>
                            ) : (
                              item.gatewayRef || "---"
                            )}
                          </td>

                          {/* 6. شیوه پرداخت */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {isPending ? (
                              <span className="font-mono text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/20 inline-flex items-center">
                                در انتظار واریز / درگاه
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] bg-muted px-2.5 py-1 rounded-lg border whitespace-nowrap inline-flex items-center">
                                {item.provider === "MANUAL_TRANSFER"
                                  ? "کارت به کارت / پایا"
                                  : item.provider === "ZARINPAL"
                                  ? "زرین‌پال"
                                  : item.provider === "PAYPING"
                                  ? "پی‌پینگ"
                                  : item.provider === "online"
                                  ? "درگاه آنلاین"
                                  : item.provider === "CASH"
                                  ? "نقدی"
                                  : item.provider}
                              </span>
                            )}
                          </td>

                          {/* 7. مرجع تایید */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                <Clock className="h-3 w-3 shrink-0" />
                                در انتظار تسویه
                              </span>
                            ) : isCustomer ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                                <UserCheck className="h-3 w-3 shrink-0" />
                                تایید مشتری (آنلاین)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                                <ShieldCheck className="h-3 w-3 shrink-0" />
                                تایید ادمین (دستی)
                              </span>
                            )}
                          </td>

                          {/* 8. تاریخ */}
                          <td className="py-4 px-6 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {isPending ? (
                              <div className="flex flex-col">
                                <span>صدور: {formatJalaliDateTime(item.createdAt)}</span>
                                {item.dueDate && (
                                  <span
                                    className={
                                      isOverdue
                                        ? "text-rose-600 font-bold text-[10px]"
                                        : "text-muted-foreground/80 text-[10px]"
                                    }
                                  >
                                    سررسید: {formatJalaliDate(item.dueDate)}
                                    {isOverdue && " (گذشته)"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              formatJalaliDateTime(item.paidAt || item.createdAt)
                            )}
                          </td>

                          {/* 9. وضعیت پرداخت */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {isPending ? (
                              <Chip
                                size="sm"
                                variant="soft"
                                color={isOverdue ? "danger" : "warning"}
                                className="gap-1 text-[10px] font-medium whitespace-nowrap"
                              >
                                <Clock className="h-3 w-3 shrink-0" />
                                {isOverdue ? "معلق (سررسید گذشته)" : "معلق / در انتظار پرداخت"}
                              </Chip>
                            ) : (
                              <Chip
                                size="sm"
                                variant="soft"
                                color="success"
                                className="gap-1 text-[10px] font-medium whitespace-nowrap"
                              >
                                <CheckCircle className="h-3 w-3 shrink-0" />
                                تسویه شده
                              </Chip>
                            )}
                          </td>

                          {/* 10. عملیات */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {isPending ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenRecordForInvoice(item.invoice)}
                                className="h-7 px-2.5 text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-medium cursor-pointer whitespace-nowrap"
                              >
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                تسویه دستی
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/70 font-mono">
                                ثبت شده
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
