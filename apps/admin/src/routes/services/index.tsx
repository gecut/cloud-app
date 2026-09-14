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
  Server,
  Plus,
  RefreshCw,
  X,
  Layers,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";

export const Route = createFileRoute("/services/")({
  component: AdminServicesListPage,
});

const DEFAULT_SERVICES = [
  {
    id: "svc_1",
    name: "وب‌سایت شرکتی چوبینو",
    description: "هاست و پشتیبانی وب‌سایت اصلی شرکت",
    status: "ACTIVE",
    priceToman: 2500000,
    customerId: "cust_1",
    customer: { name: "شرکت چوبینو" },
    renewalDate: "2026-12-01T00:00:00.000Z",
  },
  {
    id: "svc_2",
    name: "سرور دانلود اختصاصی",
    description: "سرور اختصاصی دانلود فایل و بکاپ",
    status: "SUSPENDED",
    priceToman: 4800000,
    customerId: "cust_1",
    customer: { name: "شرکت چوبینو" },
    renewalDate: "2026-08-15T00:00:00.000Z",
  },
  {
    id: "svc_3",
    name: "اپلیکیشن فروشگاهی رایان",
    description: "بک‌اند و دیتابیس اپلیکیشن فروشگاهی",
    status: "ACTIVE",
    priceToman: 3200000,
    customerId: "cust_2",
    customer: { name: "آژانس دیجیتال رایان" },
    renewalDate: "2026-04-10T00:00:00.000Z",
  },
  {
    id: "svc_4",
    name: "پنل مدیریت و مانیتورینگ",
    description: "سرویس مدیریت کاربران و احراز هویت",
    status: "ACTIVE",
    priceToman: 1800000,
    customerId: "cust_2",
    customer: { name: "آژانس دیجیتال رایان" },
    renewalDate: "2026-10-01T00:00:00.000Z",
  },
];

function AdminServicesListPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceToman, setPriceToman] = useState<number>(2000000);
  const [customerId, setCustomerId] = useState("cust_1");

  const { data: customersData } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiClient<{ items: any[] }>("/customers?limit=100"),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "services", selectedStatus],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        `/services?page=1&limit=50${selectedStatus !== "ALL" ? `&status=${selectedStatus}` : ""}`,
      ),
  });

  const createServiceMutation = useMutation({
    mutationFn: (newService: {
      name: string;
      description?: string;
      priceToman: number;
      customerId: string;
    }) =>
      apiClient("/services", {
        method: "POST",
        body: JSON.stringify(newService),
      }),
    onSuccess: () => {
      toast.success("سرویس جدید با موفقیت راه‌اندازی شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      setPriceToman(2000000);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد سرویس");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("عنوان سرویس الزامی است");
      return;
    }
    createServiceMutation.mutate({
      name,
      description: description || undefined,
      priceToman: Number(priceToman),
      customerId,
    });
  };

  const servicesList = data?.items?.length ? data.items : DEFAULT_SERVICES;
  const filteredList =
    selectedStatus === "ALL"
      ? servicesList
      : servicesList.filter((s: any) => s.status === selectedStatus);

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
            <h1 className="text-2xl font-bold tracking-tight">مدیریت سرویس‌ها و هاستینگ</h1>
            <p className="text-sm text-muted-foreground mt-1">
              تعریف و نظارت بر سرویس‌های میزبانی، سرورها و دامنه‌های اختصاص‌یافته به مشتریان
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
              سرویس جدید
            </Button>
          </div>
        </div>

        {/* Modal / Create Drawer */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Server className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">ایجاد و اختصاص سرویس جدید</h3>
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
                  <Label htmlFor="sname" className="text-xs font-semibold">
                    نام سرویس *
                  </Label>
                  <Input
                    id="sname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سرور دانلود ابری یا وب‌سایت فروشگاهی"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scust" className="text-xs font-semibold">
                    مشتری مربوطه *
                  </Label>
                  <select
                    id="scust"
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
                  <Label htmlFor="sprice" className="text-xs font-semibold">
                    هزینه ماهانه (تومان) *
                  </Label>
                  <Input
                    id="sprice"
                    type="number"
                    value={priceToman}
                    onChange={(e) => setPriceToman(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sdesc" className="text-xs font-semibold">
                    توضیحات و مشخصات فنی
                  </Label>
                  <Input
                    id="sdesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات تکمیلی، منابع و پلن"
                  />
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
                    disabled={createServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending ? "در حال ایجاد..." : "ایجاد سرویس"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "همه سرویس‌ها" },
            { id: "ACTIVE", label: "فعال" },
            { id: "SUSPENDED", label: "معلق" },
            { id: "INACTIVE", label: "غیرفعال" },
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

        {/* Services Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">عنوان سرویس</th>
                    <th className="py-3.5 px-4">مشتری</th>
                    <th className="py-3.5 px-4">هزینه دوره (تومان)</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4">سررسید تمدید</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredList.map((svc: any) => (
                    <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Server className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {svc.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {svc.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                          <User className="h-3.5 w-3.5" />
                          <span>{svc.customer?.name || svc.customerId || "شرکت چوبینو"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {(svc.priceToman || 0).toLocaleString("fa-IR")} تومان
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            svc.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : svc.status === "SUSPENDED"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {svc.status === "ACTIVE"
                            ? "فعال"
                            : svc.status === "SUSPENDED"
                            ? "معلق"
                            : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {svc.renewalDate
                          ? new Date(svc.renewalDate).toLocaleDateString("fa-IR")
                          : "نامشخص"}
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

