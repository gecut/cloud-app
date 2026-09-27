import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { ModalPortal } from "@/components/common/modal-portal";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Chip } from "@heroui/react";
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
  Lock,
  Building2,
} from "lucide-react";
import { formatInvoiceNumber } from "@/utils/format";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

export const Route = createFileRoute("/invoices/")({
  component: AdminInvoicesListPage,
});

function getCategoryBadge(slug?: string, name?: string) {
  const s = `${slug || ""} ${name || ""}`.toLowerCase();
  if (s.includes("domain") || s.includes("دامنه")) {
    return {
      icon: Globe,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }
  if (s.includes("server") || s.includes("سرور") || s.includes("vps") || s.includes("اختصاصی")) {
    return {
      icon: Server,
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };
  }
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج") || s.includes("تعدادی")) {
    return {
      icon: Package,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (s.includes("api") || s.includes("وب‌سرویس") || s.includes("وب سرویس") || s.includes("هوش")) {
    return {
      icon: Cpu,
      className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    };
  }
  if (s.includes("host") || s.includes("هاست") || s.includes("میزبانی") || s.includes("cloud")) {
    return {
      icon: HardDrive,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  return {
    icon: Layers,
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };
}

function getInvoiceCategoryInfo(
  inv: any,
  rawCategories: any = [],
  rawServices: any = [],
): { id: string; name: string; slug: string } {
  const categories: any[] = Array.isArray(rawCategories)
    ? rawCategories
    : Array.isArray(rawCategories?.items)
    ? rawCategories.items
    : [];
  const services: any[] = Array.isArray(rawServices)
    ? rawServices
    : Array.isArray(rawServices?.items)
    ? rawServices.items
    : [];

  const item = inv?.items?.[0];
  const serviceId = item?.serviceId || item?.service?.id;

  // 1. Direct relation from item.service or match by serviceId
  let service = item?.service || (serviceId ? services.find((s) => s.id === serviceId) : null);

  // 1b. If no direct service by ID, search among services matching text
  if (!service && services.length > 0) {
    const text = `${item?.title || ""} ${inv?.notes || ""} ${item?.description || ""} ${item?.serviceNameSnapshot || ""}`.toLowerCase();
    const custServices = services.filter((s) => s.customerId === inv?.customerId);
    const candidateServices = custServices.length > 0 ? custServices : services;
    for (const s of candidateServices) {
      if (s.name && s.name.trim().length > 1 && text.includes(s.name.toLowerCase())) {
        service = s;
        break;
      }
    }
  }

  // 2. Resolve serviceType from service
  const serviceType =
    service?.serviceType ||
    (service?.serviceTypeId
      ? categories.find((c) => c.id === service.serviceTypeId)
      : null);

  if (serviceType?.id) {
    return {
      id: serviceType.id,
      name: serviceType.name || service?.name || "سرویس",
      slug: serviceType.slug || "hosting",
    };
  }

  // 3. Check serviceTypeSnapshot on item
  const snapshot = (item?.serviceTypeSnapshot || "").trim();
  if (snapshot) {
    const matched = categories.find(
      (c) =>
        c.name?.toLowerCase() === snapshot.toLowerCase() ||
        c.slug?.toLowerCase() === snapshot.toLowerCase() ||
        c.id === snapshot,
    );
    if (matched) {
      return { id: matched.id, name: matched.name, slug: matched.slug };
    }
    const snapUpper = snapshot.toUpperCase();
    if (snapUpper.includes("SERVER") || snapUpper.includes("DEDICATED") || snapUpper.includes("VPS")) {
      const serverCat = categories.find((c) => c.slug?.includes("server") || c.name?.includes("سرور"));
      return serverCat
        ? { id: serverCat.id, name: serverCat.name, slug: serverCat.slug }
        : { id: "server", name: "سرور اختصاصی و VPS", slug: "server" };
    }
    if (snapUpper.includes("HOSTING") || snapUpper.includes("CLOUD")) {
      const hostCat = categories.find((c) => c.slug?.includes("host") || c.name?.includes("هاست"));
      return hostCat
        ? { id: hostCat.id, name: hostCat.name, slug: hostCat.slug }
        : { id: "hosting", name: "هاست و فضای ابری", slug: "hosting" };
    }
    if (snapUpper.includes("DOMAIN")) {
      const domCat = categories.find((c) => c.slug?.includes("domain") || c.name?.includes("دامنه"));
      return domCat
        ? { id: domCat.id, name: domCat.name, slug: domCat.slug }
        : { id: "domain", name: "ثبت و تمدید دامنه", slug: "domain" };
    }
    if (snapUpper.includes("API")) {
      const apiCat = categories.find((c) => c.slug?.includes("api") || c.name?.includes("وب"));
      return apiCat
        ? { id: apiCat.id, name: apiCat.name, slug: apiCat.slug }
        : { id: "api", name: "وب‌سرویس و API", slug: "api" };
    }
    if (snapUpper.includes("PACKAGE")) {
      const pkgCat = categories.find((c) => c.slug?.includes("package") || c.name?.includes("بسته"));
      return pkgCat
        ? { id: pkgCat.id, name: pkgCat.name, slug: pkgCat.slug }
        : { id: "package", name: "بسته‌ها و پکیج‌ها", slug: "package" };
    }
    return {
      id: snapshot,
      name: snapshot,
      slug: snapshot.toLowerCase().replace(/\s+/g, "-"),
    };
  }

  // 4. Text-based matching against all categories
  const fullText = `${item?.title || ""} ${inv?.notes || ""} ${item?.description || ""} ${item?.serviceNameSnapshot || ""}`.toLowerCase();

  for (const cat of categories) {
    const cName = (cat.name || "").toLowerCase();
    const cSlug = (cat.slug || "").toLowerCase();
    if (cName && fullText.includes(cName)) {
      return { id: cat.id, name: cat.name, slug: cat.slug };
    }
    if (cSlug && !cSlug.startsWith("cat-") && fullText.includes(cSlug)) {
      return { id: cat.id, name: cat.name, slug: cat.slug };
    }
  }

  // 5. Keyword heuristics
  if (fullText.includes("دامنه") || fullText.includes("domain") || /\.(ir|com|org|net|co|site|online|io|xyz|info)\b/i.test(fullText)) {
    const domainCat = categories.find((c) => c.slug?.includes("domain") || c.name?.includes("دامنه"));
    return domainCat
      ? { id: domainCat.id, name: domainCat.name, slug: domainCat.slug }
      : { id: "domain", name: "دامنه", slug: "domain" };
  }

  if (fullText.includes("سرور") || fullText.includes("server") || fullText.includes("vps") || fullText.includes("اختصاصی") || fullText.includes("مجازی")) {
    const serverCat = categories.find((c) => c.slug?.includes("server") || c.name?.includes("سرور") || c.slug?.includes("vps"));
    return serverCat
      ? { id: serverCat.id, name: serverCat.name, slug: serverCat.slug }
      : { id: "server", name: "سرور", slug: "server" };
  }

  if (fullText.includes("بسته") || fullText.includes("پکیج") || fullText.includes("package") || fullText.includes("تعدادی") || (item?.quantity && item.quantity > 1)) {
    const pkgCat = categories.find((c) => c.slug?.includes("package") || c.name?.includes("بسته") || c.name?.includes("پکیج") || c.name?.includes("تعدادی"));
    return pkgCat
      ? { id: pkgCat.id, name: pkgCat.name, slug: pkgCat.slug }
      : { id: "package", name: "بسته‌ها و پکیج‌ها", slug: "package" };
  }

  if (fullText.includes("api") || fullText.includes("وب‌سرویس") || fullText.includes("وب سرویس")) {
    const apiCat = categories.find((c) => c.slug?.includes("api") || c.name?.includes("وب"));
    return apiCat
      ? { id: apiCat.id, name: apiCat.name, slug: apiCat.slug }
      : { id: "api", name: "وب‌سرویس و API", slug: "api" };
  }

  const defaultCat = categories.find((c) => c.slug?.includes("host") || c.name?.includes("هاست")) || categories[0];
  if (defaultCat) {
    return { id: defaultCat.id, name: defaultCat.name, slug: defaultCat.slug };
  }

  return { id: "hosting", name: "هاست و ابری", slug: "hosting" };
}

function AdminInvoicesListPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [counterpartyFilter, setCounterpartyFilter] = useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "category" | "amount-desc" | "amount-asc" | "due-asc">("newest");
  const [page, setPage] = useState<number>(1);
  const PAGE_LIMIT = 30;
  const [isCreateOpen, setIsCreateOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("create") === "true" || params.get("new") === "true" || params.get("new") === "1";
    }
    return false;
  });

  // Form states
  const [counterpartyType, setCounterpartyType] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [selectedSupplierServiceId, setSelectedSupplierServiceId] = useState<string>("");
  const [isCreatingNewSupplierService, setIsCreatingNewSupplierService] = useState<boolean>(false);
  const [newSupplierServiceName, setNewSupplierServiceName] = useState<string>("");
  const [newSupplierServiceType, setNewSupplierServiceType] = useState<string>("SERVER");
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

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/suppliers?limit=100"),
  });

  const suppliers = useMemo(() => {
    if (Array.isArray(suppliersData)) return suppliersData;
    return suppliersData?.items || [];
  }, [suppliersData]);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/categories"),
  });

  const categories = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData;
    return categoriesData?.items || [];
  }, [categoriesData]);

  useEffect(() => {
    if (categories.length > 0) {
      if (
        !newSupplierServiceType ||
        newSupplierServiceType === "SERVER" ||
        !categories.some(
          (c: any) => c.slug === newSupplierServiceType || c.id === newSupplierServiceType,
        )
      ) {
        setNewSupplierServiceType(categories[0].slug || categories[0].id);
      }
    }
  }, [categories, newSupplierServiceType]);

  const { data: servicesData } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=200"),
  });

  const services = useMemo(() => {
    const list = Array.isArray(servicesData) ? servicesData : servicesData?.items || [];
    return list.filter(
      (s: any) => (!s.childServices || s.childServices.length === 0) && Boolean(s.customerId),
    );
  }, [servicesData]);

  const { data: supplierServicesData } = useQuery({
    queryKey: ["admin", "suppliers", "services"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/suppliers/services?limit=200"),
  });

  const supplierServices = useMemo(() => {
    if (Array.isArray(supplierServicesData)) return supplierServicesData;
    return supplierServicesData?.items || [];
  }, [supplierServicesData]);

  const customerOptions = customersData?.items || [];

  useEffect(() => {
    if (customerOptions.length > 0 && (!customerId || !customerOptions.some((c: any) => c.id === customerId))) {
      setCustomerId(customerOptions[0].id);
    }
  }, [customerOptions, customerId]);

  useEffect(() => {
    if (suppliers.length > 0 && (!supplierId || !suppliers.some((s: any) => s.id === supplierId))) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

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
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
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

  const reactivateInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient(`/invoices/${invoiceId}/reactivate`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت مجدداً فعال شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در فعال‌سازی مجدد فاکتور");
    },
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      toast.error("عنوان ردیف فاکتور الزامی است");
      return;
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));

    let effectiveServiceId = selectedSupplierServiceId;
    const effectiveSupplierId = supplierId || suppliers[0]?.id;

    if (counterpartyType === "SUPPLIER") {
      if (!effectiveSupplierId) {
        toast.error("تامین‌کننده‌ای یافت نشد. لطفاً ابتدا در بخش تامین‌کنندگان یک تامین‌کننده تعریف نمایید");
        return;
      }
      if (isCreatingNewSupplierService && newSupplierServiceName.trim()) {
        try {
          const newSvc = await apiClient<{ id: string }>("/suppliers/services", {
            method: "POST",
            body: JSON.stringify({
              supplierId: effectiveSupplierId,
              name: newSupplierServiceName.trim(),
              type: newSupplierServiceType,
              priceToman: Number(amountToman),
              monthlyExpenseToman: Number(amountToman),
            }),
          });
          effectiveServiceId = newSvc.id;
          queryClient.invalidateQueries({ queryKey: ["admin", "suppliers", "services"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
        } catch (err: any) {
          toast.error("خطا در ایجاد سرویس جدید تامین‌کننده");
          return;
        }
      }
    } else {
      if (!customerId) {
        toast.error("لطفاً مشتری را انتخاب نمایید");
        return;
      }
    }

    const payload: any = {
      dueDate: dueDate.toISOString(),
      counterpartyType,
      supplierId: counterpartyType === "SUPPLIER" ? effectiveSupplierId : undefined,
      customerId: counterpartyType === "CUSTOMER" ? customerId : undefined,
      items: [
        {
          title: itemTitle,
          unitPriceToman: Number(amountToman),
          quantity: 1,
          serviceId: effectiveServiceId && effectiveServiceId !== "custom" && effectiveServiceId !== "new" ? effectiveServiceId : undefined,
        },
      ],
    };

    createInvoiceMutation.mutate(payload);
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
            ...(editingInvoice.items?.[0]?.serviceId ? { serviceId: editingInvoice.items[0].serviceId } : {}),
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

  const nonCancelledInvoices = invoicesList.filter((i: any) => i.status !== "CANCELLED");

  const activeTabsList = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: any; count: number }> = [
      { id: "ALL", label: "همه موضوعات", icon: Layers, count: nonCancelledInvoices.length },
    ];
    const catList = Array.isArray(categories) ? categories : [];
    if (catList.length > 0) {
      for (const c of catList) {
        const cCount = nonCancelledInvoices.filter((inv: any) => {
          const info = getInvoiceCategoryInfo(inv, catList, services);
          return info.id === c.id || info.slug === c.slug;
        }).length;
        list.push({
          id: c.id,
          label: c.name,
          icon: getCategoryBadge(c.slug, c.name).icon,
          count: cCount,
        });
      }
    } else {
      for (const fallback of [
        { id: "hosting", label: "هاست و فضای ابری", slug: "hosting" },
        { id: "server", label: "سرور اختصاصی و VPS", slug: "server" },
        { id: "domain", label: "دامنه", slug: "domain" },
        { id: "api", label: "وب‌سرویس و API", slug: "api" },
        { id: "package", label: "بسته‌ها و پکیج‌ها", slug: "package" },
      ]) {
        const cCount = nonCancelledInvoices.filter((inv: any) => {
          const info = getInvoiceCategoryInfo(inv, categories, services);
          return info.slug === fallback.slug || info.id === fallback.id;
        }).length;
        list.push({
          id: fallback.id,
          label: fallback.label,
          icon: getCategoryBadge(fallback.slug, fallback.label).icon,
          count: cCount,
        });
      }
    }
    return list;
  }, [categories, services, nonCancelledInvoices]);

  const filteredList = invoicesList.filter((inv: any) => {
    if (counterpartyFilter === "CUSTOMER") {
      if (inv.supplierId || inv.counterpartyType === "SUPPLIER") return false;
    } else if (counterpartyFilter === "SUPPLIER") {
      if (!inv.supplierId && inv.counterpartyType !== "SUPPLIER") return false;
    }

    if (selectedStatus === "OVERDUE") {
      if (inv.status !== "UNPAID" || !inv.dueDate || new Date(inv.dueDate).getTime() >= Date.now()) return false;
    } else if (selectedStatus === "CANCELLED") {
      if (inv.status !== "CANCELLED") return false;
    } else if (selectedStatus !== "ALL" && inv.status !== selectedStatus) {
      return false;
    }

    if (selectedCategory !== "ALL") {
      // In category views, cancelled invoices are NEVER shown (they go to "لغو شده")
      if (inv.status === "CANCELLED") return false;
      const catInfo = getInvoiceCategoryInfo(inv, categories, services);
      if (catInfo.id !== selectedCategory && catInfo.slug !== selectedCategory) return false;
    } else {
      // In ALL categories, if selectedStatus is "ALL", exclude CANCELLED invoices so they strictly go to "لغو شده"
      if (selectedStatus === "ALL" && inv.status === "CANCELLED") {
        return false;
      }
    }
    return true;
  });

  const sortedList = [...filteredList].sort((a: any, b: any) => {
    if (sortBy === "oldest") {
      return new Date(a.issuedAt || a.createdAt || 0).getTime() - new Date(b.issuedAt || b.createdAt || 0).getTime();
    }
    if (sortBy === "category") {
      const catA = getInvoiceCategoryInfo(a, categories, services).name;
      const catB = getInvoiceCategoryInfo(b, categories, services).name;
      const cmp = catA.localeCompare(catB, "fa");
      if (cmp !== 0) return cmp;
      return new Date(b.issuedAt || b.createdAt || 0).getTime() - new Date(a.issuedAt || a.createdAt || 0).getTime();
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
      <div className="flex flex-col gap-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت فاکتورها و صورت‌حساب‌ها</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              صدور صورت‌حساب‌های دوره‌ای بر پایه اسنپ‌شات قطعی تومان و پیگیری مطالبات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!supplierId && suppliers.length > 0) {
                  setSupplierId(suppliers[0].id);
                }
                if (!customerId && customerOptions.length > 0) {
                  setCustomerId(customerOptions[0].id);
                }
                setIsCreateOpen(true);
              }}
              className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              صدور فاکتور جدید
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Cards (Interactive Quick Filters) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Unpaid / Receivables */}
          <div
            onClick={() => {
              setSelectedStatus((s) => (s === "UNPAID" ? "ALL" : "UNPAID"));
              setPage(1);
            }}
            className={`rounded-2xl border p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "UNPAID"
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">کل مطالبات در انتظار تسویه</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
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
            className={`rounded-2xl border p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "OVERDUE"
                ? "border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30"
                : "border-rose-500/20 bg-rose-500/[0.03] hover:bg-rose-500/[0.07]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">معوقات سررسید گذشته (فوری)</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
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
            className={`rounded-2xl border p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "PAID"
                ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">دریافتی‌های تسویه‌شده</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
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
              setSelectedStatus((s) => {
                const next = s === "CANCELLED" ? "ALL" : "CANCELLED";
                if (next === "CANCELLED") {
                  setSelectedCategory("ALL");
                }
                return next;
              });
              setPage(1);
            }}
            className={`rounded-2xl border p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all ${
              selectedStatus === "CANCELLED"
                ? "border-zinc-500 bg-zinc-500/10 ring-2 ring-zinc-500/20"
                : "border-border/50 bg-card/40 hover:bg-card/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">فاکتورهای لغو شده (باطل)</span>
              <div className="p-2.5 rounded-xl bg-zinc-500/10 text-zinc-500">
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
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !createInvoiceMutation.isPending) setIsCreateOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 sm:p-7 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2.5">
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

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5 mt-5">
                {/* Counterparty Type Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">نوع طرف‌حساب فاکتور *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={counterpartyType === "CUSTOMER" ? "default" : "outline"}
                      onClick={() => setCounterpartyType("CUSTOMER")}
                      className={`text-xs h-9 cursor-pointer rounded-xl ${
                        counterpartyType === "CUSTOMER" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      <User className="h-3.5 w-3.5 ml-1.5" />
                      مشتری (فاکتور فروش)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={counterpartyType === "SUPPLIER" ? "default" : "outline"}
                      onClick={() => {
                        setCounterpartyType("SUPPLIER");
                        if (!supplierId && suppliers.length > 0) {
                          setSupplierId(suppliers[0].id);
                        }
                      }}
                      className={`text-xs h-9 cursor-pointer rounded-xl ${
                        counterpartyType === "SUPPLIER" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 ml-1.5" />
                      تامین‌کننده (فاکتور خرید)
                    </Button>
                  </div>
                </div>

                {counterpartyType === "CUSTOMER" ? (
                  <div className="space-y-2">
                    <Label htmlFor="icust" className="text-xs font-semibold">
                      مشتری صورت‌حساب *
                    </Label>
                    <select
                      id="icust"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      {customerOptions.length === 0 ? (
                        <option value="">هیچ مشتری‌ای ثبت نشده است</option>
                      ) : (
                        customerOptions.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.id})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="isupplier" className="text-xs font-semibold">
                        تامین‌کننده بستانکار (طرف حساب) *
                      </Label>
                      <select
                        id="isupplier"
                        value={supplierId || suppliers[0]?.id || ""}
                        onChange={(e) => {
                          setSupplierId(e.target.value);
                          setSelectedSupplierServiceId("");
                          setIsCreatingNewSupplierService(false);
                        }}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
                      >
                        {suppliers.length === 0 ? (
                          <option value="">هیچ تامین‌کننده‌ای ثبت نشده است</option>
                        ) : (
                          suppliers.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.contactName || s.email || s.id})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Supplier Service Selector */}
                    <div className="space-y-2 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isupsvc" className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <Server className="h-3.5 w-3.5" />
                          <span>انتخاب یا ثبت سرویس تامین‌کننده</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {supplierServices.filter((s: any) => s.supplierId === supplierId).length.toLocaleString("fa-IR")} سرویس ثبت‌شده
                        </span>
                      </div>

                      <select
                        id="isupsvc"
                        value={isCreatingNewSupplierService ? "new" : selectedSupplierServiceId || "custom"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "new") {
                            setIsCreatingNewSupplierService(true);
                            setSelectedSupplierServiceId("");
                            setItemTitle(newSupplierServiceName);
                          } else if (val === "custom") {
                            setIsCreatingNewSupplierService(false);
                            setSelectedSupplierServiceId("");
                          } else {
                            setIsCreatingNewSupplierService(false);
                            setSelectedSupplierServiceId(val);
                            const svc = supplierServices.find((s: any) => s.id === val);
                            if (svc) {
                              setItemTitle(svc.name);
                              const p = svc.priceToman || svc.monthlyExpenseToman || 0;
                              if (p > 0) setAmountToman(p);
                            }
                          }
                        }}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
                      >
                        <option value="custom">-- ورود دستی شرح خدمت و هزینه --</option>
                        {supplierServices.filter((s: any) => s.supplierId === supplierId).map((s: any) => (
                          <option key={s.id} value={s.id}>
                            سرویس: {s.name} ({(s.priceToman || s.monthlyExpenseToman || 0).toLocaleString("fa-IR")} تومان) - {s.type || "سرور"}
                          </option>
                        ))}
                        <option value="new">+ تعریف و ثبت مستقیم سرویس جدید برای این تامین‌کننده</option>
                      </select>

                      {isCreatingNewSupplierService && (
                        <div className="flex flex-col gap-2.5 pt-2 border-t border-purple-500/20 animate-in fade-in duration-150">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                              نام سرویس جدید تامین‌کننده *
                            </Label>
                            <Input
                              value={newSupplierServiceName}
                              onChange={(e) => {
                                setNewSupplierServiceName(e.target.value);
                                setItemTitle(e.target.value);
                              }}
                              placeholder="مثال: سرور اختصاصی آلمان AX52، هاست ابری، لایسنس cPanel..."
                              className="h-9 text-xs"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                              نوع خدمت زیرساخت
                            </Label>
                            <select
                              value={newSupplierServiceType}
                              onChange={(e) => setNewSupplierServiceType(e.target.value)}
                              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs"
                            >
                              {categories.length > 0 ? (
                                categories.map((c: any) => (
                                  <option key={c.id} value={c.slug || c.id}>
                                    {c.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="SERVER">سرور ابری / اختصاصی</option>
                                  <option value="HOSTING">هاستینگ و میزبانی وب</option>
                                  <option value="DOMAIN">دامنه و DNS</option>
                                  <option value="API">وب‌سرویس و API</option>
                                  <option value="PACKAGE">بسته مصرفی / ترافیک</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ititle" className="text-xs font-semibold">
                    شرح خدمت یا آیتم فاکتور *
                  </Label>
                  <Input
                    id="ititle"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="مثال: اشتراک سه ماهه سرور ابری یا تمدید دامنه"
                    className="h-10 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iamount" className="text-xs font-semibold">
                      مبلغ کل (تومان) *
                    </Label>
                    <Input
                      id="iamount"
                      type="number"
                      value={amountToman}
                      onChange={(e) => setAmountToman(Number(e.target.value))}
                      className="h-10 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idays" className="text-xs font-semibold">
                      مهلت پرداخت (روز)
                    </Label>
                    <Input
                      id="idays"
                      type="number"
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-9 px-4"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvoiceMutation.isPending}
                    className="h-9 px-5"
                  >
                    {createInvoiceMutation.isPending ? "در حال صدور..." : "صدور و ثبت فاکتور"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

        {/* Edit Invoice Modal */}
        {isEditOpen && editingInvoice && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !updateInvoiceMutation.isPending) setIsEditOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 sm:p-7 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش فاکتور #{formatInvoiceNumber(editingInvoice.invoiceNumber || editingInvoice.id)}</h3>
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

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5 mt-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      شناسه فاکتور (یکتا و ثابت)
                    </Label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                      <Lock className="h-3 w-3 text-amber-500" />
                      غیرقابل تغییر
                    </span>
                  </div>
                  <Input
                    value={formatInvoiceNumber(editingInvoice.invoiceNumber || editingInvoice.id)}
                    readOnly
                    disabled
                    className="h-10 text-xs font-mono font-bold bg-muted/40 text-muted-foreground cursor-not-allowed border-dashed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etitle" className="text-xs font-semibold">
                    شرح خدمت یا عنوان ردیف فاکتور *
                  </Label>
                  <Input
                    id="etitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="eamount" className="text-xs font-semibold">
                        مبلغ کل (تومان) *
                      </Label>
                      {Number(editAmount) > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {Number(editAmount).toLocaleString("fa-IR")} تومان
                        </span>
                      )}
                    </div>
                    <Input
                      id="eamount"
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="h-10 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edays" className="text-xs font-semibold">
                      مهلت پرداخت از امروز (روز)
                    </Label>
                    <Input
                      id="edays"
                      type="number"
                      value={editDueDays}
                      onChange={(e) => setEditDueDays(Number(e.target.value))}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enotes" className="text-xs font-semibold">
                    یادداشت و توضیحات فاکتور
                  </Label>
                  <Input
                    id="enotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="توضیحات اختیاری درباره فاکتور"
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estatus" className="text-xs font-semibold">
                    وضعیت فاکتور
                  </Label>
                  <select
                    id="estatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring font-medium"
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
                    className="h-9 px-4"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateInvoiceMutation.isPending}
                    className="h-9 px-5"
                  >
                    {updateInvoiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات فاکتور"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

        {/* Content-Based Category Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-muted-foreground font-semibold ml-1 shrink-0">دسته‌بندی موضوعی:</span>
            {activeTabsList.map((cat: any) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (selectedStatus === "CANCELLED") {
                      setSelectedStatus("ALL");
                    }
                    setPage(1);
                  }}
                  className={`text-xs gap-2 rounded-xl h-9 px-3.5 cursor-pointer shrink-0 ${
                    selectedCategory === cat.id ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{cat.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cat.count.toLocaleString("fa-IR")}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Counterparty Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-muted-foreground font-medium ml-1 shrink-0">نوع طرف‌حساب:</span>
              <Button
                variant={counterpartyFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCounterpartyFilter("ALL");
                  setPage(1);
                }}
                className={`text-xs rounded-xl h-8 px-3 cursor-pointer shrink-0 ${
                  counterpartyFilter === "ALL" ? "bg-emerald-600 text-white shadow-xs" : ""
                }`}
              >
                همه فاکتورها
              </Button>
              <Button
                variant={counterpartyFilter === "CUSTOMER" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCounterpartyFilter("CUSTOMER");
                  setPage(1);
                }}
                className={`text-xs rounded-xl h-8 px-3 cursor-pointer gap-1.5 shrink-0 ${
                  counterpartyFilter === "CUSTOMER" ? "bg-emerald-600 text-white shadow-xs" : ""
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                فاکتورهای مشتریان (فروش)
              </Button>
              <Button
                variant={counterpartyFilter === "SUPPLIER" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCounterpartyFilter("SUPPLIER");
                  setPage(1);
                }}
                className={`text-xs rounded-xl h-8 px-3 cursor-pointer gap-1.5 shrink-0 ${
                  counterpartyFilter === "SUPPLIER" ? "bg-purple-600 text-white shadow-xs" : ""
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                فاکتورهای تامین‌کنندگان (خرید)
              </Button>
            </div>
          </div>

          {/* Status Sub-filter & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-muted-foreground font-medium ml-1 shrink-0">وضعیت پرداخت:</span>
              {[
                { id: "ALL", label: "همه وضعیت‌ها", count: nonCancelledInvoices.length },
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
                    if (tab.id === "CANCELLED") {
                      setSelectedCategory("ALL");
                    }
                    setPage(1);
                  }}
                  className={`text-xs rounded-xl h-8.5 px-3 gap-2 cursor-pointer shrink-0 ${
                    selectedStatus === tab.id ? "font-bold text-foreground bg-muted shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
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

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground font-medium">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="h-9 rounded-xl border border-input bg-card/60 px-3.5 text-xs font-medium text-foreground shadow-xs focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="category">بر اساس دسته‌بندی موضوعی</option>
                <option value="amount-desc">بیشترین مبلغ</option>
                <option value="amount-asc">کمترین مبلغ</option>
                <option value="due-asc">نزدیک‌ترین مهلت پرداخت</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table Card */}
        <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-4 px-5 whitespace-nowrap">شماره فاکتور</th>
                    <th className="py-4 px-5 whitespace-nowrap">طرف‌حساب</th>
                    <th className="py-4 px-5 whitespace-nowrap">دسته‌بندی</th>
                    <th className="py-4 px-5 whitespace-nowrap">شرح خدمات</th>
                    <th className="py-4 px-5 whitespace-nowrap">مبلغ نهایی (تومان)</th>
                    <th className="py-4 px-5 whitespace-nowrap">وضعیت</th>
                    <th className="py-4 px-5 whitespace-nowrap">مهلت پرداخت</th>
                    <th className="py-4 px-5 text-center whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedList.map((inv: any) => {
                    const catInfo = getInvoiceCategoryInfo(inv, categories, services);
                    const catBadge = getCategoryBadge(catInfo.slug, catInfo.name);
                    const CatIcon = catBadge.icon;
                    const isSupplier = Boolean(inv.supplierId) || inv.counterpartyType === "SUPPLIER";
                    return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-5 font-medium font-mono text-foreground whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenView(inv)}
                          className="font-bold text-primary hover:underline hover:text-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          {formatInvoiceNumber(inv.invoiceNumber || inv.id)}
                        </button>
                      </td>
                      <td className="py-4 px-5 font-medium whitespace-nowrap">
                        {isSupplier ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                              <Building2 className="h-3 w-3 shrink-0" />
                              تامین‌کننده
                            </span>
                            <span className="font-semibold text-foreground whitespace-nowrap">
                              {inv.supplier?.name || inv.supplierName || "تامین‌کننده زیرساخت"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                              <User className="h-3 w-3 shrink-0" />
                              مشتری
                            </span>
                            <span className="whitespace-nowrap">{inv.customer?.name || inv.customerId || "مشتری"}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap ${catBadge.className}`}>
                          <CatIcon className="h-3.5 w-3.5 shrink-0" />
                          {catInfo.name}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground max-w-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium truncate">
                            {inv.items?.[0]?.title || inv.notes || "صورت‌حساب خدمات"}
                          </span>
                          {(inv.items?.[0]?.serviceNameSnapshot || inv.items?.[0]?.service?.name) && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-purple-600 dark:text-purple-400">
                              <Server className="h-3 w-3 shrink-0" />
                              <span>سرویس: {inv.items[0].serviceNameSnapshot || inv.items[0].service?.name}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-semibold text-foreground whitespace-nowrap">
                        {(inv.totalToman || 0) === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">رایگان</span>
                        ) : (
                          `${(inv.totalToman || 0).toLocaleString("fa-IR")} تومان`
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {inv.status === "PAID" ? (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="success"
                            className="gap-1.5 text-[10px] font-medium whitespace-nowrap"
                          >
                            <CheckCircle className="h-3 w-3 shrink-0" />
                            پرداخت شده
                          </Chip>
                        ) : inv.status === "CANCELLED" ? (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="default"
                            className="gap-1.5 text-[10px] font-medium whitespace-nowrap"
                          >
                            <Ban className="h-3 w-3 shrink-0" />
                            لغو شده
                          </Chip>
                        ) : inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() ? (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="danger"
                            className="gap-1.5 text-[10px] font-bold whitespace-nowrap"
                          >
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            منقضی شده ({Math.max(1, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))).toLocaleString("fa-IR")} روز معوقه)
                          </Chip>
                        ) : (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="warning"
                            className="gap-1.5 text-[10px] font-medium whitespace-nowrap"
                          >
                            <Clock className="h-3 w-3 shrink-0" />
                            در انتظار پرداخت
                          </Chip>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] whitespace-nowrap">
                        {inv.dueDate ? (
                          <span className={inv.status === "UNPAID" && new Date(inv.dueDate).getTime() < Date.now() ? "text-rose-600 font-bold whitespace-nowrap inline-flex items-center" : "text-muted-foreground whitespace-nowrap inline-flex items-center"}>
                            {formatJalaliDate(inv.dueDate)}
                            {inv.status === "UNPAID" && new Date(inv.dueDate).getTime() < Date.now() && (
                              <span className="mr-1.5 text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 whitespace-nowrap">
                                {Math.max(1, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))).toLocaleString("fa-IR")} روز معوقه
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground whitespace-nowrap">---</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenView(inv)}
                            className="text-primary hover:bg-primary/10 h-7.5 px-2.5 text-xs font-medium gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 shrink-0" />
                            مشاهده
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(inv)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 h-7.5 px-2.5 text-xs font-medium cursor-pointer whitespace-nowrap"
                          >
                            ویرایش
                          </Button>
                          {inv.status === "UNPAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                              disabled={cancelInvoiceMutation.isPending}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7.5 px-2.5 text-xs cursor-pointer whitespace-nowrap"
                            >
                              لغو فاکتور
                            </Button>
                          )}
                          {inv.status === "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactivateInvoiceMutation.mutate(inv.id)}
                              disabled={reactivateInvoiceMutation.isPending}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 h-7.5 px-2.5 text-xs font-medium cursor-pointer whitespace-nowrap"
                            >
                              فعال‌سازی
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Count Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 px-6 bg-muted/20 border-t text-xs">
              <div className="text-muted-foreground">
                نمایش {paginatedList.length} از {sortedList.length} فاکتور (صفحه {page} از {totalPages})
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 text-xs px-3 rounded-xl"
                  >
                    قبلی
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 p-0 text-xs rounded-xl ${page === p ? "bg-emerald-600 text-white" : ""}`}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 text-xs px-3 rounded-xl"
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
          onReactivate={(invId) => reactivateInvoiceMutation.mutate(invId)}
        />
      </div>
    </AppShell>
  );
}

