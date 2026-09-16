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
  Layers,
  HardDrive,
  Server,
  Globe,
  Cpu,
  Package,
  AlertTriangle,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

export const Route = createFileRoute("/invoices/")({
  component: AdminInvoicesListPage,
});

const INVOICE_CONTENT_CATEGORIES = [
  { id: "ALL", label: "همه موضوعات", icon: Layers },
  { id: "HOSTING", label: "هاست و فضای ابری", icon: HardDrive },
  { id: "SERVER", label: "سرور اختصاصی و VPS", icon: Server },
  { id: "DOMAIN", label: "دامنه", icon: Globe },
  { id: "API", label: "وب‌سرویس و API", icon: Cpu },
  { id: "PACKAGE", label: "بسته‌ها و پکیج‌ها", icon: Package },
];

function getInvoiceCategory(inv: any): string {
  const item = inv.items?.[0];
  const snapshotType = (item?.serviceTypeSnapshot || "").toLowerCase();
  const serviceTypeName = (item?.service?.serviceType?.name || item?.service?.serviceType?.slug || "").toLowerCase();
  const title = (item?.title || "").toLowerCase();
  const text = (
    title + " " +
    (inv.notes || "") + " " +
    (item?.description || "") + " " +
    (item?.serviceNameSnapshot || "")
  ).toLowerCase();

  // 1. DOMAIN
  if (
    snapshotType.includes("domain") || snapshotType.includes("دامنه") ||
    serviceTypeName.includes("domain") || serviceTypeName.includes("دامنه") ||
    text.includes("دامنه") || text.includes("domain") ||
    /\.(ir|com|org|net|co|site|online|io|xyz|info)\b/i.test(title)
  ) {
    return "DOMAIN";
  }

  // 2. SERVER & VPS
  if (
    snapshotType.includes("server") || snapshotType.includes("سرور") || snapshotType.includes("vps") ||
    serviceTypeName.includes("server") || serviceTypeName.includes("سرور") || serviceTypeName.includes("vps") ||
    text.includes("سرور") || text.includes("server") || text.includes("vps") || text.includes("اختصاصی") || text.includes("مجازی")
  ) {
    return "SERVER";
  }

  // 3. PACKAGE & CONSUMABLE
  if (
    snapshotType.includes("package") || snapshotType.includes("پکیج") || snapshotType.includes("بسته") ||
    serviceTypeName.includes("package") || serviceTypeName.includes("پکیج") || serviceTypeName.includes("بسته") ||
    item?.service?.trackingType === "QUANTITY" ||
    text.includes("بسته") || text.includes("پکیج") || text.includes("تعدادی") || (item?.quantity && item.quantity > 1)
  ) {
    return "PACKAGE";
  }

  // 4. API & WEB SERVICE (Do NOT match generic 'سرویس')
  if (
    snapshotType.includes("api") || snapshotType.includes("وب‌سرویس") ||
    serviceTypeName.includes("api") || serviceTypeName.includes("وب‌سرویس") ||
    text.includes("api") || text.includes("وب‌سرویس") || text.includes("وب سرویس")
  ) {
    return "API";
  }

  // 5. HOSTING & CLOUD
  if (
    snapshotType.includes("host") || snapshotType.includes("هاست") || snapshotType.includes("ابری") || snapshotType.includes("cloud") ||
    serviceTypeName.includes("host") || serviceTypeName.includes("هاست") ||
    text.includes("هاست") || text.includes("host") || text.includes("ابری") || text.includes("cloud") || text.includes("میزبانی")
  ) {
    return "HOSTING";
  }

  return "HOSTING";
}

function AdminInvoicesListPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc" | "due-asc">("newest");
  const [page, setPage] = useState<number>(1);
  const PAGE_LIMIT = 30;
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
    queryKey: ["admin", "invoices"],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        "/invoices?page=1&limit=100",
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

  // Summary Financial Metrics (100% aligned with payments and overdues)
  const totalInvoicesCount = invoicesList.length;
  const totalAmountToman = invoicesList.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const paidInvoices = invoicesList.filter((i: any) => i.status === "PAID");
  const paidCount = paidInvoices.length;
  const paidTotalToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const unpaidInvoices = invoicesList.filter((i: any) => i.status === "UNPAID");
  const unpaidCount = unpaidInvoices.length;
  const unpaidTotalToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const overdueInvoices = unpaidInvoices.filter(
    (i: any) => i.dueDate && new Date(i.dueDate).getTime() < Date.now(),
  );
  const overdueCount = overdueInvoices.length;
  const overdueTotalToman = overdueInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const cancelledInvoices = invoicesList.filter((i: any) => i.status === "CANCELLED");
  const cancelledCount = cancelledInvoices.length;
  const cancelledTotalToman = cancelledInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  const filteredList = invoicesList.filter((inv: any) => {
    if (selectedStatus === "OVERDUE") {
      if (inv.status !== "UNPAID" || !inv.dueDate || new Date(inv.dueDate).getTime() >= Date.now()) return false;
    } else if (selectedStatus !== "ALL" && inv.status !== selectedStatus) {
      return false;
    }
    if (selectedCategory !== "ALL" && getInvoiceCategory(inv) !== selectedCategory) return false;
    return true;
  });

  const sortedList = [...filteredList].sort((a: any, b: any) => {
    if (sortBy === "oldest") {
      return new Date(a.issuedAt || a.createdAt || 0).getTime() - new Date(b.issuedAt || b.createdAt || 0).getTime();
    }
    if (sortBy === "amount-desc") {
      return (b.totalToman || 0) - (a.totalToman || 0);
    }
    if (sortBy === "amount-asc") {
      return (a.totalToman || 0) - (b.totalToman || 0);
    }
    if (sortBy === "due-asc") {
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    }
    return new Date(b.issuedAt || b.createdAt || 0).getTime() - new Date(a.issuedAt || a.createdAt || 0).getTime();
  });

  const totalPages = Math.ceil(sortedList.length / PAGE_LIMIT) || 1;
  const paginatedList = sortedList.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

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

        {/* Top KPI Metrics Cards (Interactive Quick Filters) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Unpaid / Receivables */}
          <div
            onClick={() => {
              setSelectedStatus((s) => (s === "UNPAID" ? "ALL" : "UNPAID"));
              setPage(1);
            }}
            className={`rounded-2xl border p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "UNPAID"
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">کل مطالبات در انتظار تسویه</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {unpaidTotalToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {unpaidCount.toLocaleString("fa-IR")} فاکتور پرداخت‌نشده
              </span>
            </div>
          </div>

          {/* 2. Overdue past due date */}
          <div
            onClick={() => {
              setSelectedStatus((s) => (s === "OVERDUE" ? "ALL" : "OVERDUE"));
              setPage(1);
            }}
            className={`rounded-2xl border p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "OVERDUE"
                ? "border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30"
                : "border-rose-500/20 bg-rose-500/[0.03] hover:bg-rose-500/[0.07]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">معوقات سررسید گذشته (فوری)</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                {overdueTotalToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {overdueCount.toLocaleString("fa-IR")} فاکتور دارای تأخیر پرداخت
              </span>
            </div>
          </div>

          {/* 3. Settled / Paid */}
          <div
            onClick={() => {
              setSelectedStatus((s) => (s === "PAID" ? "ALL" : "PAID"));
              setPage(1);
            }}
            className={`rounded-2xl border p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "PAID"
                ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">دریافتی‌های تسویه‌شده</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {paidTotalToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {paidCount.toLocaleString("fa-IR")} فاکتور پرداخت و تسویه‌شده
              </span>
            </div>
          </div>

          {/* 4. Cancelled Invoices (Replaced Total Invoices) */}
          <div
            onClick={() => {
              setSelectedStatus((s) => (s === "CANCELLED" ? "ALL" : "CANCELLED"));
              setPage(1);
            }}
            className={`rounded-2xl border p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "CANCELLED"
                ? "border-zinc-500 bg-zinc-500/10 ring-2 ring-zinc-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">فاکتورهای لغو شده (باطل)</span>
              <div className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500">
                <Ban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-600 dark:text-zinc-400 font-mono">
                {cancelledTotalToman.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {cancelledCount.toLocaleString("fa-IR")} فاکتور لغو شده
              </span>
            </div>
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

        {/* Content-Based Category Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold ml-1">دسته‌بندی موضوعی:</span>
            {INVOICE_CONTENT_CATEGORIES.map((cat) => {
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

          {/* Status Sub-filter & Sorting Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs text-muted-foreground font-medium ml-1">وضعیت پرداخت:</span>
              {[
                { id: "ALL", label: "همه وضعیت‌ها", count: totalInvoicesCount },
                { id: "UNPAID", label: "در انتظار پرداخت", count: unpaidCount },
                { id: "OVERDUE", label: "معوقه (سررسید گذشته)", count: overdueCount, alert: overdueCount > 0 },
                { id: "PAID", label: "تسویه‌شده", count: paidCount },
                { id: "CANCELLED", label: "لغو شده", count: cancelledCount },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedStatus === tab.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(tab.id);
                    setPage(1);
                  }}
                  className={`text-xs rounded-xl h-8 gap-1.5 cursor-pointer ${
                    selectedStatus === tab.id ? "font-bold text-foreground bg-muted shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      tab.alert
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                        : selectedStatus === tab.id
                        ? "bg-foreground/10 text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count.toLocaleString("fa-IR")}
                  </span>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="h-8 rounded-xl border border-input bg-card/60 px-3 text-xs font-medium text-foreground shadow-xs focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="amount-desc">بیشترین مبلغ</option>
                <option value="amount-asc">کمترین مبلغ</option>
                <option value="due-asc">نزدیک‌ترین مهلت پرداخت</option>
              </select>
            </div>
          </div>
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
                  {paginatedList.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium font-mono text-foreground">
                        <button
                          type="button"
                          onClick={() => handleOpenView(inv)}
                          className="font-bold text-primary hover:underline hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {formatInvoiceNumber(inv.invoiceNumber || inv.id)}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{inv.customer?.name || inv.customerId || "مشتری"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                        {inv.items?.[0]?.title || "صورت‌حساب سرویس ابری"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {(inv.totalToman || 0).toLocaleString("fa-IR")} تومان
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            پرداخت شده
                          </span>
                        ) : inv.status === "CANCELLED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                            <Ban className="h-3 w-3" />
                            لغو شده
                          </span>
                        ) : inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            معوقه (سررسید گذشته)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            در انتظار پرداخت
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {inv.dueDate ? (
                          <span className={inv.status === "UNPAID" && new Date(inv.dueDate).getTime() < Date.now() ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                            {formatJalaliDate(inv.dueDate)}
                            {inv.status === "UNPAID" && new Date(inv.dueDate).getTime() < Date.now() && (
                              <span className="mr-1 text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600">
                                منقضی
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">---</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenView(inv)}
                            className="text-primary hover:bg-primary/10 h-7 text-[11px] font-medium gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            مشاهده
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(inv)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 h-7 text-[11px] font-medium cursor-pointer"
                          >
                            ویرایش
                          </Button>
                          {inv.status === "UNPAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                              disabled={cancelInvoiceMutation.isPending}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 text-[11px] cursor-pointer"
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

            {/* Pagination & Count Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 bg-muted/20 border-t text-xs">
              <div className="text-muted-foreground">
                نمایش {paginatedList.length} از {sortedList.length} فاکتور (صفحه {page} از {totalPages})
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 text-xs px-2.5 rounded-lg"
                  >
                    قبلی
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={`h-7 w-7 p-0 text-xs rounded-lg ${page === p ? "bg-emerald-600 text-white" : ""}`}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 text-xs px-2.5 rounded-lg"
                  >
                    بعدی
                  </Button>
                </div>
              )}
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

