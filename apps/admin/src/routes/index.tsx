import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import {
  Users,
  Server,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["admin", "customers", "dashboard"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/customers?limit=100"),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["admin", "services", "dashboard"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=200"),
  });

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["admin", "invoices", "dashboard"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/invoices?limit=200"),
  });

  const [revenueCardMode, setRevenueCardMode] = useState<"REVENUE" | "EXPENSES" | "TURNOVER">("REVENUE");
  const [marginCardMode, setMarginCardMode] = useState<"ACTIVE_ONLY" | "INCLUDE_CANCELLED">("ACTIVE_ONLY");

  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["admin", "suppliers", "dashboard"],
    queryFn: () => apiClient<{ items: any[] }>("/suppliers?limit=100"),
  });

  const { data: supplierServicesData } = useQuery({
    queryKey: ["admin", "suppliers", "services", "dashboard"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/suppliers/services?limit=200"),
  });

  const allCustomers = customersData?.items || [];
  const activeCustomersCount = allCustomers.filter((c: any) => c.status === "ACTIVE").length;
  const suspendedCustomersCount = allCustomers.filter((c: any) => c.status === "SUSPENDED").length;
  const inactiveCustomersCount = allCustomers.filter((c: any) => c.status === "INACTIVE" || c.deletedAt).length;
  const totalCustomersCount = customersData?.total ?? allCustomers.length;

  const allServices = servicesData?.items || [];
  // Active services must realistically count customer-assigned sub-services (excluding master catalog templates)
  const customerAssignedServices = allServices.filter((s: any) => Boolean(s.customerId));
  const activeServices = customerAssignedServices.filter((s: any) => s.status === "ACTIVE");
  const activeServicesCount = activeServices.length;
  const totalServicesCount = customerAssignedServices.length;

  const allInvoices = invoicesData?.items || [];
  const suppliersList = suppliersData?.items || [];
  const supplierServicesList = supplierServicesData?.items || [];

  // 1 month recent supplier expenses calculation (30 days)
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const lastMonthSupplierServices = supplierServicesList.filter((s: any) => {
    const pDate = new Date(s.purchaseDate || s.createdAt || 0).getTime();
    return pDate >= thirtyDaysAgo;
  });

  const lastMonthSupplierExpensesToman =
    lastMonthSupplierServices.length > 0
      ? lastMonthSupplierServices.reduce((sum: number, s: any) => sum + (Number(s.monthlyExpenseToman ?? s.priceToman) || 0), 0)
      : suppliersList.reduce((acc: number, curr: any) => acc + (Number(curr.totalPayableToman) || 0), 0);

  // Monthly cash flow (گردش مالی ماهانه = فاکتورهای وصول‌شده فروش + هزینه‌های پرداختی تامین‌کنندگان)
  const paidInvoices = allInvoices.filter((inv: any) => inv.status === "PAID");
  const collectedSalesToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const supplierMonthlyExpensesToman = suppliersList.reduce(
    (acc: number, curr: any) => acc + (Number(curr.totalPayableToman) || 0),
    0,
  );

  const monthlyTurnoverToman = collectedSalesToman + supplierMonthlyExpensesToman;

  // This month's projected revenue: all non-cancelled invoices (PAID + UNPAID)
  const nonCancelledInvoices = allInvoices.filter((inv: any) => inv.status !== "CANCELLED");
  const projectedRevenueToman = nonCancelledInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  // Cancelled invoices
  const cancelledInvoices = allInvoices.filter((inv: any) => inv.status === "CANCELLED");
  const cancelledTotalToman = cancelledInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);
  const allInvoicesTotalToman = allInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  // Projected Net Margin = Projected Revenue - Supplier Expenses
  const projectedNetBalanceToman = projectedRevenueToman - supplierMonthlyExpensesToman;
  const netBalanceWithCancelledToman = allInvoicesTotalToman - supplierMonthlyExpensesToman;

  // Supplier monthly commitment period selection (past 12 months + all time)
  const [selectedPeriodMonth, setSelectedPeriodMonth] = useState<number | "ALL">(0);

  const monthOptions = useMemo(() => {
    const options: { value: number | "ALL"; label: string }[] = [
      { value: 0, label: "دوره جاری (این ماه)" },
    ];
    const n = new Date();
    for (let i = 1; i <= 12; i++) {
      const target = new Date(n.getFullYear(), n.getMonth() - i, 15);
      const label = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "long",
      }).format(target);
      options.push({ value: i, label });
    }
    options.push({ value: "ALL", label: "کل دوره‌ها (مجموع همیشگی)" });
    return options;
  }, []);

  const [breakdownViewMode, setBreakdownViewMode] = useState<"BOTH" | "SUPPLIERS" | "SERVICES">("BOTH");

  const periodBreakdownData = useMemo(() => {
    const isAll = selectedPeriodMonth === "ALL";
    const offset = isAll ? 0 : Number(selectedPeriodMonth);
    const n = new Date();
    const targetDate = new Date(n.getFullYear(), n.getMonth() - offset, 15);
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getTime();
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).getTime();

    // 1. Supplier Services in this period
    const matchingSupplierServices = isAll
      ? supplierServicesList
      : supplierServicesList.filter((s: any) => {
          const pDate = s.purchaseDate || s.createdAt ? new Date(s.purchaseDate || s.createdAt).getTime() : 0;
          const rDate = s.renewalDate ? new Date(s.renewalDate).getTime() : Infinity;
          if (offset === 0) return true;
          return pDate <= monthEnd && rDate >= monthStart;
        });

    const supplierTotalToman =
      matchingSupplierServices.length > 0
        ? matchingSupplierServices.reduce(
            (sum: number, s: any) => sum + (Number(s.priceToman ?? s.monthlyExpenseToman) || 0),
            0,
          )
        : isAll || offset === 0
        ? supplierMonthlyExpensesToman
        : 0;

    const supplierCount =
      matchingSupplierServices.length || (isAll || offset === 0 ? suppliersList.length : 0);

    // 2. Customer Services in this period
    const matchingCustomerServices = isAll
      ? allServices.filter((s: any) => s.status === "ACTIVE" || Boolean(s.customerId))
      : allServices.filter((s: any) => {
          const pDate = s.purchaseDate || s.startDate || s.createdAt
            ? new Date(s.purchaseDate || s.startDate || s.createdAt).getTime()
            : 0;
          const rDate = s.renewalDate ? new Date(s.renewalDate).getTime() : Infinity;
          if (offset === 0) return s.status === "ACTIVE";
          return pDate <= monthEnd && rDate >= monthStart;
        });

    const customerServicesTotalToman = matchingCustomerServices.reduce(
      (sum: number, s: any) => sum + (Number(s.priceToman || s.price || 0) || 0),
      0,
    );
    const customerServicesCount = matchingCustomerServices.length;

    // 3. Net Balance
    const netPeriodBalanceToman = customerServicesTotalToman - supplierTotalToman;

    const monthLabel = isAll
      ? "کل دوره‌ها"
      : new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
          year: "numeric",
          month: "long",
        }).format(targetDate);

    return {
      supplierTotalToman,
      supplierCount,
      customerServicesTotalToman,
      customerServicesCount,
      netPeriodBalanceToman,
      label: monthLabel,
    };
  }, [
    supplierServicesList,
    suppliersList,
    allServices,
    selectedPeriodMonth,
    supplierMonthlyExpensesToman,
  ]);

  // Unpaid invoices
  const unpaidInvoices = allInvoices.filter((inv: any) => inv.status === "UNPAID");
  const unpaidCount = unpaidInvoices.length;
  const unpaidTotalToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-8 animate-entrance">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                مرکز عملیات و زیرساخت
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                وضعیت پایدار
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              دید کلی و بی‌درنگ از مشترکین، سرویس‌های فعال، پیش‌بینی درآمدها و جریان مالی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/customers">
              <Button size="sm" className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer">
                <PlusCircle className="h-3.5 w-3.5" />
                تعریف مشتری
              </Button>
            </Link>
            <Link to="/invoices">
              <Button size="sm" variant="outline" className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer">
                <FileText className="h-3.5 w-3.5" />
                صدور صورت‌حساب
              </Button>
            </Link>
          </div>
        </div>

        {/* Minimalist Metric Cards Grid (Bento Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Customers Overview */}
          <Link
            to="/customers"
            className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">وضعیت کلی مشترکین</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {loadingCustomers ? "..." : Number(totalCustomersCount).toLocaleString("fa-IR")}
                </span>
                <span className="text-xs text-muted-foreground font-medium">کل پرونده‌ها</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activeCustomersCount.toLocaleString("fa-IR")} فعال
                </span>
                {(suspendedCustomersCount > 0 || inactiveCustomersCount > 0) ? (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {suspendedCustomersCount.toLocaleString("fa-IR")} معلق
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {inactiveCustomersCount.toLocaleString("fa-IR")} غیرفعال/حذف
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground mr-1">همه مشترکین فعال هستند</span>
                )}
              </div>
            </div>
          </Link>

          {/* 2. Active Services (Prominently showing active count) */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">سرویس‌های فعال</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {loadingServices ? "..." : Number(activeServicesCount).toLocaleString("fa-IR")}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  از {Number(totalServicesCount).toLocaleString("fa-IR")} کل
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground font-medium">سرویس‌های عملیاتی آنلاین و فعال</span>
              </div>
            </div>
          </div>

          {/* 3. Monthly Turnover & Projected Revenue (with in-box filter) */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={revenueCardMode}
                  onChange={(e) => setRevenueCardMode(e.target.value as any)}
                  className="text-xs font-bold text-foreground bg-transparent border-none outline-none cursor-pointer p-0 hover:text-emerald-600 transition-colors"
                >
                  <option value="REVENUE" className="bg-card text-foreground">پیش‌بینی درآمد ماه</option>
                  <option value="EXPENSES" className="bg-card text-foreground">خرج‌های ۱ ماه اخیر</option>
                  <option value="TURNOVER" className="bg-card text-foreground">گردش مالی ماهانه</option>
                </select>
              </div>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform shrink-0">
                {revenueCardMode === "EXPENSES" ? (
                  <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                revenueCardMode === "EXPENSES" ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}>
                {revenueCardMode === "REVENUE"
                  ? projectedRevenueToman.toLocaleString("fa-IR")
                  : revenueCardMode === "EXPENSES"
                  ? lastMonthSupplierExpensesToman.toLocaleString("fa-IR")
                  : monthlyTurnoverToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                {revenueCardMode === "REVENUE" ? (
                  <>
                    <span>گردش مالی: {monthlyTurnoverToman.toLocaleString("fa-IR")} ت</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">(فاکتورهای معتبر)</span>
                  </>
                ) : revenueCardMode === "EXPENSES" ? (
                  <>
                    <span>کل فاکتورهای تامین: {suppliersList.length.toLocaleString("fa-IR")} تامین‌کننده</span>
                    <span className="text-rose-500 font-semibold font-sans">(۳۰ روز گذشته)</span>
                  </>
                ) : (
                  <>
                    <span>فروش: {collectedSalesToman.toLocaleString("fa-IR")} ت</span>
                    <span>تامین: {supplierMonthlyExpensesToman.toLocaleString("fa-IR")} ت</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4. Supplier Expenses & Net Balance (with include-cancelled filter) */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={marginCardMode}
                  onChange={(e) => setMarginCardMode(e.target.value as any)}
                  className="text-xs font-bold text-foreground bg-transparent border-none outline-none cursor-pointer p-0 hover:text-emerald-600 transition-colors"
                >
                  <option value="ACTIVE_ONLY" className="bg-card text-foreground">سود خالص (فاکتورهای معتبر)</option>
                  <option value="INCLUDE_CANCELLED" className="bg-card text-foreground">سود خالص (با احتساب لغوشده‌ها)</option>
                </select>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                (marginCardMode === "ACTIVE_ONLY" ? projectedNetBalanceToman : netBalanceWithCancelledToman) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                {(marginCardMode === "ACTIVE_ONLY" ? projectedNetBalanceToman : netBalanceWithCancelledToman).toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان تراز</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                {marginCardMode === "ACTIVE_ONLY" ? (
                  <>
                    <span>هزینه تامین: {supplierMonthlyExpensesToman.toLocaleString("fa-IR")} ت</span>
                    <span className="font-semibold text-foreground">بدون لغوشده</span>
                  </>
                ) : (
                  <>
                    <span>کل فاکتورها: {allInvoicesTotalToman.toLocaleString("fa-IR")} ت</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold font-sans">
                      (لغوشده: {cancelledTotalToman.toLocaleString("fa-IR")} ت)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier & Customer Services Period Breakdown Card */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-purple-500/5 via-card to-emerald-500/5 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          {/* Top Bar: Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  گزارش تفکیکی دوره‌ای: تامین‌کنندگان و سرویس‌ها ({periodBreakdownData.label})
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  محاسبه و مقایسه همزمان مخارج تامین زیرساخت و مبالغ دوره‌ای سرویس‌های مشتریان
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setBreakdownViewMode("BOTH")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownViewMode === "BOTH"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  هر دو (تراز جامع)
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownViewMode("SUPPLIERS")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownViewMode === "SUPPLIERS"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  مخارج تامین
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownViewMode("SERVICES")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownViewMode === "SERVICES"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  مبالغ سرویس‌ها
                </button>
              </div>

              {/* Month Selector */}
              <select
                value={String(selectedPeriodMonth)}
                onChange={(e) =>
                  setSelectedPeriodMonth(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                }
                className="h-8 text-xs rounded-xl border border-input bg-card px-3 text-foreground font-semibold shadow-xs focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Supplier Periodic Expenses */}
            {(breakdownViewMode === "BOTH" || breakdownViewMode === "SUPPLIERS") && (
              <div className={`rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 flex flex-col justify-between ${
                breakdownViewMode === "SUPPLIERS" ? "sm:col-span-3" : ""
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                    مخارج دوره تامین‌کنندگان
                  </span>
                  <Link to="/servers">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5">
                      تامین‌کنندگان
                      <ArrowLeft className="h-2.5 w-2.5" />
                    </span>
                  </Link>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                    {periodBreakdownData.supplierTotalToman.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">تومان</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  بر اساس {periodBreakdownData.supplierCount.toLocaleString("fa-IR")} سرویس تامین‌کننده در {periodBreakdownData.label}
                </span>
              </div>
            )}

            {/* 2. Customer Services Periodic Amount */}
            {(breakdownViewMode === "BOTH" || breakdownViewMode === "SERVICES") && (
              <div className={`rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex flex-col justify-between ${
                breakdownViewMode === "SERVICES" ? "sm:col-span-3" : ""
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    مبالغ دوره سرویس‌های مشتریان
                  </span>
                  <Link to="/services">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                      سرویس‌ها
                      <ArrowLeft className="h-2.5 w-2.5" />
                    </span>
                  </Link>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {periodBreakdownData.customerServicesTotalToman.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">تومان</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  بر اساس {periodBreakdownData.customerServicesCount.toLocaleString("fa-IR")} سرویس فعال مشترکین در {periodBreakdownData.label}
                </span>
              </div>
            )}

            {/* 3. Net Balance / Profit for Period */}
            {breakdownViewMode === "BOTH" && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    تراز و سود خالص دوره‌ای
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    periodBreakdownData.netPeriodBalanceToman >= 0
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}>
                    {periodBreakdownData.netPeriodBalanceToman >= 0 ? "تراز مثبت" : "کسری دوره"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={`text-lg font-black font-mono ${
                    periodBreakdownData.netPeriodBalanceToman >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {periodBreakdownData.netPeriodBalanceToman.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">تومان</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  تفاضل مبالغ سرویس‌ها از مخارج تامین در {periodBreakdownData.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Suspended / Inactive Customers Alert Strip (if any) */}
        {(suspendedCustomersCount > 0 || inactiveCustomersCount > 0) && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-foreground">
                  هشدار پرونده‌های معلق یا غیرفعال: {(suspendedCustomersCount + inactiveCustomersCount).toLocaleString("fa-IR")} مشترک نیازمند پیگیری
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  تعداد <span className="font-bold text-amber-600 dark:text-amber-400">{suspendedCustomersCount.toLocaleString("fa-IR")} مشتری معلق</span> و{" "}
                  <span className="font-bold text-rose-600 dark:text-rose-400">{inactiveCustomersCount.toLocaleString("fa-IR")} مشتری غیرفعال یا حذف‌شده</span> در سامانه وجود دارد.
                </p>
              </div>
            </div>
            <Link to="/customers">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-rose-500/30 hover:bg-rose-500/10 text-rose-700 dark:text-rose-300">
                مشاهده لیست مشترکین
                <ArrowLeft className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* Pending Invoices Strip Alert (if any) */}
        {unpaidCount > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-foreground">
                  تعداد {unpaidCount.toLocaleString("fa-IR")} صورت‌حساب باز و در انتظار پرداخت
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  مجموع مطالبات معوق فروش: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{unpaidTotalToman.toLocaleString("fa-IR")} تومان</span>
                </p>
              </div>
            </div>
            <Link to="/invoices">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                پیگیری فاکتورها
                <ArrowLeft className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* Two-Column Overview Tables (Sleek Minimal Design) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Services */}
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">سرویس‌های هاستینگ اخیر</h3>
              </div>
              <Link to="/services">
                <Button variant="ghost" size="sm" className="h-7 px-2.5 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  مشاهده تمام سرویس‌ها
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border/20 text-xs">
              {(servicesData?.items || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  هنوز سرویسی تعریف نشده است
                </div>
              ) : (
                (servicesData?.items || []).map((svc: any) => (
                  <div key={svc.id} className="flex items-center justify-between p-3.5 px-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Server className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground">{svc.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {svc.id} • تعداد: {(svc.quantity || 1).toLocaleString("fa-IR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground">
                        {(svc.priceToman || 0).toLocaleString("fa-IR")} <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          svc.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {svc.status === "ACTIVE" ? "فعال" : svc.status === "SUSPENDED" ? "معلق" : "غیرفعال"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <h3 className="font-bold text-sm text-foreground">صورت‌حساب‌های اخیر</h3>
              </div>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="h-7 px-2.5 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  مشاهده تمام فاکتورها
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border/20 text-xs">
              {(invoicesData?.items || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  صورت‌حسابی یافت نشد
                </div>
              ) : (
                (invoicesData?.items || []).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3.5 px-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs font-mono text-foreground">{inv.invoiceNumber || inv.id}</span>
                        <span className="text-[10px] text-muted-foreground">{inv.notes || "صورت‌حساب دوره‌ای زیرساخت"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground">
                        {(inv.totalToman || 0).toLocaleString("fa-IR")} <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : inv.status === "UNPAID"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {inv.status === "PAID"
                          ? "پرداخت شده"
                          : inv.status === "UNPAID"
                          ? "پرداخت نشده"
                          : "لغو شده"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

