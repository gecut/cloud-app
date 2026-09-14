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
  FileText,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  Ban,
  User,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/invoices/")({
  component: AdminInvoicesListPage,
});

const DEFAULT_INVOICES = [
  {
    id: "inv_101",
    invoiceNumber: "INV-2026-001",
    totalToman: 2500000,
    status: "PAID",
    dueDate: "2026-05-10T00:00:00.000Z",
    customerId: "cust_1",
    customer: { name: "شرکت چوبینو" },
    items: [{ title: "میزبانی ابری و نگهداری سرور", amountToman: 2500000, quantity: 1 }],
  },
  {
    id: "inv_102",
    invoiceNumber: "INV-2026-002",
    totalToman: 4800000,
    status: "UNPAID",
    dueDate: "2026-08-20T00:00:00.000Z",
    customerId: "cust_1",
    customer: { name: "شرکت چوبینو" },
    items: [{ title: "سرور اختصاصی دانلود ماهانه", amountToman: 4800000, quantity: 1 }],
  },
  {
    id: "inv_103",
    invoiceNumber: "INV-2026-003",
    totalToman: 3200000,
    status: "UNPAID",
    dueDate: "2026-04-15T00:00:00.000Z",
    customerId: "cust_2",
    customer: { name: "آژانس دیجیتال رایان" },
    items: [{ title: "بک‌اند اپلیکیشن فروشگاهی", amountToman: 3200000, quantity: 1 }],
  },
  {
    id: "inv_104",
    invoiceNumber: "INV-2026-004",
    totalToman: 1200000,
    status: "CANCELLED",
    dueDate: "2026-03-01T00:00:00.000Z",
    customerId: "cust_2",
    customer: { name: "آژانس دیجیتال رایان" },
    items: [{ title: "مشاوره زیرساخت کلود (لغو شده)", amountToman: 1200000, quantity: 1 }],
  },
];

function AdminInvoicesListPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState("cust_1");
  const [itemTitle, setItemTitle] = useState("");
  const [amountToman, setAmountToman] = useState<number>(2500000);
  const [dueDays, setDueDays] = useState<number>(7);

  const { data: customersData } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiClient<{ items: any[] }>("/customers?limit=100"),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "invoices", selectedStatus],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        `/invoices?page=1&limit=50${selectedStatus !== "ALL" ? `&status=${selectedStatus}` : ""}`,
      ),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (newInvoice: any) =>
      apiClient("/invoices", {
        method: "POST",
        body: JSON.stringify(newInvoice),
      }),
    onSuccess: () => {
      toast.success("فاکتور جدید با موفقیت صادر شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      setIsCreateOpen(false);
      setItemTitle("");
      setAmountToman(2500000);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در صدور فاکتور");
    },
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient(`/invoices/${invoiceId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "لغو توسط ادمین در محیط تست دمو" }),
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت لغو شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در لغو فاکتور");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      toast.error("عنوان ردیف فاکتور الزامی است");
      return;
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));

    createInvoiceMutation.mutate({
      customerId,
      dueDate: dueDate.toISOString(),
      items: [
        {
          title: itemTitle,
          amountToman: Number(amountToman),
          quantity: 1,
        },
      ],
    });
  };

  const invoicesList = data?.items?.length ? data.items : DEFAULT_INVOICES;
  const filteredList =
    selectedStatus === "ALL"
      ? invoicesList
      : invoicesList.filter((inv: any) => inv.status === selectedStatus);

  const customerOptions = customersData?.items?.length
    ? customersData.items
    : [
        { id: "cust_1", name: "شرکت چوبینو" },
        { id: "cust_2", name: "آژانس دیجیتال رایان" },
      ];

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت فاکتورها و صورت‌حساب‌ها</h1>
            <p className="text-sm text-muted-foreground mt-1">
              صدور صورت‌حساب‌های دوره‌ای بر پایه اسنپ‌شات قطعی تومان و پیگیری مطالبات
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
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              صدور فاکتور جدید
            </Button>
          </div>
        </div>

        {/* Create Invoice Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">صدور فاکتور رسمی جدید</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="icust" className="text-xs font-semibold">
                    مشتری صورت‌حساب *
                  </Label>
                  <select
                    id="icust"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {customerOptions.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ititle" className="text-xs font-semibold">
                    شرح خدمت یا آیتم فاکتور *
                  </Label>
                  <Input
                    id="ititle"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="مثال: اشتراک سه ماهه سرور ابری یا تمدید دامنه"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="iamount" className="text-xs font-semibold">
                      مبلغ کل (تومان) *
                    </Label>
                    <Input
                      id="iamount"
                      type="number"
                      value={amountToman}
                      onChange={(e) => setAmountToman(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="idays" className="text-xs font-semibold">
                      مهلت پرداخت (روز)
                    </Label>
                    <Input
                      id="idays"
                      type="number"
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending ? "در حال صدور..." : "صدور و ثبت فاکتور"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "همه فاکتورها" },
            { id: "UNPAID", label: "پرداخت‌نشده (در انتظار)" },
            { id: "PAID", label: "تسویه‌شده" },
            { id: "CANCELLED", label: "لغو شده" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedStatus === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(tab.id)}
              className="text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Invoices Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">شماره فاکتور</th>
                    <th className="py-3.5 px-4">مشتری</th>
                    <th className="py-3.5 px-4">شرح خدمات</th>
                    <th className="py-3.5 px-4">مبلغ نهایی (تومان)</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4">مهلت پرداخت</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredList.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium font-mono text-foreground">
                        {inv.invoiceNumber || inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{inv.customer?.name || inv.customerId || "شرکت چوبینو"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                        {inv.items?.[0]?.title || "صورت‌حساب سرویس ابری"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {(inv.totalToman || 0).toLocaleString("fa-IR")} تومان
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : inv.status === "UNPAID"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {inv.status === "PAID" ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              پرداخت شده
                            </>
                          ) : inv.status === "UNPAID" ? (
                            <>
                              <Clock className="h-3 w-3" />
                              در انتظار پرداخت
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3" />
                              لغو شده
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString("fa-IR")
                          : "---"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === "UNPAID" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                            disabled={cancelInvoiceMutation.isPending}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 text-[11px]"
                          >
                            لغو فاکتور
                          </Button>
                        )}
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

