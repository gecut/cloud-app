import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { JalaliDatePicker } from "@/components/common/jalali-datepicker";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  HardDrive,
  Server,
  Globe,
  Cpu,
  Package,
  Filter,
  Calendar,
  CalendarDays,
  X,
  RotateCcw,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";

export const Route = createFileRoute("/accounting/")({
  component: AdminAccountingPage,
});

const ACCOUNTING_CONTENT_CATEGORIES = [
  { id: "ALL", label: "همه خدمات و اسناد", icon: Layers },
  { id: "HOSTING", label: "هاست و فضای ابری", icon: HardDrive },
  { id: "SERVER", label: "سرور اختصاصی و VPS", icon: Server },
  { id: "DOMAIN", label: "ثبت و تمدید دامنه", icon: Globe },
  { id: "API", label: "وب‌سرویس و API", icon: Cpu },
  { id: "PACKAGE", label: "بسته‌های مصرفی", icon: Package },
];

function getAccountingItemCategory(item: any): string {
  const invItem = item.items?.[0];
  const snapshotType = (invItem?.serviceTypeSnapshot || item.serviceType?.name || item.serviceType?.slug || "").toLowerCase();
  const title = (invItem?.title || item.name || "").toLowerCase();
  const text = (
    title + " " +
    (item.notes || "") + " " +
    (invItem?.description || "") + " " +
    (invItem?.serviceNameSnapshot || "")
  ).toLowerCase();

  // 1. DOMAIN
  if (
    snapshotType.includes("domain") || snapshotType.includes("دامنه") ||
    text.includes("دامنه") || text.includes("domain") ||
    /\.(ir|com|org|net|co|site|online|io|xyz|info)\b/i.test(title)
  ) {
    return "DOMAIN";
  }

  // 2. SERVER & VPS
  if (
    snapshotType.includes("server") || snapshotType.includes("سرور") || snapshotType.includes("vps") ||
    text.includes("سرور") || text.includes("server") || text.includes("vps") || text.includes("اختصاصی") || text.includes("مجازی")
  ) {
    return "SERVER";
  }

  // 3. PACKAGE & CONSUMABLE
  if (
    snapshotType.includes("package") || snapshotType.includes("پکیج") || snapshotType.includes("بسته") ||
    item.trackingType === "QUANTITY" ||
    text.includes("بسته") || text.includes("پکیج") || text.includes("تعدادی") || (invItem?.quantity && invItem.quantity > 1)
  ) {
    return "PACKAGE";
  }

  // 4. API & WEB SERVICE (Do NOT match generic 'سرویس')
  if (
    snapshotType.includes("api") || snapshotType.includes("وب‌سرویس") ||
    text.includes("api") || text.includes("وب‌سرویس") || text.includes("وب سرویس")
  ) {
    return "API";
  }

  // 5. HOSTING & CLOUD
  if (
    snapshotType.includes("host") || snapshotType.includes("هاست") || snapshotType.includes("ابری") || snapshotType.includes("cloud") ||
    text.includes("هاست") || text.includes("host") || text.includes("ابری") || text.includes("cloud") || text.includes("میزبانی")
  ) {
    return "HOSTING";
  }

  return "HOSTING";
}

function getSupplierItemCategory(item: any): string {
  const type = (item.type || "").toUpperCase();
  const name = (item.name || "").toLowerCase();
  const notes = (item.notes || "").toLowerCase();
  const text = `${name} ${notes}`;

  if (type === "DOMAIN" || text.includes("دامنه") || text.includes("domain") || /\.(ir|com|org|net|co|site|online)\b/i.test(name)) return "DOMAIN";
  if (type === "SERVER" || text.includes("سرور") || text.includes("server") || text.includes("vps") || text.includes("اختصاصی") || text.includes("مجازی")) return "SERVER";
  if (type === "PACKAGE" || text.includes("بسته") || text.includes("پکیج") || text.includes("تعدادی")) return "PACKAGE";
  if (type === "API" || text.includes("api") || text.includes("وب‌سرویس")) return "API";
  if (type === "HOSTING" || text.includes("هاست") || text.includes("ابری") || text.includes("cloud") || text.includes("میزبانی")) return "HOSTING";
  return "HOSTING";
}

function AdminAccountingPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "procurement">("sales");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 30;

  // Sales Filter States
  const [filterCustomerId, setFilterCustomerId] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [filterDateType, setFilterDateType] = useState<"issuedAt" | "dueDate">("issuedAt");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Procurement Filter States
  const [selectedSupplierCategory, setSelectedSupplierCategory] = useState("ALL");
  const [filterSupplierId, setFilterSupplierId] = useState<string>("ALL");
  const [filterSupplierStatus, setFilterSupplierStatus] = useState<string>("ALL");
  const [filterSupplierFromDate, setFilterSupplierFromDate] = useState<string>("");
  const [filterSupplierToDate, setFilterSupplierToDate] = useState<string>("");
  const [filterSupplierDateType, setFilterSupplierDateType] = useState<"renewalDate" | "purchaseDate">("renewalDate");
  const [minSupplierAmount, setMinSupplierAmount] = useState<string>("");
  const [maxSupplierAmount, setMaxSupplierAmount] = useState<string>("");
  const [supplierSortBy, setSupplierSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest");
  const [supplierPage, setSupplierPage] = useState(1);
  const [procurementView, setProcurementView] = useState<"services" | "suppliers">("services");

  const { data: invoicesData, isLoading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ["admin", "invoices", "accounting"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/invoices?limit=200"),
  });

  const { data: suppliersData, isLoading: loadingSuppliers, refetch: refetchSuppliers } = useQuery({
    queryKey: ["admin", "suppliers", "accounting"],
    queryFn: () => apiClient<{ items: any[] }>("/suppliers?limit=100"),
  });

  const { data: customersData } = useQuery({
    queryKey: ["admin", "customers", "accounting"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/customers?limit=100"),
  });

  const invoices = invoicesData?.items || [];
  const suppliers = suppliersData?.items || [];
  const customersList = customersData?.items || [];

  // Financial calculations
  const paidInvoices = invoices.filter((i: any) => i.status === "PAID");
  const unpaidInvoices = invoices.filter((i: any) => i.status === "UNPAID");

  const collectedSalesToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);
  const receivableSalesToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const supplierExpensesToman = suppliers.reduce((acc: number, curr: any) => acc + (Number(curr.totalPayableToman) || 0), 0);
  const netBalanceToman = collectedSalesToman - supplierExpensesToman;

  // Multi-Criteria Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      // 1. Content category
      if (selectedCategory !== "ALL" && getAccountingItemCategory(inv) !== selectedCategory) return false;

      // 2. Customer
      if (filterCustomerId !== "ALL" && String(inv.customerId) !== String(filterCustomerId)) return false;

      // 3. Status
      if (filterStatus !== "ALL" && inv.status !== filterStatus) return false;

      // 4. Amount Range
      const amount = Number(inv.totalToman || 0);
      if (minAmount && !isNaN(Number(minAmount)) && amount < Number(minAmount)) return false;
      if (maxAmount && !isNaN(Number(maxAmount)) && amount > Number(maxAmount)) return false;

      // 5. Date Range (issuedAt or dueDate)
      const targetDateStr = filterDateType === "dueDate" ? inv.dueDate : (inv.issuedAt || inv.createdAt);
      if (targetDateStr) {
        const targetTime = new Date(targetDateStr).getTime();
        if (filterFromDate) {
          const fromTime = new Date(filterFromDate).getTime();
          if (targetTime < fromTime) return false;
        }
        if (filterToDate) {
          const toTime = new Date(filterToDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          if (targetTime > toTime) return false;
        }
      } else if (filterFromDate || filterToDate) {
        return false;
      }

      return true;
    });
  }, [invoices, selectedCategory, filterCustomerId, filterStatus, minAmount, maxAmount, filterFromDate, filterToDate, filterDateType]);

  const hasActiveFilters = Boolean(
    filterCustomerId !== "ALL" ||
    filterStatus !== "ALL" ||
    filterFromDate ||
    filterToDate ||
    minAmount ||
    maxAmount ||
    selectedCategory !== "ALL"
  );

  const resetAllFilters = () => {
    setSelectedCategory("ALL");
    setFilterCustomerId("ALL");
    setFilterStatus("ALL");
    setFilterFromDate("");
    setFilterToDate("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        return new Date(a.issuedAt || a.createdAt || 0).getTime() - new Date(b.issuedAt || b.createdAt || 0).getTime();
      }
      if (sortBy === "amount-desc") {
        return (b.totalToman || 0) - (a.totalToman || 0);
      }
      if (sortBy === "amount-asc") {
        return (a.totalToman || 0) - (b.totalToman || 0);
      }
      return new Date(b.issuedAt || b.createdAt || 0).getTime() - new Date(a.issuedAt || a.createdAt || 0).getTime();
    });
  }, [filteredInvoices, sortBy]);

  const totalInvoicePages = Math.ceil(sortedInvoices.length / PAGE_LIMIT) || 1;
  const paginatedInvoices = sortedInvoices.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  // Supplier Services Flattened List
  const allSupplierServices = useMemo(() => {
    const list: any[] = [];
    for (const sup of suppliers) {
      if (Array.isArray(sup.services)) {
        for (const svc of sup.services) {
          list.push({
            ...svc,
            supplierName: sup.name,
            supplierContact: sup.contactPerson || sup.email || sup.phone,
            supplierId: sup.id,
          });
        }
      }
    }
    return list;
  }, [suppliers]);

  // Filtered Supplier Services
  const filteredSupplierServices = useMemo(() => {
    return allSupplierServices.filter((svc: any) => {
      // 1. Content Category
      if (selectedSupplierCategory !== "ALL" && getSupplierItemCategory(svc) !== selectedSupplierCategory) return false;

      // 2. Specific Supplier
      if (filterSupplierId !== "ALL" && String(svc.supplierId) !== String(filterSupplierId)) return false;

      // 3. Status
      if (filterSupplierStatus !== "ALL" && svc.status !== filterSupplierStatus) return false;

      // 4. Amount Range
      const amount = Number(svc.monthlyExpenseToman || svc.priceToman || 0);
      if (minSupplierAmount && !isNaN(Number(minSupplierAmount)) && amount < Number(minSupplierAmount)) return false;
      if (maxSupplierAmount && !isNaN(Number(maxSupplierAmount)) && amount > Number(maxSupplierAmount)) return false;

      // 5. Date Range
      const targetDateStr = filterSupplierDateType === "purchaseDate" ? (svc.purchaseDate || svc.createdAt) : svc.renewalDate;
      if (targetDateStr) {
        const targetTime = new Date(targetDateStr).getTime();
        if (filterSupplierFromDate) {
          const fromTime = new Date(filterSupplierFromDate).getTime();
          if (targetTime < fromTime) return false;
        }
        if (filterSupplierToDate) {
          const toTime = new Date(filterSupplierToDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          if (targetTime > toTime) return false;
        }
      } else if (filterSupplierFromDate || filterSupplierToDate) {
        return false;
      }

      return true;
    });
  }, [allSupplierServices, selectedSupplierCategory, filterSupplierId, filterSupplierStatus, minSupplierAmount, maxSupplierAmount, filterSupplierFromDate, filterSupplierToDate, filterSupplierDateType]);

  const hasActiveSupplierFilters = Boolean(
    filterSupplierId !== "ALL" ||
    filterSupplierStatus !== "ALL" ||
    filterSupplierFromDate ||
    filterSupplierToDate ||
    minSupplierAmount ||
    maxSupplierAmount ||
    selectedSupplierCategory !== "ALL"
  );

  const resetAllSupplierFilters = () => {
    setSelectedSupplierCategory("ALL");
    setFilterSupplierId("ALL");
    setFilterSupplierStatus("ALL");
    setFilterSupplierFromDate("");
    setFilterSupplierToDate("");
    setMinSupplierAmount("");
    setMaxSupplierAmount("");
    setSupplierPage(1);
  };

  const sortedSupplierServices = useMemo(() => {
    return [...filteredSupplierServices].sort((a: any, b: any) => {
      if (supplierSortBy === "oldest") {
        return new Date(a.createdAt || a.purchaseDate || 0).getTime() - new Date(b.createdAt || b.purchaseDate || 0).getTime();
      }
      if (supplierSortBy === "amount-desc") {
        return (Number(b.monthlyExpenseToman || b.priceToman) || 0) - (Number(a.monthlyExpenseToman || a.priceToman) || 0);
      }
      if (supplierSortBy === "amount-asc") {
        return (Number(a.monthlyExpenseToman || a.priceToman) || 0) - (Number(b.monthlyExpenseToman || b.priceToman) || 0);
      }
      return new Date(b.createdAt || b.purchaseDate || 0).getTime() - new Date(a.createdAt || a.purchaseDate || 0).getTime();
    });
  }, [filteredSupplierServices, supplierSortBy]);

  const totalSupplierPages = Math.ceil(sortedSupplierServices.length / PAGE_LIMIT) || 1;
  const paginatedSupplierServices = sortedSupplierServices.slice((supplierPage - 1) * PAGE_LIMIT, supplierPage * PAGE_LIMIT);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup: any) => {
      if (filterSupplierId !== "ALL" && String(sup.id) !== String(filterSupplierId)) return false;
      if (filterSupplierStatus !== "ALL" && sup.status !== filterSupplierStatus) return false;
      if (selectedSupplierCategory !== "ALL") {
        const hasMatchingSvc = (sup.services || []).some(
          (s: any) => getSupplierItemCategory(s) === selectedSupplierCategory
        );
        if (!hasMatchingSvc) return false;
      }
      return true;
    });
  }, [suppliers, filterSupplierId, filterSupplierStatus, selectedSupplierCategory]);

  const handleRefresh = () => {
    refetchInvoices();
    refetchSuppliers();
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 animate-entrance">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              حسابداری، تراز مالی و گردش وجوه
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              بررسی همزمان درآمدها و وصولی‌های فروش در برابر هزینه‌ها و بدهی‌های تامین‌کنندگان زیرساخت
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
            <Link to="/invoices">
              <Button
                size="sm"
                className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                مدیریت فاکتورها
              </Button>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Collected Revenue */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">وصول‌شده ماه (فروش)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {collectedSalesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">فاکتورهای تایید و تسویه‌شده</span>
            </div>
          </div>

          {/* 2. Supplier Expenses */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">هزینه‌های تامین‌کنندگان</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                {supplierExpensesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">هزینه سرورها، هاست و لایسنس</span>
            </div>
          </div>

          {/* 3. Net Margin */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">تراز مالی (سود عملیاتی)</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  netBalanceToman >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netBalanceToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">تفاضل وصولی از کل هزینه‌ها</span>
            </div>
          </div>

          {/* 4. Customer Receivables */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">مطالبات معوق از مشتریان</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                {receivableSalesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">مانده فاکتورهای پرداخت‌نشده</span>
            </div>
          </div>
        </div>

        {/* Two-Tabs Navigation: Sales vs Procurement */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-1">
          <Button
            variant={activeTab === "sales" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sales")}
            className={`rounded-xl text-xs gap-2 cursor-pointer ${
              activeTab === "sales" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            فروش و درآمدها (مشتریان)
          </Button>

          <Button
            variant={activeTab === "procurement" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("procurement")}
            className={`rounded-xl text-xs gap-2 cursor-pointer ${
              activeTab === "procurement" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "text-muted-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            تامین و هزینه‌ها (تامین‌کنندگان)
          </Button>
        </div>

        {/* TAB 1: SALES & RECEIVABLES */}
        {activeTab === "sales" && (
          <div className="flex flex-col gap-4">
            {/* Content-Based Category Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold ml-1">دسته‌بندی موضوعی اسناد:</span>
              {ACCOUNTING_CONTENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setPage(1);
                    }}
                    className={`text-xs gap-1.5 rounded-xl h-8 cursor-pointer ${
                      selectedCategory === cat.id ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Comprehensive Multi-Filter Bar */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-xs backdrop-blur-xs flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">فیلترهای پیشرفته اسناد مالی و فاکتورها</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllFilters}
                      className="h-7 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-[11px] gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      پاکسازی فیلترها
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {filteredInvoices.length.toLocaleString("fa-IR")} سند یافت شد
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Customer Filter */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">فیلتر بر اساس مشتری:</span>
                  <select
                    value={filterCustomerId}
                    onChange={(e) => {
                      setFilterCustomerId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-8 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه مشتریان</option>
                    {customersList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Settlement Status Filter */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">وضعیت تسویه فاکتور:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-8 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value="PAID">وصول‌شده (پرداخت شده)</option>
                    <option value="UNPAID">مطالبه معوق (پرداخت نشده)</option>
                    <option value="CANCELLED">لغو شده</option>
                  </select>
                </div>

                {/* 3. Min Amount */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">حداقل مبلغ (تومان):</span>
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => {
                      setMinAmount(e.target.value);
                      setPage(1);
                    }}
                    placeholder="مثال: ۱۰۰۰۰۰"
                    className="h-8 text-xs bg-card"
                  />
                </div>

                {/* 4. Max Amount */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">حداکثر مبلغ (تومان):</span>
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => {
                      setMaxAmount(e.target.value);
                      setPage(1);
                    }}
                    placeholder="مثال: ۵۰۰۰۰۰۰"
                    className="h-8 text-xs bg-card"
                  />
                </div>
              </div>

              {/* Date Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/30 text-xs">
                {/* Date Criteria Toggle */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">مبنای تاریخ جستجو:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant={filterDateType === "issuedAt" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterDateType("issuedAt")}
                      className={`h-8 text-xs cursor-pointer ${
                        filterDateType === "issuedAt" ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      تاریخ صدور
                    </Button>
                    <Button
                      type="button"
                      variant={filterDateType === "dueDate" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterDateType("dueDate")}
                      className={`h-8 text-xs cursor-pointer ${
                        filterDateType === "dueDate" ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      تاریخ سررسید
                    </Button>
                  </div>
                </div>

                {/* From Date */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">از تاریخ (شمسی):</span>
                  <JalaliDatePicker
                    value={filterFromDate}
                    onChange={(iso) => {
                      setFilterFromDate(iso);
                      setPage(1);
                    }}
                  />
                </div>

                {/* To Date */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">تا تاریخ (شمسی):</span>
                  <JalaliDatePicker
                    value={filterToDate}
                    onChange={(iso) => {
                      setFilterToDate(iso);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground font-medium">مرتب‌سازی نتایج:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-8 rounded-xl border border-input bg-card/60 px-3 text-xs font-medium text-foreground shadow-xs focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="amount-desc">بیشترین مبلغ</option>
                  <option value="amount-asc">کمترین مبلغ</option>
                </select>
              </div>
            </div>

            {/* Invoices Table Card */}
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                    <tr>
                      <th className="py-3 px-4 text-[11px]">شماره فاکتور</th>
                      <th className="py-3 px-4 text-[11px]">مشتری</th>
                      <th className="py-3 px-4 text-[11px]">مبلغ کل</th>
                      <th className="py-3 px-4 text-[11px]">وضعیت تسویه</th>
                      <th className="py-3 px-4 text-[11px]">تاریخ صدور / شروع</th>
                      <th className="py-3 px-4 text-[11px]">تاریخ سررسید</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {loadingInvoices ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                          در حال بارگذاری اطلاعات فاکتورها...
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                          هیچ صورت‌حسابی با فیلترهای انتخابی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      paginatedInvoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                            {formatInvoiceNumber(inv.invoiceNumber || inv.id)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Link
                              to="/customers/$id"
                              params={{ id: String(inv.customerId) }}
                              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
                            >
                              <User className="h-3.5 w-3.5 opacity-60" />
                              <span>{inv.customer?.displayName || inv.customer?.name || inv.customerId}</span>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {(inv.totalToman || 0).toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                inv.status === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : inv.status === "UNPAID"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              }`}
                            >
                              {inv.status === "PAID"
                                ? "وصول‌شده (پرداخت شده)"
                                : inv.status === "UNPAID"
                                ? "مطالبه معوق (پرداخت نشده)"
                                : "لغو شده"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                            {formatJalaliDate(inv.issuedAt || inv.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                            {formatJalaliDate(inv.dueDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredInvoices.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 bg-muted/20 border-t text-xs">
                  <div className="text-muted-foreground font-medium">
                    نمایش {paginatedInvoices.length} از {sortedInvoices.length} سند (صفحه {page} از {totalInvoicePages})
                  </div>
                  {totalInvoicePages > 1 && (
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-7 text-xs px-2.5 rounded-lg"
                      >
                        قبلی
                      </Button>
                      {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`h-7 w-7 p-0 text-xs rounded-lg ${page === p ? "bg-emerald-600 text-white" : ""}`}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalInvoicePages, p + 1))}
                        disabled={page === totalInvoicePages}
                        className="h-7 text-xs px-2.5 rounded-lg"
                      >
                        بعدی
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROCUREMENT & EXPENSES */}
        {activeTab === "procurement" && (
          <div className="flex flex-col gap-4">
            {/* Content-Based Category Tabs for Procurement */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold ml-1">دسته‌بندی موضوعی اسناد تامین:</span>
              {ACCOUNTING_CONTENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedSupplierCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedSupplierCategory(cat.id);
                      setSupplierPage(1);
                    }}
                    className={`text-xs gap-1.5 rounded-xl h-8 cursor-pointer ${
                      selectedSupplierCategory === cat.id ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Comprehensive Multi-Filter Bar for Procurement */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-xs backdrop-blur-xs flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">فیلترهای پیشرفته هزینه‌ها و تامین‌کنندگان</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveSupplierFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllSupplierFilters}
                      className="h-7 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-[11px] gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      پاکسازی فیلترها
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {procurementView === "services"
                      ? `${filteredSupplierServices.length.toLocaleString("fa-IR")} قلم هزینه / سرویس تامین`
                      : `${filteredSuppliers.length.toLocaleString("fa-IR")} شرکت تامین‌کننده`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Supplier Filter */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">فیلتر بر اساس تامین‌کننده:</span>
                  <select
                    value={filterSupplierId}
                    onChange={(e) => {
                      setFilterSupplierId(e.target.value);
                      setSupplierPage(1);
                    }}
                    className="w-full h-8 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه شرکت‌های تامین‌کننده</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Supplier Status Filter */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">وضعیت همکاری / سرویس:</span>
                  <select
                    value={filterSupplierStatus}
                    onChange={(e) => {
                      setFilterSupplierStatus(e.target.value);
                      setSupplierPage(1);
                    }}
                    className="w-full h-8 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value="ACTIVE">فعال / جاری</option>
                    <option value="INACTIVE">غیرفعال / منقضی</option>
                  </select>
                </div>

                {/* 3. Amount Range (Min/Max) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">محدوده هزینه (تومان):</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="از مبلغ"
                      value={minSupplierAmount}
                      onChange={(e) => {
                        setMinSupplierAmount(e.target.value);
                        setSupplierPage(1);
                      }}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-muted-foreground text-[10px]">—</span>
                    <Input
                      type="number"
                      placeholder="تا مبلغ"
                      value={maxSupplierAmount}
                      onChange={(e) => {
                        setMaxSupplierAmount(e.target.value);
                        setSupplierPage(1);
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* 4. Date Range Type & Date Pickers */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">بازه زمانی تاریخ:</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setFilterSupplierDateType("renewalDate")}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          filterSupplierDateType === "renewalDate"
                            ? "bg-rose-500/20 text-rose-600 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        سررسید
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterSupplierDateType("purchaseDate")}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          filterSupplierDateType === "purchaseDate"
                            ? "bg-rose-500/20 text-rose-600 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        خرید / ثبت
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <JalaliDatePicker
                      placeholder="از تاریخ"
                      value={filterSupplierFromDate}
                      onChange={(iso) => {
                        setFilterSupplierFromDate(iso);
                        setSupplierPage(1);
                      }}
                    />
                    <JalaliDatePicker
                      placeholder="تا تاریخ"
                      value={filterSupplierToDate}
                      onChange={(iso) => {
                        setFilterSupplierToDate(iso);
                        setSupplierPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Procurement View Selector & Table Card */}
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
              <div className="p-4 px-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-foreground">هزینه‌ها و اسناد تامین زیرساخت</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/30 text-xs">
                    <Button
                      variant={procurementView === "services" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setProcurementView("services")}
                      className={`h-7 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                        procurementView === "services" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      ریز اقلام هزینه‌ای ({filteredSupplierServices.length})
                    </Button>
                    <Button
                      variant={procurementView === "suppliers" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setProcurementView("suppliers")}
                      className={`h-7 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                        procurementView === "suppliers" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      شرکت‌های تامین‌کننده ({filteredSuppliers.length})
                    </Button>
                  </div>

                  <Link to="/servers">
                    <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs">
                      مدیریت تامین‌کنندگان
                    </Button>
                  </Link>
                </div>
              </div>

              {/* View 1: Detailed Supplier Services / Expenses */}
              {procurementView === "services" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                      <tr>
                        <th className="py-3 px-4 text-[11px]">شرح خدمت / هزینه تامین</th>
                        <th className="py-3 px-4 text-[11px]">شرکت تامین‌کننده</th>
                        <th className="py-3 px-4 text-[11px]">دسته‌بندی موضوعی</th>
                        <th className="py-3 px-4 text-[11px]">هزینه ماهانه</th>
                        <th className="py-3 px-4 text-[11px]">وضعیت</th>
                        <th className="py-3 px-4 text-[11px]">تاریخ ثبت / خرید</th>
                        <th className="py-3 px-4 text-[11px]">سررسید تمدید</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {loadingSuppliers ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                            در حال بارگذاری لیست اقلام تامین‌کنندگان...
                          </td>
                        </tr>
                      ) : paginatedSupplierServices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                            هیچ قلم هزینه‌ای با فیلترهای انتخابی یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        paginatedSupplierServices.map((svc: any) => {
                          const catSlug = getSupplierItemCategory(svc);
                          const catMeta = ACCOUNTING_CONTENT_CATEGORIES.find((c) => c.id === catSlug) || ACCOUNTING_CONTENT_CATEGORIES[1];
                          const CatIcon = catMeta.icon;

                          return (
                            <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-foreground">
                                <div>{svc.name}</div>
                                {svc.notes && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{svc.notes}</div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-foreground">
                                {svc.supplierName || "—"}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted/60 text-muted-foreground border border-border/40">
                                  <CatIcon className="h-3 w-3" />
                                  {catMeta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400 font-mono">
                                {(Number(svc.monthlyExpenseToman || svc.priceToman) || 0).toLocaleString("fa-IR")}{" "}
                                <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    svc.status === "ACTIVE"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-muted/50 text-muted-foreground border-border/40"
                                  }`}
                                >
                                  {svc.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                                {formatJalaliDate(svc.purchaseDate || svc.createdAt)}
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                                {formatJalaliDate(svc.renewalDate)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Supplier Services Pagination */}
                  {totalSupplierPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 bg-muted/20 border-t text-xs">
                      <div className="text-muted-foreground font-medium">
                        نمایش {paginatedSupplierServices.length} از {sortedSupplierServices.length} قلم هزینه (صفحه {supplierPage} از {totalSupplierPages})
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                          disabled={supplierPage === 1}
                          className="h-7 text-xs px-2.5 rounded-lg"
                        >
                          قبلی
                        </Button>
                        {Array.from({ length: totalSupplierPages }, (_, i) => i + 1).map((p) => (
                          <Button
                            key={p}
                            variant={supplierPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSupplierPage(p)}
                            className={`h-7 w-7 p-0 text-xs rounded-lg ${supplierPage === p ? "bg-emerald-600 text-white" : ""}`}
                          >
                            {p}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                          disabled={supplierPage === totalSupplierPages}
                          className="h-7 text-xs px-2.5 rounded-lg"
                        >
                          بعدی
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Aggregated Suppliers Companies */}
              {procurementView === "suppliers" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                      <tr>
                        <th className="py-3 px-4 text-[11px]">نام تامین‌کننده</th>
                        <th className="py-3 px-4 text-[11px]">اطلاعات تماس</th>
                        <th className="py-3 px-4 text-[11px]">تعداد سرویس</th>
                        <th className="py-3 px-4 text-[11px]">مبلغ بدهی / هزینه ماهانه</th>
                        <th className="py-3 px-4 text-[11px]">وضعیت همکاری</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {loadingSuppliers ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                            در حال بارگذاری لیست تامین‌کنندگان...
                          </td>
                        </tr>
                      ) : filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                            هیچ تامین‌کننده‌ای با این فیلترها ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((sup: any) => (
                          <tr key={sup.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {sup.name}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {sup.contactPerson || sup.email || sup.phone || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {Number(sup.servicesCount || 0).toLocaleString("fa-IR")}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400 font-mono">
                              {(sup.totalPayableToman || 0).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  sup.status === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-muted/50 text-muted-foreground border-border/40"
                                }`}
                              >
                                {sup.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
