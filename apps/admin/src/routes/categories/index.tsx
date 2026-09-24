import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { AdminHeader } from "@/components/layout/admin-header";
import { apiClient } from "@/utils/api-client";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Server,
  Globe,
  HardDrive,
  Cpu,
  Package,
  AlertCircle,
  Tag,
  Hash,
  X,
  ExternalLink,
  MessageSquare,
  Headphones,
  Image,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/categories/")({
  component: AdminCategoriesPage,
});

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  servicesCount: number;
  createdAt: string;
  updatedAt: string;
}

function getCategoryIcon(slug: string, name?: string) {
  const s = `${slug || ""} ${name || ""}`.toLowerCase();
  if (s.includes("domain") || s.includes("دامنه")) return Globe;
  if (s.includes("server") || s.includes("سرور") || s.includes("vps")) return Server;
  if (s.includes("host") || s.includes("هاست") || s.includes("میزبانی")) return HardDrive;
  if (s.includes("sms") || s.includes("پیامک") || s.includes("پیام")) return MessageSquare;
  if (s.includes("support") || s.includes("پشتیبانی") || s.includes("تیکت")) return Headphones;
  if (s.includes("image") || s.includes("تصویر") || s.includes("عکس")) return Image;
  if (s.includes("api") || s.includes("ai") || s.includes("هوش")) return Cpu;
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج")) return Package;
  return Tag;
}

function formatJalaliDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Fetch Categories
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient<{ items: CategoryItem[]; total: number }>("/categories"),
  });

  const categories = data?.items || [];

  // Filtered categories (sorted newest first)
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch =
          !searchQuery.trim() ||
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && cat.isActive) ||
          (statusFilter === "INACTIVE" && !cat.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [categories, searchQuery, statusFilter]);

  // Metrics
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const totalLinkedServices = categories.reduce((sum, c) => sum + (c.servicesCount || 0), 0);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newCat: any) =>
      apiClient("/categories", {
        method: "POST",
        body: JSON.stringify(newCat),
      }),
    onSuccess: () => {
      toast.success("دسته‌بندی جدید با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCreateDescription("");
      setCreateIsActive(true);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد دسته‌بندی");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updateData }: any) =>
      apiClient(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      }),
    onSuccess: (_data, variables) => {
      const isToggle = Object.keys(variables).filter((k) => k !== "id").length === 1 && "isActive" in variables;
      if (isToggle) {
        toast.success(variables.isActive ? "دسته‌بندی فعال شد" : "دسته‌بندی غیرفعال شد");
      } else {
        toast.success("دسته‌بندی با موفقیت ویرایش شد");
        setIsEditOpen(false);
        setEditingCategory(null);
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش دسته‌بندی");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("دسته‌بندی با موفقیت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setIsDeleteOpen(false);
      setDeletingCategory(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در حذف دسته‌بندی");
    },
  });

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || "");
    setEditIsActive(cat.isActive);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (cat: CategoryItem) => {
    setDeletingCategory(cat);
    setIsDeleteOpen(true);
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 dir-rtl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-black text-foreground">مدیریت دسته‌بندی‌های سرویس</h1>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تعریف و مدیریت انواع دسته‌بندی‌ها (دامنه، سرور، هاست، API و...) برای تخصیص به سرویس‌ها و تامین‌کنندگان
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 rounded-xl text-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              افزودن دسته‌بندی جدید
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">کل دسته‌بندی‌ها</span>
              <span className="text-2xl font-black">{totalCategories.toLocaleString("fa-IR")}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">دسته‌بندی‌های فعال</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCategories.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">سرویس‌های متصل شده</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {totalLinkedServices.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border bg-card/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در نام، شناسه یا توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 rounded-xl text-xs bg-background h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto self-end">
            <Button
              variant={statusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-xl text-xs h-8 ${statusFilter === "ALL" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
            >
              همه ({categories.length})
            </Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`rounded-xl text-xs h-8 ${statusFilter === "ACTIVE" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
            >
              فعال ({activeCategories})
            </Button>
            <Button
              variant={statusFilter === "INACTIVE" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`rounded-xl text-xs h-8 ${statusFilter === "INACTIVE" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
            >
              غیرفعال ({totalCategories - activeCategories})
            </Button>
          </div>
        </div>

        {/* Categories Table / List */}
        <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs text-muted-foreground">در حال دریافت لیست دسته‌بندی‌ها...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground">دسته‌بندی یافت نشد</span>
                <span className="text-xs text-muted-foreground">
                  {searchQuery ? "موردی متناسب با فیلتر جستجوی شما پیدا نشد." : "هنوز دسته‌بندی‌ای ثبت نشده است."}
                </span>
              </div>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5 ml-1" />
                  ایجاد اولین دسته‌بندی
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3.5 px-4">دسته‌بندی</th>
                    <th className="py-3.5 px-4">شناسه انگلیسی (اسلاگ)</th>
                    <th className="py-3.5 px-4">توضیحات</th>
                    <th className="py-3.5 px-4 text-center">سرویس‌های مرتبط</th>
                    <th className="py-3.5 px-4 text-center">وضعیت</th>
                    <th className="py-3.5 px-4 text-center">تاریخ ایجاد</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredCategories.map((cat) => {
                    const IconComp = getCategoryIcon(cat.slug);
                    return (
                      <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <IconComp className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground text-sm">{cat.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{cat.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border w-fit">
                            <Hash className="h-3 w-3 text-muted-foreground/60" />
                            <span>{cat.slug}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-muted-foreground line-clamp-1 leading-relaxed">
                            {cat.description || "بدون توضیحات"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Link
                            to="/services"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                            title="مشاهده سرویس‌های این دسته"
                          >
                            <span>{cat.servicesCount} سرویس</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {cat.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              فعال
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <XCircle className="h-3 w-3" />
                              غیرفعال
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center text-muted-foreground">
                          {formatJalaliDate(cat.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: cat.id,
                                  isActive: !cat.isActive,
                                })
                              }
                              disabled={updateMutation.isPending}
                              className={`h-8 w-8 cursor-pointer rounded-lg ${
                                cat.isActive
                                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  : "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              }`}
                              title={cat.isActive ? "غیرفعال کردن دسته‌بندی" : "فعال کردن دسته‌بندی"}
                            >
                              {cat.isActive ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(cat)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                              title="ویرایش دسته‌بندی"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(cat)}
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer rounded-lg"
                              title="حذف دسته‌بندی"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Category Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">ایجاد دسته‌بندی جدید</h2>
                    <p className="text-[11px] text-muted-foreground">تعریف نوع جدید سرویس برای استفاده در کل سیستم</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">
                    نام دسته‌بندی <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="مثال: سرور ابری، هاست لینوکس، ثبت دامنه، پکیج هوش مصنوعی..."
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">شناسه انگلیسی (اسلاگ - اختیاری)</label>
                  <Input
                    placeholder="مثال: cloud-server, domain, hosting (در صورت خالی بودن خودکار تولید می‌شود)"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono dir-ltr text-left"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">توضیحات دسته‌بندی</label>
                  <textarea
                    rows={3}
                    placeholder="توضیح کوتاه درباره ویژگی‌ها یا کاربرد این دسته‌بندی..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="rounded-xl border bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <span className="font-medium text-foreground">وضعیت فعالیت دسته‌بندی</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateIsActive(!createIsActive)}
                    className={`rounded-xl text-xs h-7 px-3 ${
                      createIsActive
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {createIsActive ? "فعال" : "غیرفعال"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  onClick={() => {
                    const clean = createName.trim();
                    if (!clean) {
                      toast.error("لطفاً نام دسته‌بندی را وارد کنید");
                      return;
                    }
                    if (categories.some((c) => c.name.trim().toLowerCase() === clean.toLowerCase())) {
                      toast.error("دسته‌بندی با این نام قبلاً ایجاد شده است");
                      return;
                    }
                    createMutation.mutate({
                      name: clean,
                      slug: createSlug.trim() || undefined,
                      description: createDescription.trim() || undefined,
                      isActive: createIsActive,
                    });
                  }}
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  {createMutation.isPending ? "در حال ذخیره..." : "ثبت و ایجاد دسته‌بندی"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {isEditOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">ویرایش دسته‌بندی</h2>
                    <p className="text-[11px] text-muted-foreground">{editingCategory.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">نام دسته‌بندی</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">شناسه انگلیسی (اسلاگ)</label>
                  <Input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono dir-ltr text-left"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-foreground">توضیحات</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="rounded-xl border bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <span className="font-medium text-foreground">وضعیت فعالیت</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`rounded-xl text-xs h-7 px-3 ${
                      editIsActive
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {editIsActive ? "فعال" : "غیرفعال"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  onClick={() => {
                    const clean = editName.trim();
                    if (!clean) {
                      toast.error("نام دسته‌بندی نمی‌تواند خالی باشد");
                      return;
                    }
                    if (
                      categories.some(
                        (c) =>
                          c.id !== editingCategory.id &&
                          c.name.trim().toLowerCase() === clean.toLowerCase(),
                      )
                    ) {
                      toast.error("دسته‌بندی دیگری با این نام قبلاً ایجاد شده است");
                      return;
                    }
                    updateMutation.mutate({
                      id: editingCategory.id,
                      name: clean,
                      slug: editSlug.trim() || undefined,
                      description: editDescription.trim() || undefined,
                      isActive: editIsActive,
                    });
                  }}
                  disabled={updateMutation.isPending}
                  className="flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Modal */}
        {isDeleteOpen && deletingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-card border rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-center">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
                <Trash2 className="h-6 w-6" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-foreground">حذف دسته‌بندی</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  آیا از حذف دسته‌بندی <span className="font-bold text-foreground">«{deletingCategory.name}»</span> اطمینان دارید؟
                </p>
                {deletingCategory.servicesCount > 0 && (
                  <div className="p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 text-right">
                    <span className="font-bold">توجه:</span> این دسته‌بندی دارای{" "}
                    <span className="font-bold">{deletingCategory.servicesCount}</span> سرویس متصل است. در صورت حذف، سرویس‌های متصل به صورت خودکار به دسته‌بندی پیش‌فرض منتقل خواهند شد.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => deleteMutation.mutate(deletingCategory.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 rounded-xl text-xs bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  {deleteMutation.isPending ? "در حال حذف..." : "تایید و حذف"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
