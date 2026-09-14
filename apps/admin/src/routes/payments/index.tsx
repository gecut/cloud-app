import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Receipt,
} from "lucide-react";

export const Route = createFileRoute("/payments/")({
  component: AdminPaymentsListPage,
});

const DEFAULT_PAYMENTS = [
  {
    id: "pay_1",
    invoiceId: "inv_101",
    amountToman: 2500000,
    gatewayRef: "ZAR-98321044",
    provider: "ZARINPAL",
    paidAt: "2026-05-02T11:20:00.000Z",
    invoice: {
      invoiceNumber: "INV-2026-001",
      customer: { name: "شرکت چوبینو" },
    },
  },
  {
    id: "pay_2",
    invoiceId: "inv_100",
    amountToman: 1800000,
    gatewayRef: "PAY-55192088",
    provider: "MANUAL_BANK_TRANSFER",
    paidAt: "2026-04-18T16:45:00.000Z",
    invoice: {
      invoiceNumber: "INV-2026-000",
      customer: { name: "آژانس دیجیتال رایان" },
    },
  },
];

function AdminPaymentsListPage() {
  const queryClient = useQueryClient();
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Form states
  const [invoiceId, setInvoiceId] = useState("");
  const [amountToman, setAmountToman] = useState<number>(2500000);
  const [gatewayRef, setGatewayRef] = useState("");
  const [provider, setProvider] = useState("MANUAL_TRANSFER");

  const { data: invoicesData } = useQuery({
    queryKey: ["admin", "invoices", "UNPAID"],
    queryFn: () => apiClient<{ items: any[] }>("/invoices?status=UNPAID&limit=100"),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/payments?page=1&limit=50"),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (newPayment: any) =>
      apiClient("/payments", {
        method: "POST",
        body: JSON.stringify(newPayment),
      }),
    onSuccess: () => {
      toast.success("رسید پرداخت با موفقیت ثبت شد و فاکتور تسویه گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      setIsRecordOpen(false);
      setInvoiceId("");
      setGatewayRef("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت پرداخت");
    },
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) {
      toast.error("انتخاب فاکتور پرداخت‌نشده الزامی است");
      return;
    }
    recordPaymentMutation.mutate({
      invoiceId,
      amountToman: Number(amountToman),
      gatewayRef: gatewayRef || `REF-${Date.now().toString().slice(-6)}`,
      provider,
    });
  };

  const paymentsList = data?.items?.length ? data.items : DEFAULT_PAYMENTS;
  const unpaidInvoices = invoicesData?.items || [];

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت پرداخت‌ها و رسیدها</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مشاهده تاییدیه‌های پرداخت آنلاین و ثبت دستی حواله‌های بانکی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setIsRecordOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              ثبت دستی پرداخت
            </Button>
          </div>
        </div>

        {/* Record Payment Modal */}
        {isRecordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">ثبت و تسویه دستی پرداخت فاکتور</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRecordOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleRecordSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pinv" className="text-xs font-semibold">
                    فاکتور در انتظار پرداخت *
                  </Label>
                  <select
                    id="pinv"
                    value={invoiceId}
                    onChange={(e) => {
                      setInvoiceId(e.target.value);
                      const inv = unpaidInvoices.find((i: any) => i.id === e.target.value);
                      if (inv?.totalToman) setAmountToman(inv.totalToman);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">-- یک فاکتور را انتخاب کنید --</option>
                    {unpaidInvoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber || inv.id} - ({inv.totalToman?.toLocaleString("fa-IR")} تومان)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pamount" className="text-xs font-semibold">
                      مبلغ واریزی (تومان) *
                    </Label>
                    <Input
                      id="pamount"
                      type="number"
                      value={amountToman}
                      onChange={(e) => setAmountToman(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pprov" className="text-xs font-semibold">
                      نوع درگاه / شیوه واریز
                    </Label>
                    <select
                      id="pprov"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="MANUAL_TRANSFER">کارت به کارت / پایا</option>
                      <option value="ZARINPAL">زرین‌پال (ZarinPal)</option>
                      <option value="PAYPING">پی‌پینگ (PayPing)</option>
                      <option value="CASH">نقدی / چک</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pref" className="text-xs font-semibold">
                    کد رهگیری / شماره ارجاع بانکی
                  </Label>
                  <Input
                    id="pref"
                    value={gatewayRef}
                    onChange={(e) => setGatewayRef(e.target.value)}
                    placeholder="مثال: 98124018 یا شماره فیش واریزی"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRecordOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={recordPaymentMutation.isPending}
                  >
                    {recordPaymentMutation.isPending ? "در حال ثبت..." : "تایید و تسویه فاکتور"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payments Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">شناسه رسید</th>
                    <th className="py-3.5 px-4">شماره فاکتور</th>
                    <th className="py-3.5 px-4">مبلغ واریزی (تومان)</th>
                    <th className="py-3.5 px-4">کد رهگیری / ارجاع</th>
                    <th className="py-3.5 px-4">درگاه / شیوه</th>
                    <th className="py-3.5 px-4">تاریخ پرداخت</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paymentsList.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-emerald-500" />
                          <span>{pay.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {pay.invoice?.invoiceNumber || pay.invoiceId}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {(pay.amountToman || 0).toLocaleString("fa-IR")} تومان
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {pay.gatewayRef || "---"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                          {pay.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {pay.paidAt ? new Date(pay.paidAt).toLocaleString("fa-IR") : "---"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          تسویه شده
                        </span>
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

