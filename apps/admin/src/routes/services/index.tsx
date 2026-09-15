import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { toast } from "sonner";
import {
  Server,
  Plus,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  Search,
  Layers,
  Globe,
  HardDrive,
  Cpu,
  Package,
  Users,
  CheckCircle,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";

export const Route = createFileRoute("/services/")({
  component: AdminServicesListPage,
});

const SERVICE_CATEGORIES = [
  { id: "all", name: "همه سرویس‌ها", slug: "all", icon: Layers },
  { id: "domain", name: "دامنه", slug: "domain", icon: Globe },
  { id: "server", name: "سرور", slug: "server", icon: Server },
  { id: "hosting", name: "هاست", slug: "hosting", icon: HardDrive },
  { id: "api", name: "وب‌سرویس و API", slug: "api", icon: Cpu },
  { id: "package", name: "بسته تعدادی / پکیج", slug: "package", icon: Package },
];

function getCategoryBadge(slug?: string) {
  switch (slug) {
    case "domain":
      return {
        label: "دامنه",
        icon: Globe,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "server":
      return {
        label: "سرور",
        icon: Server,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    case "hosting":
      return {
        label: "هاستینگ",
        icon: HardDrive,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    case "api":
      return {
        label: "وب‌سرویس و API",
        icon: Cpu,
        className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      };
    case "package":
      return {
        label: "بسته تعدادی",
        icon: Package,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    default:
      return {
        label: "سرویس ابری",
        icon: Layers,
        className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      };
  }
}

function AdminServicesListPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "type">("newest");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form states for Create / Edit Service Template
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("hosting");
  const [description, setDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string>("hosting");
  const [editDescription, setEditDescription] = useState("");

  const { data: servicesData, isLoading, refetch } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=100"),
  });

  const allItems = servicesData?.items || [];

  // Group into distinct catalog service templates and count assigned customers
  const catalogServices = Array.from(
    new Map(
      allItems.map((s: any) => {
        const catSlug = s.serviceType?.slug || "hosting";
        const assignedCustomers = allItems.filter(
          (other: any) => other.name?.trim() === s.name?.trim() && other.customerId,
        );
        return [
          s.name?.trim(),
          {
            id: s.id,
            name: s.name,
            categorySlug: catSlug,
            serviceType: s.serviceType,
            serviceTypeId: s.serviceTypeId,
            description: s.description,
            assignedCount: assignedCustomers.length,
            createdAt: s.createdAt,
          },
        ];
      }),
    ).values(),
  );

  // Filter by category and search
  const filteredServices = catalogServices
    .filter((svc: any) => {
      if (selectedCategory !== "all" && svc.categorySlug !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = svc.name?.toLowerCase().includes(q);
        const matchDesc = svc.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "fa");
      }
      if (sortBy === "type") {
        return (a.categorySlug || "").localeCompare(b.categorySlug || "");
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس جدید با موفقیت به کاتالوگ اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      setCategory("hosting");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد سرویس");
    },
  });

  // Update Service Mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس با موفقیت بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در بروزرسانی سرویس");
    },
  });

  // Delete Service Mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/services/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("سرویس با موفقیت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در حذف سرویس");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام سرویس / بسته الزامی است");
      return;
    }
    createServiceMutation.mutate({
      name: name.trim(),
      serviceTypeSlug: category,
      description: description.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editName.trim()) {
      toast.error("نام سرویس الزامی است");
      return;
    }
    updateServiceMutation.mutate({
      id: editingService.id,
      data: {
        name: editName.trim(),
        serviceTypeSlug: editCategory,
        description: editDescription.trim() || undefined,
      },
    });
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 py-8 animate-entrance">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  کاتالوگ و تعریف سرویس‌ها
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  تعریف انواع سرویس‌ها و بسته‌ها (قیمت، دوره و تعداد در پروفایل هر مشتری تعیین می‌شود)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 text-xs h-9 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              ایجاد بسته / سرویس جدید
            </Button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/40">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={`gap-1.5 text-xs h-8 rounded-full transition-all ${
                  isSelected ? "shadow-xs" : "bg-card hover:bg-muted/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سرویس یا بسته..."
              className="pr-9 text-xs h-9 bg-card"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>مرتب‌سازی:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="newest">جدیدترین</option>
              <option value="name">نام (الفبا)</option>
              <option value="type">نوع و دسته‌بندی</option>
            </select>
          </div>
        </div>

        {/* Services Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">ردیف</th>
                    <th className="py-3.5 px-4">نام سرویس / بسته</th>
                    <th className="py-3.5 px-4">دسته‌بندی</th>
                    <th className="py-3.5 px-4">مشخصات و توضیحات</th>
                    <th className="py-3.5 px-4 text-center">تعداد مشترکین فعال</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Server className="h-8 w-8 text-muted-foreground/40" />
                          <p className="font-semibold text-sm">هیچ سرویسی در این دسته‌بندی یافت نشد</p>
                          <p className="text-xs">
                            جهت تعریف سرویس جدید، از دکمه «ایجاد بسته / سرویس جدید» استفاده کنید.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((svc: any, idx: number) => {
                      const badge = getCategoryBadge(svc.categorySlug);
                      const BadgeIcon = badge.icon;
                      return (
                        <tr key={svc.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground text-sm">
                            {svc.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.className}`}
                            >
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground max-w-sm">
                            {svc.description || "---"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold text-[11px]">
                              <Users className="h-3 w-3" />
                              {svc.assignedCount} مشترک
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Link to="/customers" search={{}}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 h-7 text-[11px] font-medium gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  تخصیص به مشترک
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingService(svc);
                                  setEditName(svc.name);
                                  setEditCategory(svc.categorySlug || "hosting");
                                  setEditDescription(svc.description || "");
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 h-7 text-[11px] font-medium"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`آیا از حذف سرویس «${svc.name}» اطمینان دارید؟`)) {
                                    deleteServiceMutation.mutate(svc.id);
                                  }
                                }}
                                disabled={deleteServiceMutation.isPending}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 text-[11px]"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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

        {/* MODAL: CREATE SERVICE / PACKAGE TEMPLATE */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ایجاد بسته / سرویس جدید</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تعریف در کاتالوگ (قیمت و دوره هنگام تخصیص به هر مشتری تعیین می‌شود)
                    </p>
                  </div>
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
                {/* 1. Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب دسته‌بندی / نوع سرویس *</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring font-medium"
                    required
                  >
                    <option value="domain">دامنه (ثبت و مدیریت دامنه)</option>
                    <option value="server">سرور (سرور ابری و اختصاصی)</option>
                    <option value="hosting">هاست (هاستینگ و میزبانی وب)</option>
                    <option value="api">وب‌سرویس و API (سرویس‌های ابری و API)</option>
                    <option value="package">بسته تعدادی / پکیج (بسته‌های پیامک، پکیج‌های حجمی و...)</option>
                  </select>
                </div>

                {/* 2. Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام بسته / سرویس *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: هاست لینوکس ابری NVMe، سرور مجازی آلمان، بسته ۵۰۰۰ پیامک..."
                    required
                  />
                </div>

                {/* 3. Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و مشخصات فنی (اختیاری)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات اختیاری درباره امکانات و کاربرد این سرویس"
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
                    {createServiceMutation.isPending ? "در حال ایجاد..." : "ایجاد سرویس در کاتالوگ"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT SERVICE / PACKAGE TEMPLATE */}
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش سرویس / بسته</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تغییر نام، دسته‌بندی و توضیحات
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingService(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب دسته‌بندی / نوع سرویس *</Label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring font-medium"
                    required
                  >
                    <option value="domain">دامنه (ثبت و مدیریت دامنه)</option>
                    <option value="server">سرور (سرور ابری و اختصاصی)</option>
                    <option value="hosting">هاست (هاستینگ و میزبانی وب)</option>
                    <option value="api">وب‌سرویس و API (سرویس‌های ابری و API)</option>
                    <option value="package">بسته تعدادی / پکیج (بسته‌های پیامک، پکیج‌های حجمی و...)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام بسته / سرویس *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و مشخصات فنی (اختیاری)</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateServiceMutation.isPending}
                  >
                    {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
