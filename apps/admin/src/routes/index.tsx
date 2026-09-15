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
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/customers?limit=5"),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=5"),
  });

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["admin", "invoices"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/invoices?limit=5"),
  });

  const customersCount = customersData?.total ?? 0;
  const servicesCount = servicesData?.total ?? 0;
  const invoicesCount = invoicesData?.total ?? 0;
  
  // Calculate total unpaid invoices
  const unpaidInvoices = invoicesData?.items?.filter((inv: any) => inv.status === "UNPAID") || [];
  const unpaidCount = unpaidInvoices.length;

  // Calculate estimated total revenue
  const totalRevenue = servicesData?.items?.reduce((acc: number, curr: any) => acc + (curr.priceToman || 0), 0) || 0;

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
              دید کلی و بی‌درنگ از مشترکین، ماشین‌های هاستینگ، سرورها و جریان مالی
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
          {/* Customers */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">مشترکین فعال</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {loadingCustomers ? "..." : Number(customersCount).toLocaleString("fa-IR")}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground font-medium">سازمان‌ها و اشخاص طرف قرارداد</span>
              </div>
            </div>
          </div>

          {/* Hosting Services */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">سرویس‌ها و هاستینگ</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {loadingServices ? "..." : Number(servicesCount).toLocaleString("fa-IR")}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground font-medium">سرویس‌های عملیاتی آنلاین</span>
              </div>
            </div>
          </div>

          {/* Monthly Turnover */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">گردش مالی ماهانه</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                {totalRevenue.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">+12.4%</span>
                <span className="text-[11px] text-muted-foreground">نسبت به دوره قبل</span>
              </div>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-amber-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">صورت‌حساب‌های باز</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                {loadingInvoices ? "..." : Number(unpaidCount).toLocaleString("fa-IR")}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[11px] text-muted-foreground font-medium">فاکتورهای پرداخت‌نشده</span>
              </div>
            </div>
          </div>
        </div>

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
            <div className="divide-y divide-border/20 text-xs">
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
                        <span className="text-[10px] text-muted-foreground font-mono">{svc.id}</span>
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
            <div className="divide-y divide-border/20 text-xs">
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

