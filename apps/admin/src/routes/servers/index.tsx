import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Chip } from "@heroui/react";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import { formatJalaliDate, getJalaliMonthPeriods, analyzeDateRange } from "@gecut-cloud/contracts";
import { JalaliDatePicker } from "@/components/common/jalali-datepicker";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { ModalPortal } from "@/components/common/modal-portal";
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
  Phone,
  Mail,
  Layers,
  Globe,
  Search,
  AlertCircle,
  AlertTriangle,
  Tag,
  Cpu,
  ArrowUpDown,
  Calendar,
  Wallet,
  CalendarDays,
  ExternalLink,
  Repeat,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/servers/")({
  component: AdminSuppliersPage,
});

const SUPPLIER_CONTENT_CATEGORIES = [
  { id: "ALL", label: "همه تامین‌کنندگان", icon: Building2 },
  { id: "FOREIGN_DC", label: "دیتاسنترهای خارجی و ابری", icon: Globe },
  { id: "DOMESTIC_DC", label: "دیتاسنترها و شبکه داخلی", icon: Server },
  { id: "DOMAIN", label: "رجیسترار و خدمات دامنه", icon: Tag },
  { id: "LICENSE", label: "لایسنس و نرم‌افزار", icon: Cpu },
  { id: "DEBT", label: "دارای بدهکاری فعال", icon: AlertCircle },
];

