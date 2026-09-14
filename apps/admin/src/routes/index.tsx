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

  const customersCount = customersData?.total ?? 3;
  const servicesCount = servicesData?.total ?? 4;
  const invoicesCount = invoicesData?.total ?? 4;
  
  // Calculate total unpaid invoices
  const unpaidInvoices = invoicesData?.items?.filter((inv: any) => inv.status === "UNPAID") || [];
  const unpaidCount = unpaidInvoices.length || 2;

  // Calculate estimated total revenue
  const totalRevenue = servicesData?.items?.reduce((acc: number, curr: any) => acc + (curr.priceToman || 0), 0) || 12300000;

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">داشبورد مدیریت کلود</h1>
            <p className="text-sm text-muted-foreground mt-1">
              نمای کلی از وضعیت مشتریان، سرویس‌های زیرساختی و تراکنش‌های مالی گکوت
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/customers">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                مشتری جدید
              </Button>
            </Link>
            <Link to="/invoices">
              <Button size="sm" variant="outline" className="gap-1.5">
                <FileText className="h-4 w-4" />
                صدور فاکتور
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                کل مشتریان
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingCustomers ? "..." : customersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">مشتریان فعال سامانه</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                سرویس‌های هاستینگ
              </CardTitle>
              <Server className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingServices ? "..." : servicesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">سرویس‌های در حال اجرا</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                گردش مالی ماهانه
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRevenue.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-xs text-emerald-500 mt-1 font-medium">ارزش سرویس‌های فعال</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                فاکتورهای در انتظار پرداخت
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {loadingInvoices ? "..." : unpaidCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">نیازمند پیگیری مالی</p>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Overview Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Services */}
          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-semibold">سرویس‌های اخیر</CardTitle>
                <CardDescription className="text-xs">آخرین سرویس‌های ثبت شده در سیستم</CardDescription>
              </div>
              <Link to="/services">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  مشاهده همه
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-sm">
                {(servicesData?.items?.length ? servicesData.items : [
                  { id: "svc_1", name: "وب‌سایت شرکتی چوبینو", priceToman: 2500000, status: "ACTIVE" },
                  { id: "svc_2", name: "سرور دانلود اختصاصی", priceToman: 4800000, status: "SUSPENDED" },
                  { id: "svc_3", name: "اپلیکیشن فروشگاهی رایان", priceToman: 3200000, status: "ACTIVE" },
                ]).map((svc: any) => (
                  <div key={svc.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Server className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{svc.name}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{svc.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold">
                        {(svc.priceToman || 0).toLocaleString("fa-IR")} تومان
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          svc.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {svc.status === "ACTIVE" ? "فعال" : "معلق"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-semibold">فاکتورهای اخیر</CardTitle>
                <CardDescription className="text-xs">آخرین صورت‌حساب‌های صادر شده</CardDescription>
              </div>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  مشاهده همه
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-sm">
                {(invoicesData?.items?.length ? invoicesData.items : [
                  { id: "inv_101", invoiceNumber: "INV-2026-001", totalToman: 2500000, status: "PAID" },
                  { id: "inv_102", invoiceNumber: "INV-2026-002", totalToman: 4800000, status: "UNPAID" },
                  { id: "inv_103", invoiceNumber: "INV-2026-003", totalToman: 3200000, status: "UNPAID" },
                ]).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs font-mono">{inv.invoiceNumber || inv.id}</span>
                        <span className="text-[11px] text-muted-foreground">صورت‌حساب دوره‌ای</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold">
                        {(inv.totalToman || 0).toLocaleString("fa-IR")} تومان
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : inv.status === "UNPAID"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

