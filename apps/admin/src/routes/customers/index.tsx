import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import {
  Users,
  Search,
  Plus,
  Building,
  Phone,
  Mail,
  CheckCircle,
  X,
  RefreshCw,
  ChevronLeft,
  Eye,
  Clock,
  User,
  Server,
  AlertTriangle,
  Ban,
} from "lucide-react";

import { normalizePhoneNumber } from "@/utils/phone";

export const Route = createFileRoute("/customers/")({
  component: AdminCustomersListPage,
});

function AdminCustomersListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customers", searchTerm],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        `/customers?page=1&limit=50${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`,
      ),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (newCustomer: { name: string; email?: string; phone?: string; company?: string }) =>
      apiClient("/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      }),
    onSuccess: () => {
      toast.success("مشتری جدید با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد مشتری");
    },
  });

  const toggleCustomerStatusMutation = useMutation({
    mutationFn: ({ customerId, newStatus }: { customerId: string; newStatus: "ACTIVE" | "INACTIVE" }) =>
      apiClient(`/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.newStatus === "ACTIVE"
          ? "مشتری با موفقیت فعال گردید"
          : "مشتری با موفقیت غیرفعال شد",
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در تغییر وضعیت مشتری");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام مشتری الزامی است");
      return;
    }
    const cleanPhone = phone ? normalizePhoneNumber(phone) : undefined;
    createCustomerMutation.mutate({
      name,
      email: email || undefined,
      phone: cleanPhone,
      company: company || undefined,
    });
  };

  const customersList = data?.items || [];
  const filteredList = customersList.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm),
  );

  const getNearestExpiringService = (services?: any[]) => {
    if (!services || services.length === 0) return null;
    const now = Date.now();
    const withRenewal = services
      .filter((s: any) => s.renewalDate)
      .map((s: any) => {
        const diffMs = new Date(s.renewalDate).getTime() - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...s, daysLeft };
      })
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

    return withRenewal[0] || null;
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 animate-entrance">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              مدیریت مشتریان و سازمان‌ها
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              مشاهده پرونده، سرویس‌های زیرساخت و دسترسی مشترکین حقیقی و حقوقی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              مشتری جدید
            </Button>
          </div>
        </div>

        {/* Modal / Create Drawer */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">ثبت مشتری جدید در سامانه</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-8 w-8 hover:bg-muted/50"
                  onClick={() => setIsCreateOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="cname" className="text-xs font-semibold text-foreground/80">
                    نام و نام خانوادگی / مسئول *
                  </Label>
                  <Input
                    id="cname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علیرضا پارسا"
                    className="rounded-xl border-border/60 bg-background/50 h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ccomp" className="text-xs font-semibold text-foreground/80">
                    نام شرکت / سازمان یا برند
                  </Label>
                  <Input
                    id="ccomp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="مثال: شرکت نوآوران داده گستر"
                    className="rounded-xl border-border/60 bg-background/50 h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cphone" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      شماره موبایل (جهت ورود مشترک با OTP) *
                    </Label>
                    <Input
                      id="cphone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09121112233"
                      dir="ltr"
                      className="font-mono rounded-xl border-border/60 bg-background/50 h-9 text-xs text-center"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cemail" className="text-xs font-semibold text-foreground/80">
                      پست الکترونیک (ایمیل)
                    </Label>
                    <Input
                      id="cemail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@company.com"
                      dir="ltr"
                      className="font-mono rounded-xl border-border/60 bg-background/50 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createCustomerMutation.isPending}
                    className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
                  >
                    {createCustomerMutation.isPending ? "در حال ثبت..." : "ثبت مشتری"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
            <Input
              placeholder="جستجو بر اساس نام، شرکت یا شماره تماس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-9 text-xs rounded-xl border-border/60 bg-card/40 backdrop-blur-xs focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        {filteredList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-muted/40 text-muted-foreground">
              <Users className="h-8 w-8" />
            </div>
            <div className="text-sm font-bold text-foreground">مشتری‌ای یافت نشد</div>
            <p className="text-xs text-muted-foreground max-w-sm">
              هیچ مشترکی با این مشخصات ثبت نشده است یا عبارت جستجو با داده‌ها همخوانی ندارد.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 h-9 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 ml-1" />
              ثبت اولین مشتری
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredList.map((customer: any) => {
              const nearestService = getNearestExpiringService(customer.services);
              const servicesCount = customer.services?.length ?? customer._count?.services ?? 0;
              const invoicesCount = customer.invoices?.length ?? customer._count?.invoices ?? 0;

              return (
                <div
                  key={customer.id}
                  className={`relative rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between group overflow-hidden ${
                    customer.status === "INACTIVE"
                      ? "border-rose-500/30 bg-rose-500/[0.02]"
                      : "border-border/50 bg-card/40 backdrop-blur-xs hover:border-emerald-500/30 hover:shadow-md"
                  }`}
                >
                  <div
                    className={
                      customer.status === "INACTIVE"
                        ? "filter blur-[2px] opacity-40 select-none pointer-events-none transition-all"
                        : "transition-all"
                    }
                  >
                    {/* Header: Name & Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/30">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          {customer.name}
                        </span>
                        {(customer.displayName || customer.company) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3 opacity-60 shrink-0" />
                            {customer.displayName || customer.company}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                          customer.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : customer.status === "INACTIVE"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {customer.status === "ACTIVE" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                        {customer.status === "ACTIVE"
                          ? "فعال"
                          : customer.status === "INACTIVE"
                          ? "غیرفعال"
                          : "معلق"}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-col gap-1.5 py-3 text-xs text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">شماره تماس:</span>
                          <span className="font-mono text-[11px] text-foreground dir-ltr font-medium">
                            {customer.phone}
                          </span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]">ایمیل:</span>
                          <span className="font-mono text-[11px] text-foreground dir-ltr">
                            {customer.email}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">تاریخ عضویت:</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatJalaliDate(customer.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status Summary Counts */}
                    <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 rounded-xl bg-muted/20 border border-border/20 text-center">
                      <div>
                        <div className="text-[10px] text-muted-foreground">سرویس‌های فعال</div>
                        <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                          {servicesCount}
                        </div>
                      </div>
                      <div className="border-r border-border/30">
                        <div className="text-[10px] text-muted-foreground">صورت‌حساب‌ها</div>
                        <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                          {invoicesCount}
                        </div>
                      </div>
                    </div>

                    {/* Nearest Expiring Service Section */}
                    <div className="mt-3 p-3 rounded-xl bg-card/60 border border-border/40 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          نزدیک‌ترین سرویس به انقضا:
                        </span>
                      </div>
                      {nearestService ? (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {nearestService.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${
                              nearestService.daysLeft <= 7
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                : nearestService.daysLeft <= 15
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {nearestService.daysLeft <= 0
                              ? "منقضی شده"
                              : `${nearestService.daysLeft} روز تا سررسید`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          سرویس فعالی ثبت نشده است
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Inactive Overlay Badge */}
                  {customer.status === "INACTIVE" && (
                    <div className="absolute inset-x-4 top-14 bottom-16 z-20 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                      <div className="px-3.5 py-1.5 rounded-xl bg-card/95 border border-rose-500/30 shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        <span>حساب غیرفعال است</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Profile + Deactivate/Activate */}
                  <div className="relative z-30 mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
                    <Link
                      to="/customers/$id"
                      params={{ id: customer.id }}
                      className="flex-1 block"
                    >
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 border-border/60 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                        پروفایل
                      </Button>
                    </Link>

                    {customer.status === "ACTIVE" ? (
                      <Button
                        key={`btn-deactivate-${customer.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleCustomerStatusMutation.mutate({
                            customerId: customer.id,
                            newStatus: "INACTIVE",
                          })
                        }
                        disabled={toggleCustomerStatusMutation.isPending}
                        className="h-9 px-3 rounded-xl text-xs font-semibold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 cursor-pointer"
                        title="غیرفعال کردن مشتری"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">غیرفعال</span>
                      </Button>
                    ) : (
                      <Button
                        key={`btn-activate-${customer.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleCustomerStatusMutation.mutate({
                            customerId: customer.id,
                            newStatus: "ACTIVE",
                          })
                        }
                        disabled={toggleCustomerStatusMutation.isPending}
                        className="h-9 px-3 rounded-xl text-xs font-semibold gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 cursor-pointer"
                        title="فعال کردن مشتری"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">فعال</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

