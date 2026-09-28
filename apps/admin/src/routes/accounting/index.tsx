import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { ModalPortal } from "@/components/common/modal-portal";
import { apiClient } from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { JalaliDatePicker } from "@/components/common/jalali-datepicker";
import { toast } from "sonner";
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
  MessageSquare,
  Headphones,
  Image,
  Tag,
  Filter,
  Calendar,
  CalendarDays,
  X,
  RotateCcw,
  Plus,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";

export const Route = createFileRoute("/accounting/")({
  component: AdminAccountingPage,
});

function getCategoryIcon(slug: string, name?: string) {
  const s = `${slug || ""} ${name || ""}`.toLowerCase();
  if (s.includes("domain") || s.includes("دامنه")) return Globe;
  if (s.includes("server") || s.includes("سرور") || s.includes("vps")) return Server;
  if (s.includes("host") || s.includes("هاست") || s.includes("میزبانی")) return HardDrive;
  if (s.includes("sms") || s.includes("پیامک") || s.includes("پیام")) return MessageSquare;
  if (s.includes("support") || s.includes("پشتیبانی") || s.includes("تیکت")) return Headphones;
  if (s.includes("image") || s.includes("تصویر") || s.includes("عکس")) return Image;
  if (s.includes("api") || s.includes("ai") || s.includes("هوش")) return Cpu;
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج")) return Package;
  return Tag;
}

function getAccountingItemCategory(item: any, categories: any[]): string {
  const invItem = item.items?.[0];
  const snapshotType = (
    invItem?.serviceTypeSnapshot ||
    invItem?.service?.serviceType?.slug ||
    invItem?.service?.serviceType?.name ||
    item.serviceType?.slug ||
    item.serviceType?.name ||
    ""
  ).toLowerCase();
  const title = (invItem?.title || item.name || "").toLowerCase();
  const text = (
    title + " " +
    (item.notes || "") + " " +
    (invItem?.description || "") + " " +
    (invItem?.serviceNameSnapshot || "")
  ).toLowerCase();

  for (const cat of categories) {
    const slug = (cat.slug || "").toLowerCase();
    const name = (cat.name || "").toLowerCase();
    const combined = `${slug} ${name}`;
    if (
      snapshotType.includes(slug) ||
      text.includes(slug) ||
      text.includes(name) ||
      combined.split(" ").some((kw) => kw.length > 2 && text.includes(kw))
    ) {
      return cat.slug;
    }
  }
  return "";
}

function getSupplierItemCategory(item: any, categories: any[]): string {
  const name = (item.name || "").toLowerCase();
  const notes = (item.notes || "").toLowerCase();
  const serviceTypeSlug = (item.serviceType?.slug || item.type || "").toLowerCase();
  const text = `${name} ${notes} ${serviceTypeSlug}`;

  for (const cat of categories) {
    const slug = (cat.slug || "").toLowerCase();
    const catName = (cat.name || "").toLowerCase();
    const combined = `${slug} ${catName}`;
    if (
      text.includes(slug) ||
      text.includes(catName) ||
      combined.split(" ").some((kw) => kw.length > 2 && text.includes(kw))
    ) {
      return cat.slug;
    }
  }
  return "";
}


function AdminAccountingPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "procurement">("sales");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 30;

  // Sales Filter States
  const [filterCustomerId, setFilterCustomerId] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Procurement Filter States
  const [filterSupplierId, setFilterSupplierId] = useState<string>("ALL");
  const [filterSupplierStatus, setFilterSupplierStatus] = useState<string>("ALL");
  const [filterSupplierFromDate, setFilterSupplierFromDate] = useState<string>("");
  const [filterSupplierToDate, setFilterSupplierToDate] = useState<string>("");
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

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/categories"),
  });
  const dynamicCategories = (categoriesData?.items || []).filter((c: any) => c.isActive);


  const queryClient = useQueryClient();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierNotes, setNewSupplierNotes] = useState("");

  const createSupplierMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/suppliers", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("تامین‌کننده جدید با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers", "accounting"] });
      setIsAddSupplierOpen(false);
      setNewSupplierName("");
      setNewSupplierContact("");
      setNewSupplierPhone("");
      setNewSupplierEmail("");
      setNewSupplierNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت تامین‌کننده");
    },
  });

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      toast.error("نام تامین‌کننده الزامی است");
      return;
    }
    createSupplierMutation.mutate({
      name: newSupplierName.trim(),
      contactPerson: newSupplierContact.trim() || undefined,
      phone: newSupplierPhone.trim() || undefined,
      email: newSupplierEmail.trim() || undefined,
      status: "ACTIVE",
      notes: newSupplierNotes.trim() || undefined,
    });
  };

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
      // 1. Customer
      if (filterCustomerId !== "ALL" && String(inv.customerId) !== String(filterCustomerId)) return false;

      // 2. Status
      if (filterStatus !== "ALL" && inv.status !== filterStatus) return false;

      // 3. Amount Range
      const amount = Number(inv.totalToman || 0);
      if (minAmount && !isNaN(Number(minAmount)) && amount < Number(minAmount)) return false;
      if (maxAmount && !isNaN(Number(maxAmount)) && amount > Number(maxAmount)) return false;

      // 5. Date Range
      const targetDateStr = inv.issuedAt || inv.createdAt;
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
  }, [invoices, filterCustomerId, filterStatus, minAmount, maxAmount, filterFromDate, filterToDate]);


  const hasActiveFilters = Boolean(
    filterCustomerId !== "ALL" ||
    filterStatus !== "ALL" ||
    filterFromDate ||
    filterToDate ||
    minAmount ||
    maxAmount
  );

  const resetAllFilters = () => {
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
      // 1. Specific Supplier
      if (filterSupplierId !== "ALL" && String(svc.supplierId) !== String(filterSupplierId)) return false;

      // 2. Status
      if (filterSupplierStatus !== "ALL" && svc.status !== filterSupplierStatus) return false;

      // 3. Amount Range
      const amount = Number(svc.monthlyExpenseToman || svc.priceToman || 0);
      if (minSupplierAmount && !isNaN(Number(minSupplierAmount)) && amount < Number(minSupplierAmount)) return false;
      if (maxSupplierAmount && !isNaN(Number(maxSupplierAmount)) && amount > Number(maxSupplierAmount)) return false;

      // 4. Date Range
      const targetDateStr = svc.renewalDate || svc.purchaseDate || svc.createdAt;
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
  }, [allSupplierServices, filterSupplierId, filterSupplierStatus, minSupplierAmount, maxSupplierAmount, filterSupplierFromDate, filterSupplierToDate]);

  const hasActiveSupplierFilters = Boolean(
    filterSupplierId !== "ALL" ||
    filterSupplierStatus !== "ALL" ||
    filterSupplierFromDate ||
    filterSupplierToDate ||
    minSupplierAmount ||
    maxSupplierAmount
  );

  const resetAllSupplierFilters = () => {
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
      return true;
    });
  }, [suppliers, filterSupplierId, filterSupplierStatus]);

  const handleRefresh = () => {
    refetchInvoices();
    refetchSuppliers();
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-8 animate-entrance">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              حسابداری، تراز مالی و گردش وجوه
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              بررسی همزمان درآمدها و وصولی‌های فروش در برابر هزینه‌ها و بدهی‌های تامین‌کنندگان زیرساخت
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
            <Link to="/invoices">
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
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
          <div className="rounded-2xl border border-border/50 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">وصول‌شده ماه (فروش)</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {collectedSalesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">فاکتورهای تایید و تسویه‌شده</span>
            </div>
          </div>

          {/* 2. Supplier Expenses */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">هزینه‌های تامین‌کنندگان</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                {supplierExpensesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">هزینه سرورها، هاست و لایسنس</span>
            </div>
          </div>

          {/* 3. Net Margin */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">تراز مالی (سود عملیاتی)</span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div
                className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                  netBalanceToman >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netBalanceToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">تفاضل وصولی از کل هزینه‌ها</span>
            </div>
          </div>

          {/* 4. Customer Receivables */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">مطالبات معوق از مشتریان</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {receivableSalesToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">مانده فاکتورهای پرداخت‌نشده</span>
            </div>
          </div>
        </div>

        {/* Two-Tabs Navigation: Sales vs Procurement */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border-b border-border/40 pb-2">
          <Button
            variant={activeTab === "sales" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sales")}
            className={`rounded-xl text-xs gap-2 cursor-pointer h-9 px-4 font-semibold justify-center sm:justify-start ${
              activeTab === "sales" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            فروش و درآمدها (مشتریان)
          </Button>

          <Button
            variant={activeTab === "procurement" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("procurement")}
            className={`rounded-xl text-xs gap-2 cursor-pointer h-9 px-4 font-semibold justify-center sm:justify-start ${
              activeTab === "procurement" ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs" : "text-muted-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            تامین و هزینه‌ها (تامین‌کنندگان)
          </Button>
        </div>

        {/* TAB 1: SALES & RECEIVABLES */}
        {activeTab === "sales" && (
          <div className="flex flex-col gap-4">
            {/* Comprehensive Multi-Filter Bar */}
            <div className="relative z-20 rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">فیلترهای اسناد مالی و فاکتورها</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllFilters}
                      className="h-8 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs gap-1.5 cursor-pointer rounded-xl"
                    >
                      <RotateCcw className="h-4 w-4" />
                      پاکسازی فیلترها
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {filteredInvoices.length.toLocaleString("fa-IR")} سند یافت شد
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Customer Filter */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">فیلتر بر اساس مشتری:</span>
                  <select
                    value={filterCustomerId}
                    onChange={(e) => {
                      setFilterCustomerId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-xs font-medium cursor-pointer"
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
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">وضعیت تسویه فاکتور:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value="PAID">وصول‌شده (پرداخت شده)</option>
                    <option value="UNPAID">مطالبه معوق (پرداخت نشده)</option>
                    <option value="CANCELLED">لغو شده</option>
                  </select>
                </div>

                {/* 3. Min Amount */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">حداقل مبلغ (تومان):</span>
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => {
                      setMinAmount(e.target.value);
                      setPage(1);
                    }}
                    placeholder="مثال: ۱۰۰۰۰۰"
                    className="h-9 text-xs bg-card rounded-xl font-mono"
                  />
                </div>

                {/* 4. Max Amount */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">حداکثر مبلغ (تومان):</span>
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => {
                      setMaxAmount(e.target.value);
                      setPage(1);
                    }}
                    placeholder="مثال: ۵۰۰۰۰۰۰"
                    className="h-9 text-xs bg-card rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Date Filters Row */}
              <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/30 text-xs">
                {/* From Date */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">از تاریخ (شمسی):</span>
                  <JalaliDatePicker
                    value={filterFromDate}
                    onChange={(iso) => {
                      setFilterFromDate(iso);
                      setPage(1);
                    }}
                  />
                </div>

                {/* To Date */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">تا تاریخ (شمسی):</span>
                  <JalaliDatePicker
                    value={filterToDate}
                    onChange={(iso) => {
                      setFilterToDate(iso);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Invoices Table Card */}
            <div className="relative z-10 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                    <tr>
                      <th className="py-3.5 px-5 text-xs">شماره فاکتور</th>
                      <th className="py-3.5 px-5 text-xs">مشتری</th>
                      <th className="py-3.5 px-5 text-xs">مبلغ کل</th>
                      <th className="py-3.5 px-5 text-xs">وضعیت تسویه</th>
                      <th className="py-3.5 px-5 text-xs">تاریخ صدور / شروع</th>
                      <th className="py-3.5 px-5 text-xs">تاریخ سررسید</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {loadingInvoices ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                          در حال بارگذاری اطلاعات فاکتورها...
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                          هیچ صورت‌حسابی با فیلترهای انتخابی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      paginatedInvoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-5 font-mono font-bold text-foreground">
                            {formatInvoiceNumber(inv.invoiceNumber || inv.id)}
                          </td>
                          <td className="py-4 px-5">
                            <Link
                              to="/customers/$id"
                              params={{ id: String(inv.customerId) }}
                              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
                            >
                              <User className="h-4 w-4 opacity-60" />
                              <span>{inv.customer?.displayName || inv.customer?.name || inv.customerId}</span>
                            </Link>
                          </td>
                          <td className="py-4 px-5 font-bold text-foreground font-mono">
                            {(inv.totalToman || 0).toLocaleString("fa-IR")}{" "}
                            <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
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
                          <td className="py-4 px-5 text-muted-foreground font-mono text-xs">
                            {formatJalaliDate(inv.issuedAt || inv.createdAt)}
                          </td>
                          <td className="py-4 px-5 text-muted-foreground font-mono text-xs">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 px-6 bg-muted/20 border-t text-xs">
                  <div className="text-muted-foreground font-medium">
                    نمایش {paginatedInvoices.length} از {sortedInvoices.length} سند (صفحه {page} از {totalInvoicePages})
                  </div>
                  {totalInvoicePages > 1 && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 text-xs px-3 rounded-xl"
                      >
                        قبلی
                      </Button>
                      {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 p-0 text-xs rounded-xl ${page === p ? "bg-emerald-600 text-white" : ""}`}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalInvoicePages, p + 1))}
                        disabled={page === totalInvoicePages}
                        className="h-8 text-xs px-3 rounded-xl"
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
            {/* Comprehensive Multi-Filter Bar for Procurement */}
            <div className="relative z-20 rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">فیلترهای هزینه‌ها و تامین‌کنندگان</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  {hasActiveSupplierFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllSupplierFilters}
                      className="h-8 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs gap-1.5 cursor-pointer rounded-xl"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Supplier Filter */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">فیلتر بر اساس تامین‌کننده:</span>
                  <select
                    value={filterSupplierId}
                    onChange={(e) => {
                      setFilterSupplierId(e.target.value);
                      setSupplierPage(1);
                    }}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-xs font-medium cursor-pointer"
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
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">وضعیت همکاری / سرویس:</span>
                  <select
                    value={filterSupplierStatus}
                    onChange={(e) => {
                      setFilterSupplierStatus(e.target.value);
                      setSupplierPage(1);
                    }}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value="ACTIVE">فعال / جاری</option>
                    <option value="INACTIVE">غیرفعال / منقضی</option>
                  </select>
                </div>

                {/* 3. Amount Range (Min/Max) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">محدوده هزینه (تومان):</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="از مبلغ"
                      value={minSupplierAmount}
                      onChange={(e) => {
                        setMinSupplierAmount(e.target.value);
                        setSupplierPage(1);
                      }}
                      className="h-9 text-xs font-mono rounded-xl bg-card"
                    />
                    <span className="text-muted-foreground text-xs">—</span>
                    <Input
                      type="number"
                      placeholder="تا مبلغ"
                      value={maxSupplierAmount}
                      onChange={(e) => {
                        setMaxSupplierAmount(e.target.value);
                        setSupplierPage(1);
                      }}
                      className="h-9 text-xs font-mono rounded-xl bg-card"
                    />
                  </div>
                </div>

                {/* 4. Date Range */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">بازه زمانی تاریخ (شمسی):</span>
                  <div className="grid grid-cols-2 gap-2">
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
                      align="left"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Procurement View Selector & Table Card */}
            <div className="relative z-10 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 sm:px-6 border-b border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-foreground">هزینه‌ها و اسناد تامین زیرساخت</h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/30 text-xs w-full sm:w-auto">
                    <Button
                      variant={procurementView === "services" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setProcurementView("services")}
                      className={`flex-1 sm:flex-initial h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                        procurementView === "services" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      ریز اقلام هزینه‌ای ({filteredSupplierServices.length})
                    </Button>
                    <Button
                      variant={procurementView === "suppliers" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setProcurementView("suppliers")}
                      className={`flex-1 sm:flex-initial h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                        procurementView === "suppliers" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      شرکت‌های تامین‌کننده ({filteredSuppliers.length})
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsAddSupplierOpen(true)}
                      className="flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      تعریف تامین‌کننده جدید
                    </Button>
                    <Link to="/servers" className="flex-1 sm:flex-initial">
                      <Button size="sm" variant="outline" className="w-full h-9 px-3 rounded-xl text-xs font-medium cursor-pointer">
                        مدیریت سرورها
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* View 1: Detailed Supplier Services / Expenses */}
              {procurementView === "services" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                      <tr>
                        <th className="py-3.5 px-5 text-xs">شرح خدمت / هزینه تامین</th>
                        <th className="py-3.5 px-5 text-xs">شرکت تامین‌کننده</th>
                        <th className="py-3.5 px-5 text-xs">دسته‌بندی موضوعی</th>
                        <th className="py-3.5 px-5 text-xs">هزینه ماهانه</th>
                        <th className="py-3.5 px-5 text-xs">وضعیت</th>
                        <th className="py-3.5 px-5 text-xs">تاریخ ثبت / خرید</th>
                        <th className="py-3.5 px-5 text-xs">سررسید تمدید</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {loadingSuppliers ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                            در حال بارگذاری لیست اقلام تامین‌کنندگان...
                          </td>
                        </tr>
                      ) : paginatedSupplierServices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                            هیچ قلم هزینه‌ای با فیلترهای انتخابی یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        paginatedSupplierServices.map((svc: any) => {
                          const catSlug = getSupplierItemCategory(svc, dynamicCategories);
                          const catData = dynamicCategories.find((c: any) => c.slug === catSlug);
                          const CatIcon = catSlug ? getCategoryIcon(catSlug, catData?.name) : Tag;
                          const catLabel = catData?.name || catSlug || "سایر";

                          return (
                            <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-4 px-5 font-bold text-foreground">
                                <div>{svc.name}</div>
                                {svc.notes && (
                                  <div className="text-[11px] text-muted-foreground mt-1">{svc.notes}</div>
                                )}
                              </td>
                              <td className="py-4 px-5 font-medium text-foreground">
                                {svc.supplierName || "—"}
                              </td>
                              <td className="py-4 px-5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/40">
                                  <CatIcon className="h-3.5 w-3.5" />
                                  {catLabel}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-bold text-rose-600 dark:text-rose-400 font-mono">
                                {(Number(svc.monthlyExpenseToman || svc.priceToman) || 0).toLocaleString("fa-IR")}{" "}
                                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
                              </td>
                              <td className="py-4 px-5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                    svc.status === "ACTIVE"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-muted/50 text-muted-foreground border-border/40"
                                  }`}
                                >
                                  {svc.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-muted-foreground font-mono text-xs">
                                {formatJalaliDate(svc.purchaseDate || svc.createdAt)}
                              </td>
                              <td className="py-4 px-5 text-muted-foreground font-mono text-xs">
                                {formatJalaliDate(svc.renewalDate)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Supplier Services Pagination */}
              {procurementView === "services" && totalSupplierPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 px-6 bg-muted/20 border-t text-xs">
                  <div className="text-muted-foreground font-medium">
                    نمایش {paginatedSupplierServices.length} از {sortedSupplierServices.length} قلم هزینه (صفحه {supplierPage} از {totalSupplierPages})
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                      disabled={supplierPage === 1}
                      className="h-8 text-xs px-3 rounded-xl"
                    >
                      قبلی
                    </Button>
                    {Array.from({ length: totalSupplierPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={supplierPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSupplierPage(p)}
                        className={`h-8 w-8 p-0 text-xs rounded-xl ${supplierPage === p ? "bg-emerald-600 text-white" : ""}`}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                      disabled={supplierPage === totalSupplierPages}
                      className="h-8 text-xs px-3 rounded-xl"
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}

              {/* View 2: Aggregated Suppliers Companies */}
              {procurementView === "suppliers" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                      <tr>
                        <th className="py-3.5 px-5 text-xs">نام تامین‌کننده</th>
                        <th className="py-3.5 px-5 text-xs">اطلاعات تماس</th>
                        <th className="py-3.5 px-5 text-xs">تعداد سرویس</th>
                        <th className="py-3.5 px-5 text-xs">مبلغ بدهی / هزینه ماهانه</th>
                        <th className="py-3.5 px-5 text-xs">وضعیت همکاری</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {loadingSuppliers ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            در حال بارگذاری لیست تامین‌کنندگان...
                          </td>
                        </tr>
                      ) : filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                            هیچ تامین‌کننده‌ای با این فیلترها ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((sup: any) => (
                          <tr key={sup.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-4 px-5 font-bold text-foreground">
                              {sup.name}
                            </td>
                            <td className="py-4 px-5 text-muted-foreground">
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

        {/* MODAL: ADD SUPPLIER */}
        {isAddSupplierOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !createSupplierMutation.isPending) setIsAddSupplierOpen(false);
              }}
            >
              <div className="relative w-full max-w-md m-auto rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">تعریف تامین‌کننده جدید</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ثبت شرکت یا شخص تامین‌کننده زیرساخت
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSupplierSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام تامین‌کننده / دیتاسنتر *</Label>
                  <Input
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="مثال: پارس آنلاین، آسیاتک، Hetzner، پیامک اول..."
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مسئول ارتباط</Label>
                    <Input
                      value={newSupplierContact}
                      onChange={(e) => setNewSupplierContact(e.target.value)}
                      placeholder="نام شخص رابط"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تلفن تماس</Label>
                    <Input
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value)}
                      placeholder="۰۲۱..."
                      dir="ltr"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">ایمیل ارتباطی</Label>
                  <Input
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    placeholder="support@datacenter.com"
                    dir="ltr"
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و یادداشت</Label>
                  <Input
                    value={newSupplierNotes}
                    onChange={(e) => setNewSupplierNotes(e.target.value)}
                    placeholder="توضیحات اختیاری..."
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddSupplierOpen(false)}
                    className="cursor-pointer text-xs h-9 rounded-xl"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSupplierMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer text-xs h-9 rounded-xl px-5"
                  >
                    {createSupplierMutation.isPending ? "در حال ثبت..." : "ثبت تامین‌کننده"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
      </div>
    </AppShell>
  );
}
