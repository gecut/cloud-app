import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { formatJalaliDate } from "@gecut-cloud/contracts";
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
} from "lucide-react";

export const Route = createFileRoute("/accounting/")({
  component: AdminAccountingPage,
});

function AdminAccountingPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "procurement">("sales");

  const { data: invoicesData, isLoading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ["admin", "invoices", "accounting"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/invoices?limit=100"),
  });

  const { data: suppliersData, isLoading: loadingSuppliers, refetch: refetchSuppliers } = useQuery({
    queryKey: ["admin", "suppliers", "accounting"],
    queryFn: () => apiClient<{ items: any[] }>("/suppliers?limit=100"),
  });

  const invoices = invoicesData?.items || [];
  const suppliers = suppliersData?.items || [];

  // Financial calculations
  const paidInvoices = invoices.filter((i: any) => i.status === "PAID");
  const unpaidInvoices = invoices.filter((i: any) => i.status === "UNPAID");

  const collectedSalesToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);
  const receivableSalesToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const supplierExpensesToman = suppliers.reduce((acc: number, curr: any) => acc + (curr.totalPayableToman || 0), 0);
  const netBalanceToman = collectedSalesToman - supplierExpensesToman;

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
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
            <div className="p-4 px-5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">فاکتورهای صادرشده و وضعیت وصولی‌ها</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                تعداد فاکتورها: {invoices.length.toLocaleString("fa-IR")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 text-[11px]">شماره فاکتور</th>
                    <th className="py-3 px-4 text-[11px]">مشتری</th>
                    <th className="py-3 px-4 text-[11px]">مبلغ کل</th>
                    <th className="py-3 px-4 text-[11px]">وضعیت تسویه</th>
                    <th className="py-3 px-4 text-[11px]">تاریخ صدور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        در حال بارگذاری اطلاعات فاکتورها...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        هیچ صورت‌حسابی هنوز ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          {inv.invoiceNumber || inv.id}
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
                          {formatJalaliDate(inv.issuedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROCUREMENT & EXPENSES */}
        {activeTab === "procurement" && (
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
            <div className="p-4 px-5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-500" />
                <h3 className="font-bold text-sm text-foreground">هزینه‌ها و بدهی‌های جاری به تامین‌کنندگان</h3>
              </div>
              <Link to="/servers">
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs">
                  مدیریت تامین‌کنندگان
                </Button>
              </Link>
            </div>

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
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        هیچ تامین‌کننده‌ای ثبت نشده است. از بخش تامین‌کنندگان می‌توانید اقدام به ثبت کنید.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup: any) => (
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
                        <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
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
          </div>
        )}
      </div>
    </AppShell>
  );
}
