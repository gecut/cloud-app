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
import { formatJalaliDate } from "@gecut-cloud/contracts";
import {
  Building2,
  Server,
  Plus,
  RefreshCw,
  X,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

export const Route = createFileRoute("/servers/")({
  component: AdminSuppliersPage,
});

function AdminSuppliersPage() {
  const queryClient = useQueryClient();

  // Modals state
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Form State: Supplier
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");

  // Form State: Purchased Service
  const [targetSupplierId, setTargetSupplierId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceType, setServiceType] = useState("DEDICATED_SERVER");
  const [monthlyExpenseToman, setMonthlyExpenseToman] = useState("3400000");
  const [serviceRenewalDate, setServiceRenewalDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

  // Fetch Suppliers List
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/suppliers"),
  });

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/suppliers", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("تامین‌کننده جدید با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      setIsCreateSupplierOpen(false);
      resetSupplierForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت تامین‌کننده");
    },
  });

  // Update Supplier Mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiClient(`/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("اطلاعات تامین‌کننده با موفقیت ویرایش شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      setIsEditSupplierOpen(false);
      setSelectedSupplier(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش تامین‌کننده");
    },
  });

  // Delete Supplier Mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/suppliers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تامین‌کننده با موفقیت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در حذف تامین‌کننده");
    },
  });

  // Add Purchased Service Mutation
  const addServiceMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/suppliers/services", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("سرویس خریداری‌شده با موفقیت به تامین‌کننده اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      setIsAddServiceOpen(false);
      setServiceName("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت سرویس");
    },
  });

  const resetSupplierForm = () => {
    setSupplierName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setNotes("");
    setStatus("ACTIVE");
  };

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error("نام تامین‌کننده الزامی است");
      return;
    }
    createSupplierMutation.mutate({
      name: supplierName,
      contactPerson,
      phone,
      email,
      notes,
    });
  };

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    updateSupplierMutation.mutate({
      id: selectedSupplier.id,
      body: {
        name: supplierName,
        contactPerson,
        phone,
        email,
        status,
        notes,
      },
    });
  };

  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !targetSupplierId) {
      toast.error("عنوان سرویس و تامین‌کننده الزامی است");
      return;
    }
    addServiceMutation.mutate({
      supplierId: targetSupplierId,
      name: serviceName,
      type: serviceType,
      monthlyExpenseToman: Number(monthlyExpenseToman) || 0,
      renewalDate: new Date(serviceRenewalDate).toISOString(),
    });
  };

  const openEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setSupplierName(supplier.name || "");
    setContactPerson(supplier.contactPerson || "");
    setPhone(supplier.phone || "");
    setEmail(supplier.email || "");
    setStatus(supplier.status || "ACTIVE");
    setNotes(supplier.notes || "");
    setIsEditSupplierOpen(true);
  };

  const openAddServiceForSupplier = (supplierId: string) => {
    setTargetSupplierId(supplierId);
    setIsAddServiceOpen(true);
  };

  const suppliersList = data?.items || [];

  // Summary stats
  const totalPayableToman = suppliersList.reduce(
    (sum: number, s: any) => sum + (Number(s.totalPayableToman) || 0),
    0,
  );
  const totalServicesCount = suppliersList.reduce(
    (sum: number, s: any) => sum + (s.services?.length || 0),
    0,
  );

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 animate-entrance">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              مدیریت تامین‌کنندگان و هزینه‌های زیرساخت
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              ثبت تامین‌کنندگان خارجی/داخلی، سرویس‌های خریداری شده (هاست، سرور اختصاصی، دامنه، لایسنس) و بدهکاری شرکت
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
              onClick={() => {
                resetSupplierForm();
                setIsCreateSupplierOpen(true);
              }}
              className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              تامین‌کننده جدید
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">تامین‌کنندگان همکار</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground font-mono">
                {suppliersList.length}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">شرکت‌ها و دیتاسنترهای طرف قرارداد</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">سرویس‌های خریداری‌شده</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground font-mono">
                {totalServicesCount}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">سرور، هاست، دامنه و لایسنس فعال</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">مجموع بدهکاری و هزینه ماهانه</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalPayableToman.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">مبلغ قابل پرداخت شرکت به تامین‌کنندگان</span>
            </div>
          </div>
        </div>

        {/* Modal: Create Supplier */}
        {isCreateSupplierOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-foreground">تعریف تامین‌کننده جدید</h3>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setIsCreateSupplierOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSupplierSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label>نام شرکت / تامین‌کننده *</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="مثال: شرکت هتزنر (Hetzner Online)" required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>مسئول ارتباط / پشتیبان</Label>
                    <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="آقای احمدی" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>شماره تماس</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+4991152011" dir="ltr" className="font-mono rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ایمیل یا درگاه پشتیبانی</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@supplier.com" dir="ltr" className="font-mono rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>توضیحات و شرایط پرداخت</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="پرداخت ارزی اول هر ماه میلادی" className="rounded-xl" />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateSupplierOpen(false)} className="rounded-xl">انصراف</Button>
                  <Button type="submit" size="sm" disabled={createSupplierMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                    {createSupplierMutation.isPending ? "در حال ثبت..." : "ثبت تامین‌کننده"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Supplier */}
        {isEditSupplierOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-sm text-foreground">ویرایش مشخصات تامین‌کننده</h3>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setIsEditSupplierOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSupplierSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label>نام شرکت / تامین‌کننده *</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>مسئول ارتباط</Label>
                    <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>شماره تماس</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="font-mono rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>ایمیل</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="font-mono rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>وضعیت همکاری</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-xs"
                    >
                      <option value="ACTIVE">فعال (همکاری مستمر)</option>
                      <option value="INACTIVE">غیرفعال / قطع همکاری</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditSupplierOpen(false)} className="rounded-xl">انصراف</Button>
                  <Button type="submit" size="sm" disabled={updateSupplierMutation.isPending} className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                    {updateSupplierMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Service to Supplier */}
        {isAddServiceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-sm text-foreground">ثبت سرویس خریداری‌شده از تامین‌کننده</h3>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setIsAddServiceOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddServiceSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label>تامین‌کننده مربوطه *</Label>
                  <select
                    value={targetSupplierId}
                    onChange={(e) => setTargetSupplierId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-xs"
                    required
                  >
                    <option value="">-- انتخاب تامین‌کننده --</option>
                    {suppliersList.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>عنوان سرویس / ماشین *</Label>
                  <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="مثال: سرور اختصاصی لینوکس AX41" required className="rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>نوع سرویس</Label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-xs"
                    >
                      <option value="DEDICATED_SERVER">سرور اختصاصی</option>
                      <option value="CLOUD_HOSTING">هاستینگ و فضای ابری</option>
                      <option value="DOMAIN">دامنه ملی / بین‌المللی</option>
                      <option value="LICENSE">لایسنس نرم‌افزاری</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>مبلغ هزینه ماهانه (تومان) *</Label>
                    <Input type="number" value={monthlyExpenseToman} onChange={(e) => setMonthlyExpenseToman(e.target.value)} required className="rounded-xl font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>تاریخ سررسید تمدید</Label>
                  <Input type="date" value={serviceRenewalDate} onChange={(e) => setServiceRenewalDate(e.target.value)} className="rounded-xl font-mono" />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddServiceOpen(false)} className="rounded-xl">انصراف</Button>
                  <Button type="submit" size="sm" disabled={addServiceMutation.isPending} className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                    {addServiceMutation.isPending ? "در حال ثبت..." : "افزودن به خدمات تامین‌کننده"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suppliers List & Services Cards */}
        {suppliersList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-12 text-center flex flex-col items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-bold text-foreground">هیچ تامین‌کننده‌ای ثبت نشده است</div>
            <p className="text-xs text-muted-foreground max-w-sm">
              با تعریف تامین‌کنندگان زیرساخت و ثبت هزینه‌ها، جریان بدهکاری و تامین سرورها به صورت شفاف مدیریت می‌شود.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateSupplierOpen(true)}
              className="mt-2 h-9 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 ml-1" />
              ثبت اولین تامین‌کننده
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {suppliersList.map((supplier: any) => (
              <div
                key={supplier.id}
                className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xs p-5 shadow-xs hover:border-emerald-500/30 transition-all flex flex-col gap-4"
              >
                {/* Supplier Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">{supplier.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                            supplier.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted/50 text-muted-foreground border-border/40"
                          }`}
                        >
                          {supplier.status === "ACTIVE" ? "همکار فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {supplier.contactPerson && <span>مسئول: {supplier.contactPerson}</span>}
                        {supplier.phone && <span className="font-mono dir-ltr">{supplier.phone}</span>}
                        {supplier.email && <span className="font-mono dir-ltr">{supplier.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-left ml-3">
                      <div className="text-[10px] text-muted-foreground">بدهکاری ماهانه:</div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {Number(supplier.totalPayableToman || 0).toLocaleString("fa-IR")} تومان
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddServiceForSupplier(supplier.id)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                    >
                      <Plus className="h-3 w-3" />
                      سرویس جدید
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(supplier)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1 border-border/60 hover:bg-muted/40"
                    >
                      <Edit className="h-3 w-3" />
                      ویرایش
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`آیا از حذف تامین‌کننده ${supplier.name} اطمینان دارید؟`)) {
                          deleteSupplierMutation.mutate(supplier.id);
                        }
                      }}
                      className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Purchased Services List for this Supplier */}
                <div>
                  <div className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    سرویس‌های خریداری‌شده از این تامین‌کننده:
                  </div>

                  {!supplier.services || supplier.services.length === 0 ? (
                    <div className="p-3 rounded-xl bg-muted/10 border border-dashed border-border/40 text-xs text-muted-foreground text-center">
                      هنوز سرویسی از این تامین‌کننده ثبت نشده است. با کلیک روی دکمه «سرویس جدید» هاست، سرور یا دامنه خریداری شده را اضافه کنید.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {supplier.services.map((svc: any) => (
                        <div
                          key={svc.id}
                          className="p-3 rounded-xl bg-card/60 border border-border/40 flex flex-col justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground text-xs">{svc.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                {svc.type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                              <span>هزینه ماهانه:</span>
                              <span className="font-bold text-foreground font-mono">
                                {Number(svc.monthlyExpenseToman || 0).toLocaleString("fa-IR")} تومان
                              </span>
                            </div>
                            {svc.renewalDate && (
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  سررسید تمدید:
                                </span>
                                <span className="font-mono">
                                  {formatJalaliDate(svc.renewalDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

