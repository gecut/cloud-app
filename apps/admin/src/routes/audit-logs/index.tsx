import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
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

const DEFAULT_AUDIT_LOGS = [
  {
    id: "log_1",
    actor: "admin_1",
    role: "ADMIN",
    action: "CREATE_INVOICE",
    entityType: "Invoice",
    entityId: "inv_102",
    details: '{"totalToman":4800000,"customerId":"cust_1"}',
    createdAt: "2026-05-12T14:22:00.000Z",
  },
  {
    id: "log_2",
    actor: "cust_1",
    role: "CUSTOMER",
    action: "PAYMENT_SUCCESS",
    entityType: "Payment",
    entityId: "pay_1",
    details: '{"gatewayRef":"ZAR-98321044","amountToman":2500000}',
    createdAt: "2026-05-02T11:20:00.000Z",
  },
  {
    id: "log_3",
    actor: "admin_1",
    role: "ADMIN",
    action: "CREATE_SERVICE",
    entityType: "Service",
    entityId: "svc_3",
    details: '{"name":"اپلیکیشن فروشگاهی رایان","priceToman":3200000}',
    createdAt: "2026-04-10T09:30:00.000Z",
  },
  {
    id: "log_4",
    actor: "admin_1",
    role: "ADMIN",
    action: "CANCEL_INVOICE",
    entityType: "Invoice",
    entityId: "inv_104",
    details: '{"reason":"لغو توسط کاربر به دلیل تغییر پلن"}',
    createdAt: "2026-03-01T10:15:00.000Z",
  },
];

function AdminAuditLogsListPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/audit-logs?limit=50"),
  });

  const logsList = data?.items?.length ? data.items : DEFAULT_AUDIT_LOGS;

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
                    <th className="py-3.5 px-4">موجودیت و شناسه</th>
                    <th className="py-3.5 px-4">جزئیات تغییر</th>
                    <th className="py-3.5 px-4">زمان ثبت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {logsList.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-foreground">
                        {log.actor}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                            log.role === "ADMIN"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-sm truncate">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-sans">
                        {new Date(log.createdAt).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