export const SERVICE_TYPE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DEDICATED_SERVER: {
    label: "سرور اختصاصی و ابری",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  SERVER: {
    label: "سرور اختصاصی و ابری",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  CLOUD_HOSTING: {
    label: "هاستینگ و فضای ابری",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  HOSTING: {
    label: "هاستینگ و فضای ابری",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  DOMAIN: {
    label: "ثبت و مدیریت دامنه",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  LICENSE: {
    label: "لایسنس و نرم‌افزار",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  API: {
    label: "وب‌سرویس و شبکه",
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
};

export function getSupplierServiceBadge(type: string, dynamicCats: any[] = []) {
  const norm = (type || "").toLowerCase().trim();
  const matched = dynamicCats.find(
    (c) =>
      (c.slug || "").toLowerCase() === norm ||
      (c.id || "").toLowerCase() === norm ||
      (c.name || "").toLowerCase() === norm,
  );
  if (matched) {
    return {
      label: matched.name,
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/20",
    };
  }
  if (SERVICE_TYPE_BADGES[type?.toUpperCase()]) {
    return SERVICE_TYPE_BADGES[type.toUpperCase()];
  }
  if (norm.includes("server") || norm.includes("سرور") || norm.includes("vps")) {
    return {
      label: "سرور اختصاصی و ابری",
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/20",
    };
  }
  if (norm.includes("host") || norm.includes("هاست")) {
    return {
      label: "هاستینگ و فضای ابری",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
    };
  }
  if (norm.includes("domain") || norm.includes("دامنه")) {
    return {
      label: "ثبت و مدیریت دامنه",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
    };
  }
  if (norm.includes("license") || norm.includes("لایسنس")) {
    return {
      label: "لایسنس و نرم‌افزار",
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
    };
  }
  if (norm.includes("api") || norm.includes("ai") || norm.includes("هوش")) {
    return {
      label: "وب‌سرویس و API",
      bg: "bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/20",
    };
  }
  return {
    label: type || "سایر خدمات",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
  };
}

function getCategoryIcon(slug: string) {
  const s = slug?.toLowerCase() || "";
  if (s === "all") return Building2;
  if (s === "debt") return AlertCircle;
  if (s.includes("domain") || s.includes("دامنه")) return Tag;
  if (s.includes("server") || s.includes("سرور") || s.includes("vps")) return Server;
  if (s.includes("host") || s.includes("هاست")) return Globe;
  if (s.includes("license") || s.includes("لایسنس")) return Cpu;
  if (s.includes("api") || s.includes("ai") || s.includes("هوش") || s.includes("شبکه")) return Cpu;
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج")) return Layers;
  return Tag;
}

function getSupplierCategories(sup: any, dynamicCategories: any[] = []): string[] {
  const categories = new Set<string>(["ALL"]);

  if (Number(sup.totalPayableToman) > 0) {
    categories.add("DEBT");
  }

  const supplierServices = sup.services || [];
  const supText = `${sup.name || ""} ${sup.notes || ""} ${sup.contactPerson || ""}`.toLowerCase();

  for (const cat of dynamicCategories) {
    const slug = (cat.slug || "").toLowerCase();
    const name = (cat.name || "").toLowerCase();
    const id = (cat.id || "").toLowerCase();

    // 1. Check if any service of this supplier matches the category
    const hasMatchingService = supplierServices.some((s: any) => {
      const sType = (s.type || s.serviceType || "").toLowerCase();
      const sName = (s.name || "").toLowerCase();
      return (
        (slug && sType === slug) ||
        (id && sType === id) ||
        (name && sType === name) ||
        (slug && sType.includes(slug)) ||
        (name && (sName.includes(name) || sType.includes(name)))
      );
    });

    // 2. Check keyword heuristics in supplier description/name
    const matchesKeywords =
      (slug && supText.includes(slug)) ||
      (name && supText.includes(name)) ||
      (slug === "domain" && (supText.includes("دامنه") || supText.includes("domain") || supText.includes("nic") || supText.includes("ایرنیک") || supText.includes("رجیسترار"))) ||
      (slug === "server" && (supText.includes("سرور") || supText.includes("server") || supText.includes("hetzner") || supText.includes("هتزنر") || supText.includes("ovh") || supText.includes("دیتاسنتر"))) ||
      (slug === "hosting" && (supText.includes("هاست") || supText.includes("میزبانی") || supText.includes("host") || supText.includes("cpanel"))) ||
      (slug === "license" && (supText.includes("لایسنس") || supText.includes("license") || supText.includes("نرم‌افزار"))) ||
      (slug === "api" && (supText.includes("api") || supText.includes("وب‌سرویس") || supText.includes("sms") || supText.includes("پیامک")));

    if (hasMatchingService || matchesKeywords) {
      if (cat.slug) categories.add(cat.slug);
      if (cat.id) categories.add(cat.id);
      categories.add(cat.slug || cat.id);
    }
  }

  // 3. Add raw service types so any existing custom type matches
  for (const s of supplierServices) {
    const sType = s.type || s.serviceType;
    if (sType) {
      categories.add(sType);
      categories.add(String(sType).toLowerCase());
      categories.add(String(sType).toUpperCase());
    }
  }

  return Array.from(categories);
}

function formatPriceInput(val: number | string | undefined | null): string {
  if (val === "" || val === null || val === undefined || val === 0 || val === "0") return "";
  const cleanDigits = String(val).replace(/[^0-9]/g, "");
  const num = Number(cleanDigits);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("en-US");
}

function parsePriceInput(valStr: string): string {
  if (!valStr) return "";
  const standardDigits = valStr
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "");
  return standardDigits;
}

function safeDate(val?: string | Date | null, fallback = new Date()): Date {
  if (!val) return fallback;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const parts = val.split("-").map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

function safeIso(val?: string | Date | null, fallback = new Date()): string {
  return safeDate(val, fallback).toISOString();
}

function calcAddDays(baseIso: string | Date | null, days: number): string {
  const d = safeDate(baseIso);
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() + Number(days || 0), 12, 0, 0);
  return result.toISOString();
}

function calcDaysBetween(startIso: string | Date | null, endIso: string | Date | null): number {
  const s = safeDate(startIso);
  const e = safeDate(endIso);
  const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 12, 0, 0).getTime();
  const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 12, 0, 0).getTime();
  const diffDays = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

function parseBillingCycleDays(cycle?: string | number | null): number | null {
  if (!cycle) return null;
  const num = Number(cycle);
  if (!isNaN(num) && num > 0) return num;
  const s = String(cycle).toUpperCase();
  if (s === "MONTHLY") return 30;
  if (s === "QUARTERLY") return 90;
  if (s === "SEMI_ANNUAL") return 180;
  if (s === "ANNUAL") return 365;
  return null;
}

function getServiceRemainingDetails(service: any) {
  const trackingType = (service.trackingType || "HYBRID").toUpperCase();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const configuredCycleDays = parseBillingCycleDays(service.billingCycle || service.billingCycleDays);

  let end: Date;
  if (service.renewalDate) {
    end = new Date(service.renewalDate);
    if (isNaN(end.getTime())) end = new Date(Date.now() + 30 * MS_PER_DAY);
  } else {
    end = new Date(Date.now() + (configuredCycleDays || 30) * MS_PER_DAY);
  }

  let start: Date;
  const rawStart = service.purchaseDate || service.startDate || service.createdAt;
  if (rawStart) {
    start = new Date(rawStart);
    if (isNaN(start.getTime())) {
      start = new Date(end.getTime() - (configuredCycleDays || 30) * MS_PER_DAY);
    }
  } else {
    start = new Date(end.getTime() - (configuredCycleDays || 30) * MS_PER_DAY);
  }

  if (trackingType !== "QUANTITY" && start.getTime() > end.getTime()) {
    start = new Date(end.getTime() - (configuredCycleDays || 30) * MS_PER_DAY);
  }

  const analysis = analyzeDateRange({
    startDate: start,
    endDate: end,
    configuredCycleDays,
  });

  const totalQty = service.quantity || 1;
  const usedQty = service.usedQuantity || 0;
  const remainingQty = Math.max(0, totalQty - usedQty);

  const isQuantityDepleted =
    (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
    (remainingQty <= 0 || usedQty >= totalQty);

  const isQuantityNearDepletion =
    (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
    !isQuantityDepleted &&
    (remainingQty <= Math.max(1, Math.ceil(totalQty * 0.05)) || (totalQty > 0 && (remainingQty / totalQty) <= 0.05));

  const isTimeExpired = trackingType !== "QUANTITY" && analysis.isExpired;
  const isTimeNearExpiry =
    trackingType !== "QUANTITY" && !isTimeExpired && analysis.daysLeft > 0 && analysis.daysLeft <= 3;

  const isExpired = isTimeExpired || isQuantityDepleted;

  return {
    trackingType,
    daysTotal: analysis.totalDays,
    daysPassed: analysis.daysPassed,
    daysLeft: analysis.daysLeft,
    remainingPercent: analysis.remainingPercent,
    configuredCycleDays,
    isAlarmExceeded: analysis.isAlarmExceeded,
    isExpired,
    isTimeExpired,
    isTimeNearExpiry,
    isQuantityDepleted,
    isQuantityNearDepletion,
    overdueDays: analysis.overdueDays,
    urgency: analysis.urgency,
    startDate: start,
    renewalDate: end,
    totalQty,
    usedQty,
    remainingQty,
  };
}



function AdminSuppliersPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "payable-desc" | "services-desc">("newest");
  const [servicesSortBy, setServicesSortBy] = useState<"due-asc" | "newest-purchase" | "price-desc" | "price-asc" | "name">("newest-purchase");
  const [page, setPage] = useState(1);
  const [selectedPeriodMonth, setSelectedPeriodMonth] = useState<number | "ALL">(0);
  const PAGE_LIMIT = 12;

  // Modals state
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isServicesPanelOpen, setIsServicesPanelOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);

  // Confirm Modals
  const [confirmDeleteSupplierModal, setConfirmDeleteSupplierModal] = useState<any | null>(null);
  const [confirmDeleteServiceModal, setConfirmDeleteServiceModal] = useState<any | null>(null);

  // Form State: Supplier
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");

  // Form State: Add Purchased Service
  const [targetSupplierId, setTargetSupplierId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceType, setServiceType] = useState("DEDICATED_SERVER");
  const [serviceTrackingType, setServiceTrackingType] = useState<"HYBRID" | "TIME" | "QUANTITY">("HYBRID");
  const [servicePriceToman, setServicePriceToman] = useState("3400000");
  const [serviceDurationDays, setServiceDurationDays] = useState<number>(30);
  const [serviceQuantity, setServiceQuantity] = useState<number>(1000);
  const [serviceAutoRenew, setServiceAutoRenew] = useState<boolean>(true);
  const [servicePurchaseDate, setServicePurchaseDate] = useState<string>(() => new Date().toISOString());
  const [serviceRenewalDate, setServiceRenewalDate] = useState<string>(() =>
    calcAddDays(new Date().toISOString(), 30),
  );

  // Two-way reactive date handlers for Add Service
  const handleServiceDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setServiceDurationDays(cleanDays);
    setServiceRenewalDate(calcAddDays(servicePurchaseDate, cleanDays));
  };

  const handleServicePurchaseDateChange = (val: string) => {
    const cleanVal = safeIso(val);
    setServicePurchaseDate(cleanVal);
    if (serviceRenewalDate) {
      const calculatedDays = calcDaysBetween(cleanVal, serviceRenewalDate);
      setServiceDurationDays(calculatedDays);
    }
  };

  const handleServiceRenewalDateChange = (val: string) => {
    const cleanVal = safeIso(val, new Date(calcAddDays(servicePurchaseDate, serviceDurationDays)));
    setServiceRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(servicePurchaseDate, cleanVal);
    setServiceDurationDays(calculatedDays);
  };

  // Derived span and alarm for Add Service
  const serviceRangeAnalysis = analyzeDateRange({
    startDate: servicePurchaseDate,
    endDate: serviceRenewalDate,
    configuredCycleDays: serviceTrackingType !== "QUANTITY" ? serviceDurationDays : undefined,
  });
  const serviceSpanDays = serviceRangeAnalysis.totalDays;
  const isServiceAlarmExceeded =
    serviceTrackingType !== "QUANTITY" && serviceRangeAnalysis.isAlarmExceeded;

  // Form State: Edit Purchased Service
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceType, setEditServiceType] = useState("DEDICATED_SERVER");
  const [editServiceTrackingType, setEditServiceTrackingType] = useState<"HYBRID" | "TIME" | "QUANTITY">("HYBRID");
  const [editServicePriceToman, setEditServicePriceToman] = useState("0");
  const [editServiceDurationDays, setEditServiceDurationDays] = useState<number>(30);
  const [editServiceQuantity, setEditServiceQuantity] = useState<number>(1000);
  const [editServiceUsedQuantity, setEditServiceUsedQuantity] = useState<number>(0);
  const [editServiceAutoRenew, setEditServiceAutoRenew] = useState<boolean>(true);
  const [editServicePurchaseDate, setEditServicePurchaseDate] = useState<string>(() => new Date().toISOString());
  const [editServiceRenewalDate, setEditServiceRenewalDate] = useState<string>(() =>
    calcAddDays(new Date().toISOString(), 30),
  );
  const [editServiceStatus, setEditServiceStatus] = useState("ACTIVE");
  const [editServiceNotes, setEditServiceNotes] = useState("");

  // Two-way reactive date handlers for Edit Service
  const handleEditServiceDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setEditServiceDurationDays(cleanDays);
    setEditServiceRenewalDate(calcAddDays(editServicePurchaseDate, cleanDays));
  };

  const handleEditServicePurchaseDateChange = (val: string) => {
    const cleanVal = safeIso(val);
    setEditServicePurchaseDate(cleanVal);
    if (editServiceRenewalDate) {
      const calculatedDays = calcDaysBetween(cleanVal, editServiceRenewalDate);
      setEditServiceDurationDays(calculatedDays);
    }
  };

  const handleEditServiceRenewalDateChange = (val: string) => {
    const cleanVal = safeIso(val, new Date(calcAddDays(editServicePurchaseDate, editServiceDurationDays)));
    setEditServiceRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(editServicePurchaseDate, cleanVal);
    setEditServiceDurationDays(calculatedDays);
  };

  // Derived span and alarm for Edit Service
  const editServiceRangeAnalysis = analyzeDateRange({
    startDate: editServicePurchaseDate,
    endDate: editServiceRenewalDate,
    configuredCycleDays: editServiceTrackingType !== "QUANTITY" ? editServiceDurationDays : undefined,
  });
  const editServiceSpanDays = editServiceRangeAnalysis.totalDays;
  const isEditServiceAlarmExceeded =
    editServiceTrackingType !== "QUANTITY" && editServiceRangeAnalysis.isAlarmExceeded;


  // Fetch Suppliers List
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/suppliers"),
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/categories"),
  });

  const dynamicCategories = categoriesData?.items || [];

  useEffect(() => {
    if (dynamicCategories.length > 0) {
      if (
        !serviceType ||
        serviceType === "DEDICATED_SERVER" ||
        !dynamicCategories.some((c: any) => c.slug === serviceType || c.id === serviceType)
      ) {
        setServiceType(dynamicCategories[0].slug || dynamicCategories[0].id);
      }
    }
  }, [dynamicCategories, serviceType]);

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
      toast.success("سرویس خریداری‌شده با موفقیت به خدمات تامین‌کننده اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      setIsAddServiceOpen(false);
      setServiceName("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت سرویس");
    },
  });

  // Update Purchased Service Mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, body }: { serviceId: string; body: any }) =>
      apiClient(`/suppliers/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("سرویس تامین‌کننده با موفقیت به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
      setIsEditServiceOpen(false);
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش سرویس تامین‌کننده");
    },
  });

  // Renew Supplier Service Mutation
  const renewSupplierServiceMutation = useMutation({
    mutationFn: (serviceId: string) =>
      apiClient(`/suppliers/services/${serviceId}/renew`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("سرویس تامین‌کننده با موفقیت تمدید شد و فاکتور دوره جدید صادر گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در تمدید سرویس تامین‌کننده");
    },
  });

  // Delete Purchased Service Mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) =>
      apiClient(`/suppliers/services/${serviceId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("سرویس تامین‌کننده با موفقیت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در حذف سرویس");
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
    const pDate = safeIso(servicePurchaseDate);
    const rDate =
      serviceTrackingType === "QUANTITY"
        ? calcAddDays(pDate, 365)
        : safeIso(serviceRenewalDate, new Date(calcAddDays(pDate, serviceDurationDays)));

    addServiceMutation.mutate({
      supplierId: targetSupplierId,
      name: serviceName,
      type: serviceType,
      trackingType: serviceTrackingType,
      priceToman: Number(servicePriceToman) || 0,
      monthlyExpenseToman: Number(servicePriceToman) || 0,
      quantity:
        serviceTrackingType === "QUANTITY" || serviceTrackingType === "HYBRID"
          ? Math.max(1, Number(serviceQuantity) || 1)
          : 1,
      durationDays: serviceDurationDays,
      billingCycleDays: serviceDurationDays,
      autoRenew: serviceAutoRenew,
      purchaseDate: pDate,
      renewalDate: rDate,
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
    setServiceName("");
    setServicePriceToman("3400000");
    setServiceTrackingType("HYBRID");
    setServiceDurationDays(30);
    setServiceQuantity(1000);
    setServiceAutoRenew(true);
    const nowIso = new Date().toISOString();
    setServicePurchaseDate(nowIso);
    setServiceRenewalDate(calcAddDays(nowIso, 30));
    setIsAddServiceOpen(true);
  };

  const openEditServiceModal = (svc: any) => {
    setEditingService(svc);
    setEditServiceName(svc.name || "");
    setEditServiceType(svc.type || "DEDICATED_SERVER");
    setEditServicePriceToman(String(svc.priceToman ?? svc.monthlyExpenseToman ?? 0));
    const pDate = svc.purchaseDate ? new Date(svc.purchaseDate).toISOString() : new Date().toISOString();
    const rDate = svc.renewalDate ? new Date(svc.renewalDate).toISOString() : calcAddDays(pDate, 30);
    setEditServicePurchaseDate(pDate);
    setEditServiceRenewalDate(rDate);
    setEditServiceTrackingType((svc.trackingType as any) || "HYBRID");
    const cycleDays = svc.billingCycleDays || calcDaysBetween(pDate, rDate) || 30;
    setEditServiceDurationDays(cycleDays);
    setEditServiceQuantity(svc.quantity ?? 1000);
    setEditServiceUsedQuantity(svc.usedQuantity ?? 0);
    setEditServiceAutoRenew(svc.autoRenew !== undefined ? Boolean(svc.autoRenew) : true);
    setEditServiceStatus(svc.status || "ACTIVE");
    setEditServiceNotes(svc.notes || "");
    setIsEditServiceOpen(true);
  };

  const handleEditServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const pDate = safeIso(editServicePurchaseDate);
    const rDate =
      editServiceTrackingType === "QUANTITY"
        ? calcAddDays(pDate, 365)
        : safeIso(editServiceRenewalDate, new Date(calcAddDays(pDate, editServiceDurationDays)));

    updateServiceMutation.mutate({
      serviceId: editingService.id,
      body: {
        name: editServiceName,
        type: editServiceType,
        trackingType: editServiceTrackingType,
        priceToman: Number(editServicePriceToman) || 0,
        monthlyExpenseToman: Number(editServicePriceToman) || 0,
        quantity:
          editServiceTrackingType === "QUANTITY" || editServiceTrackingType === "HYBRID"
            ? Math.max(1, Number(editServiceQuantity) || 1)
            : 1,
        usedQuantity: Math.max(0, Number(editServiceUsedQuantity) || 0),
        durationDays: editServiceDurationDays,
        billingCycleDays: editServiceDurationDays,
        autoRenew: editServiceAutoRenew,
        purchaseDate: pDate,
        renewalDate: rDate,
        status: editServiceStatus,
        notes: editServiceNotes,
      },
    });
  };

  const openServicesPanel = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsServicesPanelOpen(true);
  };

  const suppliersList = data?.items || [];

  useEffect(() => {
    if (selectedSupplier && suppliersList.length > 0) {
      const refreshed = suppliersList.find((s: any) => s.id === selectedSupplier.id);
      if (refreshed) {
        setSelectedSupplier(refreshed);
      }
    }
  }, [suppliersList]);

  // Flatten all services for nearest payment & monthly cost calculations
  const allSupplierServices = useMemo(() => {
    const list: any[] = [];
    for (const sup of suppliersList) {
      if (sup.services && Array.isArray(sup.services)) {
        for (const svc of sup.services) {
          list.push({ ...svc, supplierName: sup.name, supplierId: sup.id });
        }
      }
    }
    return list;
  }, [suppliersList]);

  // Expired / overdue services across all suppliers
  const expiredSupplierServices = useMemo(() => {
    const now = Date.now();
    return allSupplierServices.filter((s) => {
      if (!s.renewalDate) return false;
      return new Date(s.renewalDate).getTime() < now;
    });
  }, [allSupplierServices]);

  // Nearest upcoming payment across all suppliers (prioritizing overdue if any)
  const nearestPayment = useMemo(() => {
    const now = Date.now();
    const sorted = [...allSupplierServices]
      .filter((s) => s.renewalDate)
      .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

    const overdue = sorted.filter((s) => new Date(s.renewalDate).getTime() < now);
    const upcoming = sorted.find((s) => new Date(s.renewalDate).getTime() >= now);

    const target = overdue.length > 0 ? overdue[0] : (upcoming || sorted[0]);
    if (!target) return null;

    const diffDays = Math.ceil((new Date(target.renewalDate).getTime() - now) / (1000 * 60 * 60 * 24));
    return {
      service: target,
      diffDays,
      isExpired: new Date(target.renewalDate).getTime() < now,
      amount: Number(target.priceToman ?? target.monthlyExpenseToman ?? 0),
    };
  }, [allSupplierServices]);

  // Generate dynamic Jalali months options
  const jalaliPeriods = useMemo(() => getJalaliMonthPeriods(12), []);

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: "ALL", label: "همه دوره‌ها (کل تعهدات)" },
    ];
    for (const p of jalaliPeriods) {
      options.push({
        value: String(p.offset),
        label: p.label,
      });
    }
    return options;
  }, [jalaliPeriods]);

  // Calculate expenses for the selected period
  const periodExpensesData = useMemo(() => {
    if (selectedPeriodMonth === "ALL") {
      return {
        totalToman: allSupplierServices.reduce((sum, s) => sum + (Number(s.priceToman ?? s.monthlyExpenseToman) || 0), 0),
        count: allSupplierServices.length,
        label: "کل تعهدات فعال",
      };
    }

    const offset = Number(selectedPeriodMonth);
    const targetPeriod = jalaliPeriods[offset] || jalaliPeriods[0];
    const monthStart = targetPeriod.startDate.getTime();
    const monthEnd = targetPeriod.endDate.getTime();

    const matchingServices = allSupplierServices.filter((s: any) => {
      const pDate = s.purchaseDate || s.createdAt ? new Date(s.purchaseDate || s.createdAt).getTime() : 0;
      const rDate = s.renewalDate ? new Date(s.renewalDate).getTime() : Infinity;
      return pDate <= monthEnd && rDate >= monthStart;
    });

    const total = matchingServices.reduce((sum, s) => sum + (Number(s.priceToman ?? s.monthlyExpenseToman) || 0), 0);

    return {
      totalToman: total,
      count: matchingServices.length,
      label: targetPeriod.shortLabel,
    };
  }, [allSupplierServices, selectedPeriodMonth, jalaliPeriods]);

  // Dynamic category tabs for suppliers
  const supplierCategoryTabs = useMemo(() => {
    const tabs = [
      { id: "ALL", label: "همه تامین‌کنندگان", icon: Building2 },
    ];

    if (dynamicCategories.length > 0) {
      dynamicCategories
        .filter((c: any) => c.isActive !== false)
        .forEach((c: any) => {
          tabs.push({
            id: c.slug || c.id,
            label: c.name,
            icon: getCategoryIcon(c.slug || c.name),
          });
        });
    } else {
      tabs.push(
        { id: "domain", label: "ثبت و مدیریت دامنه", icon: Tag },
        { id: "server", label: "سرور ابری و اختصاصی", icon: Server },
        { id: "hosting", label: "هاست و میزبانی", icon: Globe },
        { id: "license", label: "لایسنس و نرم‌افزار", icon: Cpu },
        { id: "api", label: "وب‌سرویس و API", icon: Cpu },
      );
    }

    if (expiredSupplierServices.length > 0) {
      tabs.push({ id: "EXPIRED", label: "دارای سرور منقضی شده", icon: AlertCircle });
    }
    tabs.push({ id: "DEBT", label: "دارای بدهکاری فعال", icon: AlertCircle });

    return tabs;
  }, [dynamicCategories, expiredSupplierServices.length]);

  const getSupplierCategoryCount = (catId: string) => {
    if (catId === "ALL") return suppliersList.length;
    if (catId === "DEBT") return suppliersList.filter((s: any) => Number(s.totalPayableToman) > 0).length;
    if (catId === "EXPIRED") {
      const now = Date.now();
      return suppliersList.filter((s: any) =>
        (s.services || []).some((svc: any) => svc.renewalDate && new Date(svc.renewalDate).getTime() < now)
      ).length;
    }
    return suppliersList.filter((s: any) => {
      const cats = getSupplierCategories(s, dynamicCategories);
      return (
        cats.includes(catId) ||
        cats.includes(catId.toLowerCase()) ||
        cats.includes(catId.toUpperCase())
      );
    }).length;
  };

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((s: any) => {
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "DEBT") {
          if (!(Number(s.totalPayableToman) > 0)) return false;
        } else if (selectedCategory === "EXPIRED") {
          const now = Date.now();
          const hasExpired = (s.services || []).some(
            (svc: any) => svc.renewalDate && new Date(svc.renewalDate).getTime() < now
          );
          if (!hasExpired) return false;
        } else {
          const cats = getSupplierCategories(s, dynamicCategories);
          const matches =
            cats.includes(selectedCategory) ||
            cats.includes(selectedCategory.toLowerCase()) ||
            cats.includes(selectedCategory.toUpperCase());
          if (!matches) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.name || "").toLowerCase().includes(q);
        const matchContact = (s.contactPerson || "").toLowerCase().includes(q);
        const matchPhone = (s.phone || "").toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone) return false;
      }
      return true;
    });
  }, [suppliersList, selectedCategory, dynamicCategories, searchQuery]);

  // Sort suppliers
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "", "fa");
      }
      if (sortBy === "payable-desc") {
        return (Number(b.totalPayableToman) || 0) - (Number(a.totalPayableToman) || 0);
      }
      if (sortBy === "services-desc") {
        return (b.services?.length || 0) - (a.services?.length || 0);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [filteredSuppliers, sortBy]);

  const totalPages = Math.ceil(sortedSuppliers.length / PAGE_LIMIT) || 1;
  const paginatedSuppliers = sortedSuppliers.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  // Helper to sort a supplier's services
  const sortSupplierServices = (services: any[] = []) => {
    return [...services].sort((a, b) => {
      if (servicesSortBy === "due-asc") {
        const dateA = a.renewalDate ? new Date(a.renewalDate).getTime() : 0;
        const dateB = b.renewalDate ? new Date(b.renewalDate).getTime() : 0;
        return dateA - dateB;
      }
      if (servicesSortBy === "newest-purchase") {
        const dateA = a.purchaseDate || a.createdAt ? new Date(a.purchaseDate || a.createdAt).getTime() : 0;
        const dateB = b.purchaseDate || b.createdAt ? new Date(b.purchaseDate || b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (servicesSortBy === "price-desc") {
        return (Number(b.priceToman ?? b.monthlyExpenseToman) || 0) - (Number(a.priceToman ?? a.monthlyExpenseToman) || 0);
      }
      if (servicesSortBy === "price-asc") {
        return (Number(a.priceToman ?? a.monthlyExpenseToman) || 0) - (Number(b.priceToman ?? b.monthlyExpenseToman) || 0);
      }
      return (a.name || "").localeCompare(b.name || "", "fa");
    });
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6 animate-entrance min-w-0">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/30 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                تامین‌کنندگان و زیرساخت
              </h1>
              <Chip size="sm" variant="soft" color="default" className="text-[11px] font-semibold shrink-0 whitespace-nowrap">
                مدیریت مخارج سرور و هاست
              </Chip>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              مدیریت دیتاسنترها، ماشین‌های ابری، خدمات دامنه و گزارش هزینه‌های زیرساخت
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => {
                resetSupplierForm();
                setIsCreateSupplierOpen(true);
              }}
              className="h-9 px-3.5 rounded-xl gap-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>تامین‌کننده جدید</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span>بروزرسانی</span>
            </Button>
            <Link to="/categories">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-border/60 hover:bg-muted/40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Layers className="h-4 w-4 text-purple-500 shrink-0" />
                <span>دسته‌بندی‌ها</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Overdue/Expired Servers High-Priority Alert Banner */}
        {expiredSupplierServices.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-950 dark:text-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 min-w-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <span>هشدار فوری: تاریخ سررسید {expiredSupplierServices.length.toLocaleString("fa-IR")} سرور به پایان رسیده است!</span>
                </h3>
                <p className="text-xs text-rose-600/90 dark:text-rose-400/90">
                  مهلت تمدید این سرورها منقضی شده است. جهت جلوگیری از قطع خدمات، سریعاً اقدام به بررسی و تمدید نمایید.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCategory("EXPIRED")}
                className="h-8.5 text-xs font-bold px-3.5 rounded-xl border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                مشاهده سرورهای منقضی شده ({expiredSupplierServices.length.toLocaleString("fa-IR")})
              </Button>
            </div>
          </div>
        )}

        {/* Monthly Expense & Nearest Due Highlight Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Monthly Commitment Summary with Month Selector */}
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between gap-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium shrink-0 whitespace-nowrap">مجموع هزینه‌های دوره</span>
              <select
                value={String(selectedPeriodMonth)}
                onChange={(e) => setSelectedPeriodMonth(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="h-8 text-xs rounded-xl border border-input bg-card px-2.5 py-0 text-foreground font-medium shadow-xs focus:ring-1 focus:ring-purple-500 cursor-pointer max-w-[160px] truncate shrink-0"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-between min-w-0 gap-2">
              <div className="space-y-1 min-w-0">
                <div className="text-xl font-black text-foreground font-mono truncate">
                  {periodExpensesData.totalToman.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  بر اساس {periodExpensesData.count.toLocaleString("fa-IR")} سرویس در {periodExpensesData.label}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Nearest Upcoming Payment Highlight */}
          <div className={`md:col-span-2 rounded-2xl border p-5 sm:p-6 shadow-xs backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0 overflow-hidden ${
            nearestPayment && nearestPayment.diffDays <= 0
              ? "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100"
              : nearestPayment && nearestPayment.diffDays <= 7
              ? "bg-amber-500/5 border-amber-500/30 text-amber-950 dark:text-amber-100"
              : "bg-card/60 border-border/50 text-foreground"
          }`}>
            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
              <div className={`p-3 rounded-2xl shrink-0 ${
                nearestPayment && nearestPayment.diffDays <= 0
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  : "bg-amber-500/10 text-amber-500"
              }`}>
                {nearestPayment && nearestPayment.diffDays <= 0 ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold whitespace-nowrap">
                    {nearestPayment && nearestPayment.diffDays <= 0 ? "سررسید منقضی شده سرور:" : "نزدیک‌ترین موعد پرداخت آتی:"}
                  </span>
                  {nearestPayment && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      nearestPayment.diffDays <= 0
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-mono font-bold"
                        : nearestPayment.diffDays <= 3
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono"
                    }`}>
                      {nearestPayment.diffDays <= 0
                        ? `سررسید منقضی شده (${Math.max(1, Math.abs(nearestPayment.diffDays)).toLocaleString("fa-IR")} روز گذشته)`
                        : `${nearestPayment.diffDays.toLocaleString("fa-IR")} روز باقی‌مانده`}
                    </span>
                  )}
                </div>
                {nearestPayment ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    سرویس <span className="font-bold text-foreground">{nearestPayment.service.name}</span> ({nearestPayment.service.supplierName}) - تاریخ سررسید: {formatJalaliDate(nearestPayment.service.renewalDate)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">هیچ سررسیدی ثبت نشده است.</p>
                )}
              </div>
            </div>

            {nearestPayment && (
              <div className="text-left font-mono font-bold text-sm shrink-0 bg-background/60 px-3 py-1.5 rounded-xl border border-border/50">
                {nearestPayment.amount.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
              </div>
            )}
          </div>
        </div>

        {/* Content-Based Category Tabs (Dynamic) */}
        <div className="flex flex-col gap-3.5">
          <div className="w-full overflow-x-auto scrollbar-none pb-1">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs text-muted-foreground font-semibold ml-1 shrink-0">دسته‌بندی موضوعی:</span>
              {supplierCategoryTabs.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const count = getSupplierCategoryCount(cat.id);
                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setPage(1);
                    }}
                    className={`h-8.5 px-3 rounded-xl text-xs gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? "bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count.toLocaleString("fa-IR")}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search, Sort and Service Sort Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card/30">
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در نام، مسئول یا تلفن تامین‌کننده..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">مرتب‌سازی تامین‌کنندگان:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border/60 bg-background text-xs cursor-pointer"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="name">نام (الفبایی)</option>
                  <option value="payable-desc">بیشترین بدهکاری</option>
                  <option value="services-desc">بیشترین تعداد سرویس</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">سورت سرویس‌ها:</span>
                <select
                  value={servicesSortBy}
                  onChange={(e: any) => setServicesSortBy(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border/60 bg-background text-xs cursor-pointer"
                >
                  <option value="due-asc">نزدیک‌ترین سررسید</option>
                  <option value="newest-purchase">جدیدترین تاریخ خرید</option>
                  <option value="price-desc">بیشترین هزینه</option>
                  <option value="price-asc">کمترین هزینه</option>
                  <option value="name">نام خدمت</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl border border-border/40 bg-card/20 animate-pulse" />
            ))}
          </div>
        ) : paginatedSuppliers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/60 bg-card/10">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground">تامین‌کننده‌ای در این بخش یافت نشد</p>
            <p className="text-xs text-muted-foreground mt-1">با زدن دکمه «تامین‌کننده جدید» اولین دیتاسنتر یا رجیسترار را اضافه کنید.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {paginatedSuppliers.map((supplier: any) => {
              const sortedServices = sortSupplierServices(supplier.services || []);
              const supplierExpiredCount = (supplier.services || []).filter(
                (s: any) => s.renewalDate && new Date(s.renewalDate).getTime() < Date.now()
              ).length;
              return (
                <div
                  key={supplier.id}
                  className={`rounded-2xl border p-5 shadow-xs backdrop-blur-xs flex flex-col gap-4 transition-all ${
                    supplierExpiredCount > 0
                      ? "border-rose-500/40 bg-card/60 shadow-rose-500/5 hover:border-rose-500/60"
                      : "border-border/50 bg-card/40 hover:border-purple-500/30"
                  }`}
                >
                  {/* Supplier Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{supplier.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              supplier.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {supplier.status === "ACTIVE" ? "همکاری فعال" : "غیرفعال"}
                          </span>
                          {supplierExpiredCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 font-mono">
                              <AlertCircle className="h-3 w-3" />
                              {supplierExpiredCount.toLocaleString("fa-IR")} سرور منقضی شده
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          {supplier.contactPerson && (
                            <span>مسئول: {supplier.contactPerson}</span>
                          )}
                          {supplier.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-1 font-mono">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openServicesPanel(supplier)}
                        className="h-8 px-2.5 rounded-xl text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                        title="مشاهده و مدیریت کامل خدمات این تامین‌کننده"
                      >
                        <ExternalLink className="h-3 w-3" />
                        پنل خدمات ({supplier.services?.length || 0})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddServiceForSupplier(supplier.id)}
                        className="h-8 px-2.5 rounded-xl text-xs gap-1 border-border/60 hover:bg-muted/40"
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
                          setConfirmDeleteSupplierModal(supplier);
                        }}
                        className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Purchased Services List for this Supplier */}
                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground/80 mb-3.5">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span>سرویس‌های خریداری‌شده ({sortedServices.length}):</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2.5 py-1 rounded-lg">
                        مجموع هزینه دوره: <strong className="text-foreground">{Number(supplier.totalPayableToman || 0).toLocaleString("fa-IR")}</strong> تومان
                      </span>
                    </div>

                    {sortedServices.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-muted/10 border border-dashed border-border/50 text-xs text-muted-foreground text-center">
                        هنوز سرویسی از این تامین‌کننده ثبت نشده است. با کلیک روی دکمه «سرویس جدید» هاست، سرور یا دامنه خریداری شده را اضافه کنید.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedServices.map((svc: any) => {
                          const badge = getSupplierServiceBadge(svc.type, dynamicCategories);
                          const amt = Number(svc.priceToman ?? svc.monthlyExpenseToman ?? 0);
                          const details = getServiceRemainingDetails(svc);
                          const showDays = details.trackingType === "TIME" || details.trackingType === "HYBRID";
                          const showQty = details.trackingType === "QUANTITY" || details.trackingType === "HYBRID";

                          return (
                            <div
                              key={svc.id}
                              className={`p-4 rounded-xl flex flex-col justify-between text-xs transition-all group ${
                                details.isExpired
                                  ? "bg-rose-500/5 border-2 border-rose-500/40 shadow-xs shadow-rose-500/10 hover:border-rose-500/60"
                                  : "bg-card/70 border border-border/50 hover:border-purple-500/40 hover:shadow-xs"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <span className="font-bold text-foreground text-xs leading-relaxed">{svc.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => openEditServiceModal(svc)}
                                      className="p-1.5 text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="ویرایش سرویس"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmDeleteServiceModal(svc);
                                      }}
                                      className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="حذف سرویس"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Badges row */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.label}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground font-medium">
                                    {details.trackingType === "HYBRID" ? "بسته ترکیبی" : details.trackingType === "TIME" ? "زمانی" : "تعدادی"}
                                  </span>

                                  {/* Interactive Auto-Renew Toggle Button */}
                                  <button
                                    type="button"
                                    disabled={updateServiceMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateServiceMutation.mutate({
                                        serviceId: svc.id,
                                        body: { autoRenew: svc.autoRenew === false },
                                      });
                                    }}
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                                      svc.autoRenew !== false
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                        : "bg-muted text-muted-foreground border-border/50 hover:bg-muted/80"
                                    }`}
                                    title={svc.autoRenew !== false ? "تمدید خودکار فعال است (کلیک برای تغییر به تمدید دستی)" : "تمدید دستی است (کلیک برای فعال‌سازی تمدید خودکار)"}
                                  >
                                    <Repeat className="h-2.5 w-2.5" />
                                    <span>{svc.autoRenew !== false ? "تمدید خودکار" : "تمدید دستی"}</span>
                                  </button>

                                  {details.trackingType !== "QUANTITY" && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${
                                      details.isExpired
                                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold"
                                        : details.daysLeft <= 3
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {details.isExpired
                                        ? `۰ روز مانده (منقضی - ${details.overdueDays?.toLocaleString("fa-IR")} روز)`
                                        : `${details.daysLeft.toLocaleString("fa-IR")} روز مانده`}
                                    </span>
                                  )}
                                </div>

                                {/* Progress: Time Remaining */}
                                {showDays && (
                                  <div className="flex flex-col gap-1 w-full bg-muted/20 p-2 rounded-xl border border-border/30">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className={`h-3 w-3 ${details.isExpired ? "text-rose-500" : details.urgency === "critical" ? "text-amber-500" : "text-blue-500"}`} />
                                        {details.isExpired ? (
                                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                                            منقضی شده ({details.overdueDays?.toLocaleString("fa-IR")} روز گذشته)
                                          </span>
                                        ) : (
                                          <span>
                                            {details.daysLeft.toLocaleString("fa-IR")} روز باقی‌مانده از {details.daysTotal.toLocaleString("fa-IR")} روز
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-bold text-[10px] text-muted-foreground">
                                        {Math.round(details.remainingPercent).toLocaleString("fa-IR")}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          details.isExpired
                                            ? "bg-rose-500"
                                            : details.urgency === "critical"
                                            ? "bg-amber-500"
                                            : "bg-blue-500"
                                        }`}
                                        style={{ width: `${details.remainingPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Progress: Quantity Remaining */}
                                {showQty && (
                                  <div className="flex flex-col gap-1 w-full bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                                        <Package className="h-3 w-3 text-emerald-500 shrink-0" />
                                        <span className="font-semibold">
                                          {details.remainingQty.toLocaleString("fa-IR")} باقی‌مانده از {details.totalQty.toLocaleString("fa-IR")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          ({details.usedQty.toLocaleString("fa-IR")} مصرف)
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          title="کاهش مصرف (بازگشت به موجودی)"
                                          disabled={details.usedQty <= 0 || updateServiceMutation.isPending}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateServiceMutation.mutate({
                                              serviceId: svc.id,
                                              body: { usedQuantity: Math.max(0, details.usedQty - 1) },
                                            });
                                          }}
                                          className="h-5 w-5 rounded bg-card border border-emerald-500/30 text-foreground hover:bg-muted flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <button
                                          type="button"
                                          title="ثبت یک واحد مصرف دستی"
                                          disabled={details.remainingQty <= 0 || updateServiceMutation.isPending}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateServiceMutation.mutate({
                                              serviceId: svc.id,
                                              body: { usedQuantity: details.usedQty + 1 },
                                            });
                                          }}
                                          className="h-5 px-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-0.5 text-[9px] font-semibold disabled:opacity-30 cursor-pointer shadow-xs"
                                        >
                                          + مصرف
                                        </button>
                                      </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 transition-all duration-300"
                                        style={{
                                          width: `${Math.min(100, Math.max(0, (details.remainingQty / details.totalQty) * 100))}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Alarms and Warnings */}
                                {details.isAlarmExceeded && (
                                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span>هشدار: دوره تعیین‌شده ({details.configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه است</span>
                                  </div>
                                )}
                                {details.isQuantityDepleted && (
                                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                                    <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                                    <span>بسته تمام شده (نیازمند تمدید سهمیه)</span>
                                  </div>
                                )}
                                {details.isTimeExpired && !details.isQuantityDepleted && (
                                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                                    <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
                                    <span>هشدار: مهلت سرور منقضی شده است ({details.overdueDays?.toLocaleString("fa-IR")} روز گذشته)!</span>
                                  </div>
                                )}
                                {!details.isExpired && details.isQuantityNearDepletion && (
                                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span>هشدار: کمتر از ۵٪ سهمیه بسته باقی مانده است ({details.remainingQty.toLocaleString("fa-IR")} عدد)</span>
                                  </div>
                                )}
                                {!details.isExpired && details.isTimeNearExpiry && (
                                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span>هشدار: {details.daysLeft.toLocaleString("fa-IR")} روز مانده تا پایان مهلت سرور</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/30">
                                  <span>مبلغ دوره:</span>
                                  <span className="font-bold text-foreground font-mono">
                                    {amt.toLocaleString("fa-IR")} تومان
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1">
                                  {svc.purchaseDate && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                      <span className="truncate">خرید: {formatJalaliDate(svc.purchaseDate)}</span>
                                    </div>
                                  )}
                                  {svc.renewalDate && (
                                    <div className={`flex items-center gap-1.5 justify-end font-mono ${details.isExpired ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                                      <Clock className={`h-3 w-3 shrink-0 ${details.isExpired ? "text-rose-500" : "text-amber-500"}`} />
                                      <span className="truncate">سررسید: {details.trackingType === "QUANTITY" ? "بدون انقضا" : formatJalaliDate(svc.renewalDate)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Manual Renew Action Button */}
                                <div className="pt-2 border-t border-border/30">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={renewSupplierServiceMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      renewSupplierServiceMutation.mutate(svc.id);
                                    }}
                                    className={`w-full h-7.5 px-2.5 text-xs gap-1.5 rounded-xl font-bold cursor-pointer ${
                                      details.isExpired || details.isQuantityDepleted
                                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 animate-pulse"
                                        : details.isQuantityNearDepletion || details.isTimeNearExpiry
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border-amber-500/30"
                                        : "text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-purple-500/20"
                                    }`}
                                    title={`تمدید دستی سرویس ${svc.name} (تمدید دوره و ثبت فاکتور)`}
                                  >
                                    <Repeat className={`h-3.5 w-3.5 ${renewSupplierServiceMutation.isPending ? "animate-spin" : ""}`} />
                                    <span>{renewSupplierServiceMutation.isPending ? "در حال تمدید..." : "تمدید سرویس"}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Supplier */}
        {isCreateSupplierOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !createSupplierMutation.isPending) setIsCreateSupplierOpen(false);
              }}
            >
              <div className="relative w-full max-w-md m-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-sm text-foreground">تعریف تامین‌کننده جدید</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8.5 w-8.5" onClick={() => setIsCreateSupplierOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleCreateSupplierSubmit} className="flex flex-col gap-5 mt-5 text-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">نام تامین‌کننده یا دیتاسنتر *</Label>
                    <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="مثال: دیتاسنتر هتزنر (Hetzner)" required className="h-10 text-xs rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">مسئول ارتباط / فروش</Label>
                      <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="مثال: آقای حسینی" className="h-10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">تلفن تماس / پشتیبانی</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="021..." dir="ltr" className="h-10 text-xs rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">ایمیل ارتباطی</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@domain.com" dir="ltr" className="h-10 text-xs rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">یادداشت‌ها</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات تکمیلی، نحوه تسویه یا پنل مدیریت" className="h-10 text-xs rounded-xl" />
                  </div>
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateSupplierOpen(false)} className="h-10 px-4 rounded-xl text-xs">انصراف</Button>
                    <Button type="submit" size="sm" disabled={createSupplierMutation.isPending} className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs">
                      {createSupplierMutation.isPending ? "در حال ثبت..." : "ثبت تامین‌کننده"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal: Edit Supplier */}
        {isEditSupplierOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !updateSupplierMutation.isPending) setIsEditSupplierOpen(false);
              }}
            >
              <div className="relative w-full max-w-md m-auto max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-sm text-foreground">ویرایش تامین‌کننده {supplierName}</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8.5 w-8.5" onClick={() => setIsEditSupplierOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleEditSupplierSubmit} className="flex flex-col gap-5 mt-5 text-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">نام تامین‌کننده *</Label>
                    <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required className="h-10 text-xs rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">مسئول ارتباط</Label>
                      <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="h-10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">تلفن تماس</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="h-10 text-xs rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">ایمیل</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="h-10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">وضعیت</Label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs"
                      >
                        <option value="ACTIVE">فعال (همکاری مستمر)</option>
                        <option value="INACTIVE">غیرفعال / قطع همکاری</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditSupplierOpen(false)} className="h-10 px-4 rounded-xl text-xs">انصراف</Button>
                    <Button type="submit" size="sm" disabled={updateSupplierMutation.isPending} className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs">
                      {updateSupplierMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal: Add Service to Supplier */}
        {isAddServiceOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !addServiceMutation.isPending) setIsAddServiceOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg m-auto max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-sm text-foreground">ثبت خدمت / سرویس خریداری‌شده از تامین‌کننده</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8.5 w-8.5" onClick={() => setIsAddServiceOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleAddServiceSubmit} className="flex flex-col gap-4 mt-5 text-xs">
                  {/* Supplier */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تامین‌کننده مربوطه *</Label>
                    <select
                      value={targetSupplierId}
                      onChange={(e) => setTargetSupplierId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs"
                      required
                    >
                      <option value="">-- انتخاب تامین‌کننده --</option>
                      {suppliersList.map((sup: any) => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">عنوان خدمت / ماشین *</Label>
                    <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="مثال: سرور اختصاصی لینوکس AX41، بسته ۵۰۰۰ پیامک..." required className="h-10 text-xs rounded-xl" />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">دسته‌بندی خدمت</Label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs"
                    >
                      {dynamicCategories.length > 0 ? (
                        dynamicCategories.map((c: any) => (
                          <option key={c.id} value={c.slug || c.id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="DEDICATED_SERVER">سرور اختصاصی و ابری</option>
                          <option value="CLOUD_HOSTING">هاستینگ و فضای ابری</option>
                          <option value="DOMAIN">ثبت و تمدید دامنه</option>
                          <option value="LICENSE">لایسنس نرم‌افزاری</option>
                          <option value="API">وب‌سرویس و شبکه</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Tracking Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مدل ردگیری و نوع پکیج *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "HYBRID" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("HYBRID")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          serviceTrackingType === "HYBRID" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        بسته ترکیبی (زمان + تعداد)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "TIME" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("TIME")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          serviceTrackingType === "TIME" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        زمانی (فقط مدت)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "QUANTITY" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("QUANTITY")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          serviceTrackingType === "QUANTITY" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        تعدادی (فقط سهمیه)
                      </Button>
                    </div>
                  </div>

                  {/* Parameters: Price, Duration, Quantity */}
                  {serviceTrackingType === "TIME" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePriceToman)}
                          onChange={(e) => setServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(servicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(servicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">بازه روزانه (مدت دوره به روز) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={serviceDurationDays}
                          onChange={(e) => handleServiceDurationChange(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {serviceTrackingType === "QUANTITY" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ کل بسته (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePriceToman)}
                          onChange={(e) => setServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(servicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(servicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تعداد ظرفیت / پکیج اولیه (عدد) *</Label>
                        <Input
                          type="number"
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {serviceTrackingType === "HYBRID" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePriceToman)}
                          onChange={(e) => setServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(servicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(servicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">بازه روزانه (دوره به روز) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={serviceDurationDays}
                          onChange={(e) => handleServiceDurationChange(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">ظرفیت پکیج (تعداد) *</Label>
                        <Input
                          type="number"
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Dates: Purchase & Renewal Date */}
                  {serviceTrackingType !== "QUANTITY" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">تاریخ خرید / شروع خدمت (شمسی) *</Label>
                          <JalaliDatePicker
                            value={servicePurchaseDate}
                            onChange={handleServicePurchaseDateChange}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">تاریخ سررسید تمدید / پایان (شمسی) *</Label>
                          <JalaliDatePicker
                            value={serviceRenewalDate}
                            onChange={handleServiceRenewalDateChange}
                          />
                        </div>
                      </div>

                      {/* Live Span & Alarm indicator */}
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">بازه زمانی کلی سررسید:</span>
                          <span className="font-bold text-foreground font-mono">
                            {serviceSpanDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">دوره تعیین‌شده برای سرویس:</span>
                          <span className="font-bold text-foreground font-mono">
                            {serviceDurationDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>

                        {serviceRangeAnalysis.isNegativeRange && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold mt-1">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد!
                            </span>
                          </div>
                        )}

                        {isServiceAlarmExceeded && !serviceRangeAnalysis.isNegativeRange && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold mt-1">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              توجه: فاصله تاریخ سررسید ({serviceSpanDays} روز) با دوره تنظیمی ({serviceDurationDays} روز) همخوانی ندارد.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auto-renew switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                    <div className="space-y-0.5">
                      <Label htmlFor="addServiceAutoRenewSwitch" className="text-xs font-semibold cursor-pointer">تمدید خودکار سرویس</Label>
                      <p className="text-[11px] text-muted-foreground">با رسیدن به سررسید، سرویس به‌صورت خودکار تمدید شود</p>
                    </div>
                    <input
                      type="checkbox"
                      id="addServiceAutoRenewSwitch"
                      checked={serviceAutoRenew}
                      onChange={(e) => setServiceAutoRenew(e.target.checked)}
                      className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddServiceOpen(false)} className="h-10 px-4 rounded-xl text-xs">انصراف</Button>
                    <Button type="submit" size="sm" disabled={addServiceMutation.isPending} className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs">
                      {addServiceMutation.isPending ? "در حال ثبت..." : "افزودن به خدمات تامین‌کننده"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal: Edit Service of Supplier */}
        {isEditServiceOpen && editingService && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !updateServiceMutation.isPending) setIsEditServiceOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg m-auto max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-sm text-foreground">ویرایش خدمت: {editingService.name}</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8.5 w-8.5" onClick={() => setIsEditServiceOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleEditServiceSubmit} className="flex flex-col gap-4 mt-5 text-xs">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">عنوان خدمت *</Label>
                    <Input value={editServiceName} onChange={(e) => setEditServiceName(e.target.value)} required className="h-10 text-xs rounded-xl" />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">دسته‌بندی خدمت</Label>
                    <select
                      value={editServiceType}
                      onChange={(e) => setEditServiceType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs"
                    >
                      {dynamicCategories.length > 0 ? (
                        dynamicCategories.map((c: any) => (
                          <option key={c.id} value={c.slug || c.id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="DEDICATED_SERVER">سرور اختصاصی و ابری</option>
                          <option value="CLOUD_HOSTING">هاستینگ و فضای ابری</option>
                          <option value="DOMAIN">ثبت و تمدید دامنه</option>
                          <option value="LICENSE">لایسنس نرم‌افزاری</option>
                          <option value="API">وب‌سرویس و شبکه</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Tracking Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مدل ردگیری و نوع پکیج *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={editServiceTrackingType === "HYBRID" ? "default" : "outline"}
                        onClick={() => setEditServiceTrackingType("HYBRID")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          editServiceTrackingType === "HYBRID" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        بسته ترکیبی (زمان + تعداد)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={editServiceTrackingType === "TIME" ? "default" : "outline"}
                        onClick={() => setEditServiceTrackingType("TIME")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          editServiceTrackingType === "TIME" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        زمانی (فقط مدت)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={editServiceTrackingType === "QUANTITY" ? "default" : "outline"}
                        onClick={() => setEditServiceTrackingType("QUANTITY")}
                        className={`text-[11px] sm:text-xs h-8.5 px-2 cursor-pointer rounded-xl whitespace-nowrap ${
                          editServiceTrackingType === "QUANTITY" ? "bg-purple-600 hover:bg-purple-500 text-white" : ""
                        }`}
                      >
                        تعدادی (فقط سهمیه)
                      </Button>
                    </div>
                  </div>

                  {/* Parameters: Price, Duration, Quantity */}
                  {editServiceTrackingType === "TIME" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(editServicePriceToman)}
                          onChange={(e) => setEditServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(editServicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(editServicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">بازه روزانه (مدت دوره به روز) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editServiceDurationDays}
                          onChange={(e) => handleEditServiceDurationChange(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {editServiceTrackingType === "QUANTITY" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ کل بسته (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(editServicePriceToman)}
                          onChange={(e) => setEditServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(editServicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(editServicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تعداد سهمیه کل (عدد) *</Label>
                        <Input
                          type="number"
                          value={editServiceQuantity}
                          onChange={(e) => setEditServiceQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">سهمیه مصرف‌شده (عدد)</Label>
                        <Input
                          type="number"
                          value={editServiceUsedQuantity}
                          onChange={(e) => setEditServiceUsedQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {editServiceTrackingType === "HYBRID" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مبلغ دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(editServicePriceToman)}
                          onChange={(e) => setEditServicePriceToman(parsePriceInput(e.target.value))}
                          placeholder="0"
                          required
                          className="rounded-xl h-9 text-xs text-left font-mono"
                        />
                        {Number(editServicePriceToman) > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            معادل: {Number(editServicePriceToman).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">بازه روزانه (دوره) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editServiceDurationDays}
                          onChange={(e) => handleEditServiceDurationChange(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">سهمیه کل *</Label>
                        <Input
                          type="number"
                          value={editServiceQuantity}
                          onChange={(e) => setEditServiceQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مصرف‌شده</Label>
                        <Input
                          type="number"
                          value={editServiceUsedQuantity}
                          onChange={(e) => setEditServiceUsedQuantity(Number(e.target.value))}
                          className="rounded-xl h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dates: Purchase & Renewal Date */}
                  {editServiceTrackingType !== "QUANTITY" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">تاریخ خرید / شروع خدمت (شمسی) *</Label>
                          <JalaliDatePicker
                            value={editServicePurchaseDate}
                            onChange={handleEditServicePurchaseDateChange}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">تاریخ سررسید تمدید / پایان (شمسی) *</Label>
                          <JalaliDatePicker
                            value={editServiceRenewalDate}
                            onChange={handleEditServiceRenewalDateChange}
                          />
                        </div>
                      </div>

                      {/* Live Span & Alarm indicator */}
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">بازه زمانی کلی سررسید:</span>
                          <span className="font-bold text-foreground font-mono">
                            {editServiceSpanDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">دوره تعیین‌شده برای سرویس:</span>
                          <span className="font-bold text-foreground font-mono">
                            {editServiceDurationDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>

                        {editServiceRangeAnalysis.isNegativeRange && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold mt-1">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد!
                            </span>
                          </div>
                        )}

                        {isEditServiceAlarmExceeded && !editServiceRangeAnalysis.isNegativeRange && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold mt-1">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              توجه: فاصله تاریخ سررسید ({editServiceSpanDays} روز) با دوره تنظیمی ({editServiceDurationDays} روز) همخوانی ندارد.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">وضعیت سرویس</Label>
                      <select
                        value={editServiceStatus}
                        onChange={(e) => setEditServiceStatus(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-xs"
                      >
                        <option value="ACTIVE">فعال (ACTIVE)</option>
                        <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">یادداشت</Label>
                      <Input value={editServiceNotes} onChange={(e) => setEditServiceNotes(e.target.value)} placeholder="توضیحات اختیاری" className="h-10 text-xs rounded-xl" />
                    </div>
                  </div>

                  {/* Auto-renew switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                    <div className="space-y-0.5">
                      <Label htmlFor="editServiceAutoRenewSwitch" className="text-xs font-semibold cursor-pointer">تمدید خودکار سرویس</Label>
                      <p className="text-[11px] text-muted-foreground">با رسیدن به سررسید، سرویس به‌صورت خودکار تمدید شود</p>
                    </div>
                    <input
                      type="checkbox"
                      id="editServiceAutoRenewSwitch"
                      checked={editServiceAutoRenew}
                      onChange={(e) => setEditServiceAutoRenew(e.target.checked)}
                      className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditServiceOpen(false)} className="h-10 px-4 rounded-xl text-xs">انصراف</Button>
                    <Button type="submit" size="sm" disabled={updateServiceMutation.isPending} className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs">
                      {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal / Dedicated Panel: Supplier Services Panel */}
        {isServicesPanelOpen && selectedSupplier && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsServicesPanelOpen(false);
              }}
            >
              <div className="relative w-full max-w-3xl m-auto max-h-[85vh] overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">پنل خدمات تامین‌کننده: {selectedSupplier.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">مشاهده، ویرایش و مدیریت تمامی ماشین‌ها و سرویس‌های فعال</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsServicesPanelOpen(false);
                        openAddServiceForSupplier(selectedSupplier.id);
                      }}
                      className="h-9 px-3.5 gap-1.5 text-xs rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      خدمت جدید
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8.5 w-8.5" onClick={() => setIsServicesPanelOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Summary in Panel */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground text-xs">تعداد خدمات:</span>
                    <div className="font-bold font-mono text-foreground text-base mt-1">{(selectedSupplier.services?.length || 0).toLocaleString("fa-IR")} سرویس</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">مجموع هزینه دوره:</span>
                    <div className="font-bold font-mono text-purple-600 dark:text-purple-400 text-base mt-1">
                      {Number(selectedSupplier.totalPayableToman || 0).toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground text-xs">وضعیت تامین‌کننده:</span>
                    <div className="font-bold text-emerald-600 text-base mt-1">
                      {selectedSupplier.status === "ACTIVE" ? "همکاری فعال" : "غیرفعال"}
                    </div>
                  </div>
                </div>

                {/* Service Cards inside Panel */}
                <div className="flex flex-col gap-3.5">
                  {(!selectedSupplier.services || selectedSupplier.services.length === 0) ? (
                    <div className="p-10 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                      هیچ خدمتی برای این تامین‌کننده ثبت نشده است.
                    </div>
                  ) : (
                    sortSupplierServices(selectedSupplier.services).map((svc: any) => {
                      const badge = getSupplierServiceBadge(svc.type, dynamicCategories);
                      const amt = Number(svc.priceToman ?? svc.monthlyExpenseToman ?? 0);
                      const details = getServiceRemainingDetails(svc);
                      const showDays = details.trackingType === "TIME" || details.trackingType === "HYBRID";
                      const showQty = details.trackingType === "QUANTITY" || details.trackingType === "HYBRID";

                      return (
                        <div
                          key={svc.id}
                          className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 text-xs transition-all ${
                            details.isExpired
                              ? "bg-rose-500/5 border-rose-500/40 shadow-xs shadow-rose-500/10 hover:border-rose-500/60"
                              : "border-border/50 bg-card/80 hover:border-purple-500/40 hover:shadow-xs"
                          }`}
                        >
                          <div className="space-y-2.5 flex-1">
                            {/* Title & Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{svc.name}</span>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground font-medium">
                                  {details.trackingType === "HYBRID" ? "بسته ترکیبی" : details.trackingType === "TIME" ? "زمانی" : "تعدادی"}
                                </span>

                                {/* Interactive Auto-Renew Toggle Button */}
                                <button
                                  type="button"
                                  disabled={updateServiceMutation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateServiceMutation.mutate({
                                      serviceId: svc.id,
                                      body: { autoRenew: svc.autoRenew === false },
                                    });
                                  }}
                                  className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                                    svc.autoRenew !== false
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                      : "bg-muted text-muted-foreground border-border/50 hover:bg-muted/80"
                                  }`}
                                  title={svc.autoRenew !== false ? "تمدید خودکار فعال است (کلیک برای تغییر به تمدید دستی)" : "تمدید دستی است (کلیک برای فعال‌سازی تمدید خودکار)"}
                                >
                                  <Repeat className="h-3 w-3" />
                                  <span>{svc.autoRenew !== false ? "تمدید خودکار" : "تمدید دستی"}</span>
                                </button>
                              </div>

                              {details.trackingType !== "QUANTITY" && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${
                                  details.isExpired
                                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold"
                                    : details.daysLeft <= 3
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {details.isExpired
                                    ? `۰ روز باقی‌مانده (منقضی شده - ${details.overdueDays?.toLocaleString("fa-IR")} روز گذشته)`
                                    : `${details.daysLeft.toLocaleString("fa-IR")} روز مانده`}
                                </span>
                              )}
                            </div>

                            {/* Progress: Time Remaining */}
                            {showDays && (
                              <div className="flex flex-col gap-1 w-full bg-muted/20 p-2.5 rounded-xl border border-border/30">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className={`h-3.5 w-3.5 ${details.isExpired ? "text-rose-500" : details.urgency === "critical" ? "text-amber-500" : "text-blue-500"}`} />
                                    {details.isExpired ? (
                                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                                        مهلت سرور منقضی شده ({details.overdueDays?.toLocaleString("fa-IR")} روز گذشته)
                                      </span>
                                    ) : (
                                      <span>
                                        {details.daysLeft.toLocaleString("fa-IR")} روز باقی‌مانده از {details.daysTotal.toLocaleString("fa-IR")} روز
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-bold text-[11px] text-muted-foreground">
                                    {Math.round(details.remainingPercent).toLocaleString("fa-IR")}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      details.isExpired
                                        ? "bg-rose-500"
                                        : details.urgency === "critical"
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                    }`}
                                    style={{ width: `${details.remainingPercent}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Progress: Quantity Remaining */}
                            {showQty && (
                              <div className="flex flex-col gap-1 w-full bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/20">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                                    <Package className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span className="font-semibold">
                                      {details.remainingQty.toLocaleString("fa-IR")} باقی‌مانده از {details.totalQty.toLocaleString("fa-IR")} سهمیه
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      ({details.usedQty.toLocaleString("fa-IR")} مصرف‌شده)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      title="کاهش مصرف (بازگشت به موجودی)"
                                      disabled={details.usedQty <= 0 || updateServiceMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateServiceMutation.mutate({
                                          serviceId: svc.id,
                                          body: { usedQuantity: Math.max(0, details.usedQty - 1) },
                                        });
                                      }}
                                      className="h-5.5 w-5.5 rounded-md bg-card border border-emerald-500/30 text-foreground hover:bg-muted flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      title="ثبت یک واحد مصرف دستی"
                                      disabled={details.remainingQty <= 0 || updateServiceMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateServiceMutation.mutate({
                                          serviceId: svc.id,
                                          body: { usedQuantity: details.usedQty + 1 },
                                        });
                                      }}
                                      className="h-5.5 px-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-0.5 text-[10px] font-semibold disabled:opacity-30 cursor-pointer shadow-xs"
                                    >
                                      + مصرف
                                    </button>
                                  </div>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, (details.remainingQty / details.totalQty) * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Alarms and Warnings */}
                            {details.isAlarmExceeded && (
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span>هشدار: دوره تعیین‌شده ({details.configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه است</span>
                              </div>
                            )}
                            {details.isQuantityDepleted && (
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span>بسته تمام شده (نیازمند تمدید سهمیه)</span>
                              </div>
                            )}
                            {details.isTimeExpired && !details.isQuantityDepleted && (
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                <span>هشدار: مهلت این سرور به پایان رسیده است ({details.overdueDays?.toLocaleString("fa-IR")} روز گذشته از سررسید)!</span>
                              </div>
                            )}
                            {!details.isExpired && details.isQuantityNearDepletion && (
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span>هشدار: کمتر از ۵٪ سهمیه بسته باقی مانده است ({details.remainingQty.toLocaleString("fa-IR")} عدد)</span>
                              </div>
                            )}
                            {!details.isExpired && details.isTimeNearExpiry && (
                              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span>هشدار: {details.daysLeft.toLocaleString("fa-IR")} روز مانده تا پایان مهلت سرور</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                              {svc.purchaseDate && <span>تاریخ خرید: {formatJalaliDate(svc.purchaseDate)}</span>}
                              {svc.renewalDate && (
                                <span className={`font-medium ${details.isExpired ? "text-rose-600 dark:text-rose-400 font-bold" : "text-amber-600 dark:text-amber-400"}`}>
                                  سررسید بعدی: {details.trackingType === "QUANTITY" ? "بدون انقضا" : formatJalaliDate(svc.renewalDate)}
                                </span>
                              )}
                              {svc.notes && <span className="italic">یادداشت: {svc.notes}</span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 border-t border-border/30">
                            <div className="font-mono font-bold text-foreground text-sm">
                              {amt.toLocaleString("fa-IR")} <span className="text-xs font-normal text-muted-foreground font-sans">تومان</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Manual Renew Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={renewSupplierServiceMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  renewSupplierServiceMutation.mutate(svc.id);
                                }}
                                className={`h-8 px-3 rounded-xl text-xs gap-1.5 font-bold cursor-pointer ${
                                  details.isExpired || details.isQuantityDepleted
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 animate-pulse"
                                    : details.isQuantityNearDepletion || details.isTimeNearExpiry
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border-amber-500/30"
                                    : "text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-purple-500/20"
                                }`}
                                title={`تمدید دستی سرویس ${svc.name}`}
                              >
                                <Repeat className={`h-3 w-3 ${renewSupplierServiceMutation.isPending ? "animate-spin" : ""}`} />
                                <span>تمدید</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsServicesPanelOpen(false);
                                  openEditServiceModal(svc);
                                }}
                                className="h-8 px-3 rounded-xl text-xs gap-1.5"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                ویرایش
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setConfirmDeleteServiceModal(svc);
                                }}
                                className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Confirm Modal for Deleting Supplier */}
        {confirmDeleteSupplierModal && (
          <ConfirmModal
            isOpen={!!confirmDeleteSupplierModal}
            onClose={() => setConfirmDeleteSupplierModal(null)}
            onConfirm={() => {
              deleteSupplierMutation.mutate(confirmDeleteSupplierModal.id);
              setConfirmDeleteSupplierModal(null);
            }}
            title="حذف تامین‌کننده"
            description={
              <div className="space-y-2 text-xs">
                <p>
                  آیا از حذف کامل تامین‌کننده <strong className="text-foreground font-semibold">«{confirmDeleteSupplierModal.name}»</strong> اطمینان دارید؟
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  هشدار: کلیه سرویس‌ها و هزینه‌های ثبت‌شده تحت این تامین‌کننده نیز لغو و پاکسازی خواهند شد.
                </p>
              </div>
            }
            confirmText="بله، حذف شود"
            variant="danger"
            isLoading={deleteSupplierMutation.isPending}
          />
        )}

        {/* Confirm Modal for Deleting Supplier Purchased Service */}
        {confirmDeleteServiceModal && (
          <ConfirmModal
            isOpen={!!confirmDeleteServiceModal}
            onClose={() => setConfirmDeleteServiceModal(null)}
            onConfirm={() => {
              deleteServiceMutation.mutate(confirmDeleteServiceModal.id);
              setConfirmDeleteServiceModal(null);
            }}
            title="حذف سرویس خریداری‌شده"
            description={
              <div className="space-y-2 text-xs">
                <p>
                  آیا از حذف سرویس <strong className="text-foreground font-semibold">«{confirmDeleteServiceModal.name}»</strong> اطمینان دارید؟
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  این عملیات غیرقابل بازگشت است و رکورد هزینه این سرویس از محاسبات تامین‌کننده کسر می‌شود.
                </p>
              </div>
            }
            confirmText="بله، حذف سرویس"
            variant="danger"
            isLoading={deleteServiceMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}
