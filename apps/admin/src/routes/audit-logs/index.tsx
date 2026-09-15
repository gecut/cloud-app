import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { formatJalaliDateTime } from "@gecut-cloud/contracts";
import {
  History,
  ShieldAlert,
  UserCheck,
  FileText,
  CreditCard,
  Server,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/audit-logs/")({
  component: AdminAuditLogsListPage,
});

function AdminAuditLogsListPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/audit-logs?limit=50"),
  });

  const logsList = data?.items || [];

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
                  {logsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        هنوز لاگی در سیستم ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    logsList.map((log: any) => {
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
