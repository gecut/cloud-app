import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { formatJalaliDateTime } from "@gecut-cloud/contracts";
import {
  History,
  ShieldAlert,
  UserCheck,
  FileText,
  CreditCard,
  Server,
  RefreshCw,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/audit-logs/")({
  component: AdminAuditLogsListPage,
});

const AUDIT_LOG_CATEGORIES = [
  { id: "ALL", label: "همه رویدادها", icon: History },
  { id: "FINANCE", label: "امور مالی و فاکتورها", icon: CreditCard },
  { id: "SERVICES", label: "سرویس‌ها و زیرساخت", icon: Server },
  { id: "CUSTOMERS", label: "مشتریان و حساب‌ها", icon: UserCheck },
  { id: "SECURITY", label: "احراز هویت و امنیت", icon: ShieldAlert },
];

function getAuditLogCategory(log: any): string {
  const entity = (log.entityType || "").toLowerCase();
  const action = (log.action || "").toLowerCase();
  const reason = (log.reason || "").toLowerCase();
  const combined = entity + " " + action + " " + reason;

  if (
    combined.includes("invoice") ||
    combined.includes("payment") ||
    combined.includes("فاکتور") ||
    combined.includes("پرداخت") ||
    combined.includes("تومان") ||
    combined.includes("مالی")
  ) {
    return "FINANCE";
  }

  if (
    combined.includes("service") ||
    combined.includes("server") ||
    combined.includes("endpoint") ||
    combined.includes("سرویس") ||
    combined.includes("سرور")
  ) {
    return "SERVICES";
  }

  if (
    combined.includes("customer") ||
    combined.includes("مشتری") ||
    combined.includes("پروفایل") ||
    combined.includes("تعریف مشتری")
  ) {
    return "CUSTOMERS";
  }

  if (
    combined.includes("login") ||
    combined.includes("auth") ||
    combined.includes("user") ||
    combined.includes("رمز") ||
    combined.includes("ورود") ||
    combined.includes("امنیت")
  ) {
    return "SECURITY";
  }

  return "FINANCE";
}

function AdminAuditLogsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 30;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/audit-logs?limit=200"),
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, selectedCategory]);

  const rawList = data?.items || [];
  const filteredList = rawList.filter((log: any) => {
    if (selectedCategory !== "ALL" && getAuditLogCategory(log) !== selectedCategory) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const actor = (log.actorDisplayNameSnapshot || log.user?.name || log.actor || "").toLowerCase();
    const reason = (log.reason || "").toLowerCase();
    const action = (log.action || "").toLowerCase();
    const entity = (log.entityType || "").toLowerCase();
    return actor.includes(term) || reason.includes(term) || action.includes(term) || entity.includes(term);
  });

  const sortedList = [...filteredList].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return sortBy === "newest" ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.ceil(sortedList.length / PAGE_LIMIT) || 1;
  const paginatedList = sortedList.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ردیابی و لاگ‌های امنیتی و عملیاتی</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ثبت تمامی رویدادهای مالی، تغییرات وضعیت سرویس‌ها و اقدامات ادمین و مشتریان
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            بروزرسانی لاگ‌ها
          </Button>
        </div>

        {/* Content-Based Category Tabs & Search/Sort Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold ml-1">دسته‌بندی رویدادها:</span>
            {AUDIT_LOG_CATEGORIES.map((cat) => {
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
              <Input
                placeholder="جستجو در شرح لاگ، کاربر، یا عملیات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 h-9 text-xs rounded-xl border-border/60 bg-card/40 backdrop-blur-xs focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 rounded-xl border border-input bg-card/60 px-3 text-xs font-medium text-foreground shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">کاربر / مجری</th>
                    <th className="py-3.5 px-4">نقش</th>
                    <th className="py-3.5 px-4">عملیات</th>
                    <th className="py-3.5 px-4">بخش سیستم</th>
                    <th className="py-3.5 px-4">جزئیات و شرح عملیات</th>
                    <th className="py-3.5 px-4">زمان ثبت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[11px]">
                  {sortedList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        هیچ لاگی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((log: any) => {
                      const actorName =
                        log.actorDisplayNameSnapshot ||
                        log.user?.name ||
                        log.actor ||
                        "مدیر سیستم";

                      const roleLabel =
                        log.actorRole === "ADMIN" || log.role === "ADMIN"
                          ? "مدیر"
                          : log.actorRole === "CUSTOMER" || log.role === "CUSTOMER"
                          ? "مشتری"
                          : "سیستم";

                      const actionMap: Record<string, { label: string; color: string }> = {
                        login: { label: "ورود به سامانه", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                        "customer.create": { label: "تعریف مشتری", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                        "customer.update": { label: "ویرایش مشتری", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                        "invoice.create": { label: "صدور فاکتور", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                        "invoice.update": { label: "ویرایش فاکتور", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
                        "invoice.cancel": { label: "لغو فاکتور", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
                        "invoice.reactivate": { label: "فعال‌سازی مجدد فاکتور", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                        "payment.record": { label: "پرداخت آنلاین", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                        "service.create": { label: "تعریف/تخصیص سرویس", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
                        "service.assign": { label: "تخصیص بسته", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
                      };

                      const entityMap: Record<string, string> = {
                        User: "حساب کاربری",
                        Customer: "مشتری",
                        Invoice: "فاکتور مالی",
                        Payment: "تراکنش مالی",
                        Service: "سرویس ابری",
                        Server: "سرور زیرساخت",
                      };

                      const actionInfo = actionMap[log.action] || {
                        label: log.action || "عملیات",
                        color: "bg-muted text-muted-foreground",
                      };

                      const detailsText =
                        log.reason ||
                        (typeof log.after === "object"
                          ? JSON.stringify(log.after)
                          : typeof log.details === "object"
                          ? JSON.stringify(log.details)
                          : log.details || "—");

                      return (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {actorName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                roleLabel === "مدیر"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {roleLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {entityMap[log.entityType] || log.entityType || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-foreground font-medium max-w-md truncate">
                            {detailsText}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                            {formatJalaliDateTime(log.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {sortedList.length > PAGE_LIMIT && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-border/30 text-xs">
                <span className="text-muted-foreground">
                  نمایش {(page - 1) * PAGE_LIMIT + 1} تا {Math.min(page * PAGE_LIMIT, sortedList.length)} از {sortedList.length} رویداد
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-xl text-xs gap-1 cursor-pointer"
                  >
                    قبلی
                  </Button>
                  <span className="px-2 font-mono font-medium text-foreground">
                    صفحه {page} از {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-xl text-xs gap-1 cursor-pointer"
                  >
                    بعدی
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
