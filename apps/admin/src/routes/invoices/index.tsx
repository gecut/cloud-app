import { useState, useEffect } from "react";
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
import { formatJalaliDate } from "@gecut-cloud/contracts";
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
  Eye,
} from "lucide-react";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

export const Route = createFileRoute("/invoices/")({
  component: AdminInvoicesListPage,
});



function AdminInvoicesListPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [amountToman, setAmountToman] = useState<number>(2500000);
  const [dueDays, setDueDays] = useState<number>(7);

  // Edit states
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDueDays, setEditDueDays] = useState<number>(7);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<string>("UNPAID");

  // View Details states
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleOpenView = (inv: any) => {
    setViewingInvoice(inv);
    setIsViewOpen(true);
  };

  const { data: customersData } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiClient<{ items: any[] }>("/customers?limit=100"),
  });

  const customerOptions = customersData?.items || [];

  useEffect(() => {
    if (customerOptions.length > 0 && (!customerId || !customerOptions.some((c: any) => c.id === customerId))) {
      setCustomerId(customerOptions[0].id);
    }
  }, [customerOptions, customerId]);

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
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsCreateOpen(false);
      setItemTitle("");
      setAmountToman(2500000);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در صدور فاکتور");
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      apiClient(`/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsEditOpen(false);
      setEditingInvoice(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در بروزرسانی فاکتور");
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
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
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
          unitPriceToman: Number(amountToman),
          quantity: 1,
        },
      ],
    });
  };

  const handleOpenEdit = (inv: any) => {
    setEditingInvoice(inv);
    setEditTitle(inv.items?.[0]?.title || "");
    setEditAmount(inv.totalToman || 0);
    setEditNotes(inv.notes || "");
    setEditStatus(inv.status || "UNPAID");
    const remainingDays = inv.dueDate
      ? Math.max(1, Math.round((new Date(inv.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 7;
    setEditDueDays(remainingDays);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!editTitle.trim()) {
      toast.error("عنوان ردیف فاکتور الزامی است");
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(editDueDays));

    updateInvoiceMutation.mutate({
      id: editingInvoice.id,
      payload: {
        status: editStatus,
        dueDate: dueDate.toISOString(),
        notes: editNotes,
        items: [
          {
            title: editTitle,
            unitPriceToman: Number(editAmount),
            quantity: 1,
          },
        ],
      },
    });
  };

  const invoicesList = data?.items || [];
  const filteredList =
    selectedStatus === "ALL"
      ? invoicesList
      : invoicesList.filter((inv: any) => inv.status === selectedStatus);

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

        {/* Edit Invoice Modal */}
        {isEditOpen && editingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش فاکتور {editingInvoice.invoiceNumber}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      مشتری: {editingInvoice.customer?.name || "نامشخص"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="etitle" className="text-xs font-semibold">
                    شرح خدمت یا عنوان ردیف فاکتور *
                  </Label>
                  <Input
                    id="etitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="eamount" className="text-xs font-semibold">
                      مبلغ کل (تومان) *
                    </Label>
                    <Input
                      id="eamount"
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edays" className="text-xs font-semibold">
                      مهلت پرداخت از امروز (روز)
                    </Label>
                    <Input
                      id="edays"
                      type="number"
                      value={editDueDays}
                      onChange={(e) => setEditDueDays(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="enotes" className="text-xs font-semibold">
                    یادداشت و توضیحات فاکتور
                  </Label>
                  <Input
                    id="enotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="توضیحات اختیاری درباره فاکتور"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estatus" className="text-xs font-semibold">
                    وضعیت فاکتور
                  </Label>
                  <select
                    id="estatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring font-medium"
                  >
                    <option value="UNPAID">در انتظار پرداخت</option>
                    <option value="PAID">تسویه‌شده (پرداخت شده)</option>
                    <option value="CANCELLED">لغو شده</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateInvoiceMutation.isPending}
                  >
                    {updateInvoiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات فاکتور"}
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
                        <button
                          type="button"
                          onClick={() => handleOpenView(inv)}
                          className="font-bold text-primary hover:underline hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {inv.invoiceNumber || inv.id}
                        </button>
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
                        {formatJalaliDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenView(inv)}
                            className="text-primary hover:bg-primary/10 h-7 text-[11px] font-medium gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            مشاهده
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(inv)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 h-7 text-[11px] font-medium"
                          >
                            ویرایش
                          </Button>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dedicated Invoice Details Modal */}
        <InvoiceDetailModal
          invoice={viewingInvoice}
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setViewingInvoice(null);
          }}
          onEdit={(inv) => handleOpenEdit(inv)}
          onCancel={(invId) => cancelInvoiceMutation.mutate(invId)}
        />
      </div>
    </AppShell>
  );
}

