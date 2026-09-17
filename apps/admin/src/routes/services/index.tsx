import { useState, useMemo } from "react";
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
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { JalaliDatePicker } from "@/components/common/jalali-datepicker";
import { ConfirmModal } from "@/components/common/confirm-modal";
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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Clock,
  Ban,
  Play,
  Pause,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/services/")({
  component: AdminServicesListPage,
});

function getCategoryIcon(slug: string) {
  const s = slug?.toLowerCase() || "";
  if (s.includes("domain") || s.includes("دامنه")) return Globe;
  if (s.includes("server") || s.includes("سرور") || s.includes("vps")) return Server;
  if (s.includes("host") || s.includes("هاست")) return HardDrive;
  if (s.includes("api") || s.includes("ai") || s.includes("هوش")) return Cpu;
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج")) return Package;
  return Tag;
}

function getCategoryBadge(slug?: string, customName?: string) {
  const s = slug?.toLowerCase() || "";
  if (s.includes("domain") || s.includes("دامنه")) {
    return {
      label: customName || "دامنه",
      icon: Globe,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }
  if (s.includes("server") || s.includes("سرور") || s.includes("vps")) {
    return {
      label: customName || "سرور",
      icon: Server,
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };
  }
  if (s.includes("host") || s.includes("هاست")) {
    return {
      label: customName || "هاستینگ",
      icon: HardDrive,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (s.includes("api") || s.includes("ai") || s.includes("هوش")) {
    return {
      label: customName || "وب‌سرویس و API",
      icon: Cpu,
      className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    };
  }
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج")) {
    return {
      label: customName || "بسته تعدادی",
      icon: Package,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  return {
    label: customName || slug || "سرویس ابری",
    icon: Tag,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  };
}

function getServiceRemainingDetails(service: any) {
  const trackingType = (service.trackingType || "HYBRID").toUpperCase();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const start = new Date(service.purchaseDate || service.startDate || service.createdAt || Date.now());
  const end = new Date(service.renewalDate || (start.getTime() + 30 * MS_PER_DAY));
  const now = new Date();

  // 1. بازه زمانی کلی (بازه زمانی تاریخ سررسید و تاریخ ثبت شده/خرید) یا دوره تعیین‌شده
  const rawCycle = Number(service.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;

  const rawSpan = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  const spanDays = configuredCycleDays || Math.max(1, rawSpan);

  // 2. محاسبه روزهای سپری‌شده از زمان ساخت/شروع سرویس
  const creationMs = service.createdAt ? new Date(service.createdAt).getTime() : start.getTime();
  const daysPassed = Math.max(0, Math.floor((now.getTime() - creationMs) / MS_PER_DAY));
  const daysLeft = Math.max(0, spanDays - daysPassed);
  const remainingPercent = Math.min(Math.max((daysLeft / spanDays) * 100, 0), 100);

  // 3. آلارم در صورتی که دوره تعیین‌شده از بازه کلی تقویمی بیشتر باشد
  const isAlarmExceeded = configuredCycleDays !== null && rawSpan > 0 && configuredCycleDays > rawSpan;
  const isExpired = daysLeft === 0 || end.getTime() < now.getTime();

  // Quantity calculation
  const totalQty = service.quantity || 1;
  const usedQty = service.usedQuantity || 0;
  const remainingQty = Math.max(0, totalQty - usedQty);

  return {
    trackingType,
    daysTotal: spanDays, // بازه کلی روزها
    daysPassed,
    daysLeft,
    remainingPercent,
    configuredCycleDays,
    isAlarmExceeded,
    isExpired,
    startDate: start,
    renewalDate: end,
    totalQty,
    usedQty,
    remainingQty,
  };
}

function formatPriceInput(val: number | string | undefined | null): string {
  if (val === "" || val === null || val === undefined || val === 0) return "";
  const cleanDigits = String(val).replace(/[^0-9]/g, "");
  const num = Number(cleanDigits);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("en-US");
}

function parsePriceInput(valStr: string): number {
  if (!valStr) return 0;
  const standardDigits = valStr
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "");
  return standardDigits === "" ? 0 : Number(standardDigits);
}

function safeDate(val?: string | Date | null, fallback = new Date()): Date {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
}

function safeIso(val?: string | Date | null, fallback = new Date()): string {
  return safeDate(val, fallback).toISOString();
}

function calcAddDays(baseIso: string | Date | null, days: number): string {
  const d = safeDate(baseIso);
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() + Number(days || 0));
  return result.toISOString();
}

function calcDaysBetween(startIso: string | Date | null, endIso: string | Date | null): number {
  const s = safeDate(startIso);
  const e = safeDate(endIso);
  const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  const diffDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

function AdminServicesListPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "type">("newest");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingSubService, setEditingSubService] = useState<any | null>(null);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  // Quick allocation state
  const [assigningToCatalog, setAssigningToCatalog] = useState<any | null>(null);
  const [assignSubServiceName, setAssignSubServiceName] = useState("");

  // Form states for Create Service
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("hosting");
  const [description, setDescription] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [trackingType, setTrackingType] = useState<"HYBRID" | "TIME" | "QUANTITY">("HYBRID");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1000);
  const [priceToman, setPriceToman] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString());
  const [assignRenewalDate, setAssignRenewalDate] = useState<string>(() =>
    calcAddDays(new Date().toISOString(), 30),
  );

  // Two-way reactive date handlers for Quick Assign
  const handleAssignDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setDurationDays(cleanDays);
    setAssignRenewalDate(calcAddDays(purchaseDate, cleanDays));
  };

  const handleAssignPurchaseDateChange = (val: string) => {
    const cleanVal = safeIso(val);
    setPurchaseDate(cleanVal);
    if (assignRenewalDate) {
      const calculatedDays = calcDaysBetween(cleanVal, assignRenewalDate);
      setDurationDays(calculatedDays);
    }
  };

  const handleAssignRenewalDateChange = (val: string) => {
    const cleanVal = safeIso(val, new Date(calcAddDays(purchaseDate, durationDays)));
    setAssignRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(purchaseDate, cleanVal);
    setDurationDays(calculatedDays);
  };

  // Derived span and alarm for Quick Assign
  const assignSpanDays = calcDaysBetween(purchaseDate, assignRenewalDate);
  const isAssignAlarmExceeded = trackingType !== "QUANTITY" && durationDays > assignSpanDays;

  // Form states for Edit Service Template (Master Catalog)
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string>("hosting");
  const [editDescription, setEditDescription] = useState("");

  // Form states for Edit Assigned Sub-Service (Instance of Customer)
  const [editSubName, setEditSubName] = useState("");
  const [editSubPrice, setEditSubPrice] = useState<number>(0);
  const [editSubTrackingType, setEditSubTrackingType] = useState<"HYBRID" | "TIME" | "QUANTITY">("HYBRID");
  const [editSubDurationDays, setEditSubDurationDays] = useState<number>(30);
  const [editSubQuantity, setEditSubQuantity] = useState<number>(1000);
  const [editSubUsedQuantity, setEditSubUsedQuantity] = useState<number>(0);
  const [editSubPurchaseDate, setEditSubPurchaseDate] = useState<string>(() => new Date().toISOString());
  const [editSubRenewalDate, setEditSubRenewalDate] = useState<string>(() =>
    calcAddDays(new Date().toISOString(), 30),
  );
  const [editSubStatus, setEditSubStatus] = useState<string>("ACTIVE");

  // Two-way reactive date handlers for Edit Sub-Service
  const handleEditSubDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setEditSubDurationDays(cleanDays);
    setEditSubRenewalDate(calcAddDays(editSubPurchaseDate, cleanDays));
  };

  const handleEditSubPurchaseDateChange = (val: string) => {
    const cleanVal = safeIso(val);
    setEditSubPurchaseDate(cleanVal);
    if (editSubRenewalDate) {
      const calculatedDays = calcDaysBetween(cleanVal, editSubRenewalDate);
      setEditSubDurationDays(calculatedDays);
    }
  };

  const handleEditSubRenewalDateChange = (val: string) => {
    const cleanVal = safeIso(val, new Date(calcAddDays(editSubPurchaseDate, editSubDurationDays)));
    setEditSubRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(editSubPurchaseDate, cleanVal);
    setEditSubDurationDays(calculatedDays);
  };

  // Confirm Modals for Sub-Services
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    isOpen: boolean;
    sub: any;
    nextStatus: string;
    customerName: string;
  } | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    sub: any;
    customerName: string;
  } | null>(null);

  // Derived span and alarm for Edit Sub-Service
  const editSubSpanDays = calcDaysBetween(editSubPurchaseDate, editSubRenewalDate);
  const isEditSubAlarmExceeded =
    editSubTrackingType !== "QUANTITY" && editSubDurationDays > editSubSpanDays;

  // Queries
  const { data: servicesData, isLoading, refetch } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=100"),
  });

  const { data: customersData } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/customers?limit=100"),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/categories"),
  });

  const allItems = servicesData?.items || [];
  const customersList = customersData?.items || [];
  const dynamicCategories = categoriesData?.items || [];

  // Build dynamic category tabs
  const categoryTabs = useMemo(() => {
    const defaultTabs = [
      { id: "all", name: "همه سرویس‌ها", slug: "all", icon: Layers },
    ];

    if (dynamicCategories.length > 0) {
      dynamicCategories
        .filter((c: any) => c.isActive !== false)
        .forEach((c: any) => {
          defaultTabs.push({
            id: c.slug || c.id,
            name: c.name,
            slug: c.slug,
            icon: getCategoryIcon(c.slug),
          });
        });
    } else {
      defaultTabs.push(
        { id: "domain", name: "دامنه", slug: "domain", icon: Globe },
        { id: "server", name: "سرور", slug: "server", icon: Server },
        { id: "hosting", name: "هاست", slug: "hosting", icon: HardDrive },
        { id: "api", name: "وب‌سرویس و API", slug: "api", icon: Cpu },
        { id: "package", name: "بسته تعدادی / پکیج", slug: "package", icon: Package },
      );
    }

    return defaultTabs;
  }, [dynamicCategories]);

  // Helper to test if a service belongs to a category tab
  const isServiceInTab = (svc: any, tabSlug: string) => {
    if (tabSlug === "all") return true;
    const target = tabSlug.toLowerCase().trim();
    const catSlug = (svc.categorySlug || "").toLowerCase().trim();
    const typeSlug = (svc.serviceType?.slug || "").toLowerCase().trim();
    const typeId = (svc.serviceTypeId || svc.serviceType?.id || "").toLowerCase().trim();
    const typeName = (svc.serviceType?.name || "").toLowerCase().trim();

    return (
      catSlug === target ||
      typeSlug === target ||
      typeId === target ||
      typeName === target ||
      catSlug.includes(target) ||
      typeSlug.includes(target) ||
      (target === "domain" && (catSlug.includes("دامنه") || typeName.includes("دامنه"))) ||
      (target === "server" && (catSlug.includes("سرور") || typeName.includes("سرور"))) ||
      (target === "hosting" && (catSlug.includes("هاست") || typeName.includes("هاست") || typeName.includes("میزبانی"))) ||
      (target === "api" && (catSlug.includes("api") || typeName.includes("api") || typeName.includes("وب‌سرویس"))) ||
      (target === "package" && (catSlug.includes("package") || typeName.includes("پکیج") || typeName.includes("بسته")))
    );
  };

  // Group into distinct catalog service templates and count assigned customers
  const catalogServices = useMemo(() => {
    // 1. Separate child services (have parentServiceId) from top-level services
    const childServicesMap = new Map<string, any[]>();
    const topLevelServices: any[] = [];
    const childServices: any[] = [];

    allItems.forEach((s: any) => {
      if (s.parentServiceId) {
        childServices.push(s);
        const pid = s.parentServiceId;
        if (!childServicesMap.has(pid)) {
          childServicesMap.set(pid, []);
        }
        childServicesMap.get(pid)!.push(s);
      } else {
        topLevelServices.push(s);
      }
    });

    const resultTemplates: any[] = [];
    const processedTopServiceIds = new Set<string>();

    // 2. Process top-level services (prioritizing pure catalog templates without customer first, then newest first)
    const sortedTopServices = [...topLevelServices].sort((a, b) => {
      if (!a.customerId && b.customerId) return -1;
      if (a.customerId && !b.customerId) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    sortedTopServices.forEach((top: any) => {
      const catSlug = top.serviceType?.slug || top.serviceTypeId || "hosting";
      const topName = (top.name || "").trim().toLowerCase();

      // Check if we already have a template card with the exact same name & category (to merge any duplicate catalog records)
      const existingGroup = resultTemplates.find(
        (r) => r.name?.trim().toLowerCase() === topName && (r.categorySlug === catSlug || !r.categorySlug)
      );

      // Collect all child services explicitly assigned to this service
      const directChildren = childServicesMap.get(top.id) || [];

      // Collect legacy matching customer services if top is a pure template
      const legacyMatchingChildren = !top.customerId
        ? childServices.filter((cs: any) => {
            if (cs.parentServiceId) return false;
            const csName = (cs.name || "").trim().toLowerCase();
            return csName === topName || csName.startsWith(topName);
          })
        : [];

      const allSubsForThisTop = [...directChildren, ...legacyMatchingChildren];

      // If top itself is an assigned customer instance, include it in the assigned list
      if (top.customerId && !allSubsForThisTop.some((x) => x.id === top.id)) {
        allSubsForThisTop.unshift(top);
      }

      if (existingGroup) {
        // Merge into existing group box so duplicate cards never appear
        allSubsForThisTop.forEach((sub) => {
          if (!existingGroup.assignedServices.some((x: any) => x.id === sub.id)) {
            existingGroup.assignedServices.push(sub);
          }
        });
        existingGroup.assignedCount = existingGroup.assignedServices.length;
      } else {
        resultTemplates.push({
          id: top.id,
          name: top.name,
          categorySlug: catSlug,
          serviceType: top.serviceType,
          serviceTypeId: top.serviceTypeId,
          description: top.description,
          createdAt: top.createdAt,
          assignedServices: allSubsForThisTop,
          assignedCount: allSubsForThisTop.length,
          isTemplate: !top.customerId,
          rawService: top,
        });
      }
      processedTopServiceIds.add(top.id);
    });

    // 3. Handle any orphaned child services whose parentServiceId is not among topLevelServices
    childServices.forEach((cs: any) => {
      const pid = cs.parentServiceId;
      const isAlreadyInGroup = resultTemplates.some((r) =>
        r.assignedServices.some((sub: any) => sub.id === cs.id)
      );
      if (!isAlreadyInGroup) {
        const parent = allItems.find((x: any) => x.id === pid);
        const parentName = parent?.name || cs.name;
        const catSlug = cs.serviceType?.slug || cs.serviceTypeId || parent?.serviceType?.slug || "hosting";

        const existingGroup = resultTemplates.find(
          (r) => r.id === pid || r.name?.trim().toLowerCase() === parentName.trim().toLowerCase()
        );

        if (existingGroup) {
          existingGroup.assignedServices.push(cs);
          existingGroup.assignedCount = existingGroup.assignedServices.length;
        } else {
          resultTemplates.push({
            id: pid || cs.id,
            name: parentName,
            categorySlug: catSlug,
            serviceType: cs.serviceType || parent?.serviceType,
            serviceTypeId: cs.serviceTypeId || parent?.serviceTypeId,
            description: parent?.description || cs.description,
            createdAt: cs.createdAt,
            assignedServices: [cs],
            assignedCount: 1,
            isTemplate: false,
          });
        }
      }
    });

    // Ensure assignedServices inside every service template group are sorted newest first
    resultTemplates.forEach((t) => {
      if (Array.isArray(t?.assignedServices)) {
        t.assignedServices.sort((a: any, b: any) => {
          const timeA = new Date(a?.createdAt || a?.purchaseDate || a?.startDate || 0).getTime() || 0;
          const timeB = new Date(b?.createdAt || b?.purchaseDate || b?.startDate || 0).getTime() || 0;
          return timeB - timeA;
        });
      }
    });

    return resultTemplates;
  }, [allItems]);

  // Filter by category and search
  const filteredServices = catalogServices
    .filter((svc: any) => {
      if (selectedCategory !== "all" && !isServiceInTab(svc, selectedCategory)) {
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
        return (a?.name || "").localeCompare(b?.name || "", "fa");
      }
      if (sortBy === "type") {
        return (a?.categorySlug || "").localeCompare(b?.categorySlug || "");
      }
      const timeA = new Date(a?.createdAt || 0).getTime() || 0;
      const timeB = new Date(b?.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });

  const getTabCount = (tabSlug: string) => {
    if (tabSlug === "all") return catalogServices.length;
    return catalogServices.filter((s: any) => isServiceInTab(s, tabSlug)).length;
  };

  const toggleExpand = (serviceName: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  // Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      if (assigningToCatalog) {
        setExpandedServices((prev) => ({
          ...prev,
          [assigningToCatalog.name]: true,
          [assigningToCatalog.id]: true,
        }));
      }
      setIsCreateOpen(false);
      setAssigningToCatalog(null);
      setName("");
      setAssignSubServiceName("");
      setDescription("");
      setSelectedCustomerId("");
      setPriceToman(0);
      setTrackingType("HYBRID");
      setDurationDays(30);
      setQuantity(1000);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ثبت سرویس");
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
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setEditingService(null);
      setEditingSubService(null);
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
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
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

    const payload: any = {
      name: name.trim(),
      serviceTypeSlug: category,
      description: description.trim() || undefined,
    };

    if (selectedCustomerId) {
      const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
      payload.customerId = selectedCustomerId;
      payload.trackingType = trackingType;
      payload.priceToman = Math.round(Number(priceToman)) || 0;
      payload.quantity = trackingType === "TIME" ? 1 : Math.max(1, Number(quantity) || 1);
      payload.billingCycle = trackingType === "QUANTITY" ? "NONE" : String(durationDays);
      payload.purchaseDate = pDate.toISOString();
      payload.startDate = pDate.toISOString();
      payload.renewalDate =
        trackingType === "QUANTITY"
          ? new Date(pDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(pDate.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    createServiceMutation.mutate(payload);
  };

  const handleQuickAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningToCatalog) return;
    if (!selectedCustomerId) {
      toast.error("لطفاً یک مشتری را انتخاب کنید");
      return;
    }

    const assignedName = assignSubServiceName.trim() || assigningToCatalog.name;
    const pDate = safeDate(purchaseDate);
    const renDate = safeDate(assignRenewalDate, new Date(calcAddDays(pDate, durationDays)));

    createServiceMutation.mutate({
      name: assignedName,
      parentServiceId: assigningToCatalog.id,
      serviceTypeId: assigningToCatalog.serviceTypeId,
      serviceTypeSlug: assigningToCatalog.categorySlug,
      description: assigningToCatalog.description || undefined,
      customerId: selectedCustomerId,
      trackingType,
      priceToman: Math.round(Number(priceToman)) || 0,
      quantity: trackingType === "TIME" ? 1 : Math.max(1, Number(quantity) || 1),
      billingCycle: trackingType === "QUANTITY" ? "NONE" : String(durationDays),
      purchaseDate: pDate.toISOString(),
      startDate: pDate.toISOString(),
      renewalDate: trackingType === "QUANTITY" ? calcAddDays(pDate, 365) : renDate.toISOString(),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editName.trim()) {
      toast.error("نام بسته نمی‌تواند خالی باشد");
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

  const handleOpenEditSubService = (sub: any) => {
    setEditingSubService(sub);
    setEditSubName(sub.name || "");
    setEditSubPrice(Number(sub.priceToman) || 0);
    setEditSubTrackingType((sub.trackingType || "HYBRID").toUpperCase() as any);

    const rawCycle = Number(sub.billingCycle);
    const totalDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : 30;
    setEditSubDurationDays(totalDays);

    setEditSubQuantity(Number(sub.quantity) || 1);
    setEditSubUsedQuantity(Number(sub.usedQuantity) || 0);
    const pDate = sub.purchaseDate || sub.startDate || sub.createdAt || new Date().toISOString();
    const rDate = sub.renewalDate || calcAddDays(pDate, totalDays);
    setEditSubPurchaseDate(safeIso(pDate));
    setEditSubRenewalDate(safeIso(rDate));
    setEditSubStatus(sub.status || "ACTIVE");
  };

  const handleEditSubServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubService) return;
    if (!editSubName.trim()) {
      toast.error("نام اختصاصی زیرمجموعه نمی‌تواند خالی باشد");
      return;
    }

    const pDate = safeDate(editSubPurchaseDate);
    const renDate = safeDate(editSubRenewalDate, new Date(calcAddDays(pDate, editSubDurationDays)));

    updateServiceMutation.mutate({
      id: editingSubService.id,
      data: {
        name: editSubName.trim(),
        priceToman: Math.round(Number(editSubPrice)) || 0,
        trackingType: editSubTrackingType,
        quantity: editSubTrackingType === "TIME" ? 1 : Math.max(1, Number(editSubQuantity) || 1),
        usedQuantity: editSubTrackingType === "TIME" ? 0 : Math.max(0, Number(editSubUsedQuantity) || 0),
        billingCycle: editSubTrackingType === "QUANTITY" ? "NONE" : String(editSubDurationDays),
        purchaseDate: pDate.toISOString(),
        startDate: pDate.toISOString(),
        renewalDate: editSubTrackingType === "QUANTITY" ? null : renDate.toISOString(),
        status: editSubStatus,
      },
    });
    setEditingSubService(null);
  };

  const handleToggleSubServiceStatus = (sub: any) => {
    const customerName = sub.customer?.displayName || sub.customer?.name || "مشترک";
    const nextStatus = sub.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setConfirmStatusModal({
      isOpen: true,
      sub,
      nextStatus,
      customerName,
    });
  };

  const handleDeleteSubService = (sub: any) => {
    const customerName = sub.customer?.displayName || sub.customer?.name || "مشترک";
    setConfirmDeleteModal({
      isOpen: true,
      sub,
      customerName,
    });
  };

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 animate-entrance dir-rtl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  مدیریت سرویس‌ها و کاتالوگ خدمات
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  ساختار سلسله‌مراتبی سرویس‌های اصلی کاتالوگ و زیرمجموعه‌های تخصیص‌یافته به همراه مدل‌های مصرف زمانی و تعدادی
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/categories">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs h-9 cursor-pointer rounded-xl border-border/70 px-3.5"
              >
                <Layers className="h-3.5 w-3.5 text-purple-500" />
                مدیریت دسته‌بندی‌ها
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 text-xs h-9 cursor-pointer rounded-xl px-3.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedCustomerId("");
                setName("");
                setDescription("");
                setPriceToman(0);
                setPurchaseDate(new Date().toISOString());
                setTrackingType("HYBRID");
                setIsCreateOpen(true);
              }}
              className="gap-2 text-xs h-9 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl px-4"
            >
              <Plus className="h-4 w-4" />
              ایجاد سرویس / بسته جدید
            </Button>
          </div>
        </div>

        {/* Dynamic Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-2.5">
            {categoryTabs.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.slug;
              const count = getTabCount(cat.slug);
              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`gap-2 text-xs h-8.5 px-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "shadow-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count.toLocaleString("fa-IR")}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سرویس یا بسته..."
              className="pr-9 text-xs h-9 bg-card rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto self-end">
            <span className="text-xs text-muted-foreground whitespace-nowrap">مرتب‌سازی:</span>
            <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border/50 text-xs">
              <Button
                variant={sortBy === "newest" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy("newest")}
                className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
              >
                جدیدترین
              </Button>
              <Button
                variant={sortBy === "name" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy("name")}
                className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
              >
                نام سرویس
              </Button>
              <Button
                variant={sortBy === "type" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy("type")}
                className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
              >
                دسته‌بندی
              </Button>
            </div>
          </div>
        </div>

        {/* Services List / Cards */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-xs text-muted-foreground">در حال بارگذاری کاتالوگ سرویس‌ها...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center border rounded-2xl bg-card/40">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm">سرویسی یافت نشد</span>
              <span className="text-xs text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "با فیلترهای اعمال شده هیچ سرویسی تطابق ندارد."
                  : "هنوز سرویسی در کاتالوگ ثبت نشده است."}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 ml-1" />
              تعریف اولین سرویس
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredServices.map((svc: any) => {
              const badge = getCategoryBadge(svc.categorySlug, svc.serviceType?.name);
              const BadgeIcon = badge.icon;
              const isExpanded = expandedServices[svc.name] ?? true;
              const assignedList = svc.assignedServices || [];

              return (
                <Card
                  key={svc.name}
                  className="rounded-2xl border bg-card/60 shadow-xs overflow-hidden transition-all hover:border-border"
                >
                  <CardContent className="p-0">
                    {/* Catalog Header */}
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-muted/10 border-b border-border/30">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                          <BadgeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-bold text-base text-foreground">{svc.name}</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}
                            >
                              <BadgeIcon className="h-3.5 w-3.5" />
                              {badge.label}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted font-mono text-muted-foreground">
                              {svc.assignedCount} مشترک فعال
                            </span>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAssigningToCatalog(svc);
                            setAssignSubServiceName("");
                            setSelectedCustomerId("");
                            setPriceToman(0);
                            const nowIso = new Date().toISOString();
                            setPurchaseDate(nowIso);
                            setDurationDays(30);
                            setAssignRenewalDate(calcAddDays(nowIso, 30));
                            setTrackingType("HYBRID");
                          }}
                          className="h-8.5 text-xs gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 cursor-pointer rounded-xl px-3"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>تخصیص به مشتری</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingService(svc);
                            setEditName(svc.name);
                            setEditCategory(svc.categorySlug || "hosting");
                            setEditDescription(svc.description || "");
                          }}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                          title="ویرایش قالب کاتالوگ"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(svc.name)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                          title={isExpanded ? "بستن زیرمجموعه‌ها" : "مشاهده زیرمجموعه‌ها"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Sub-services / Customer Instances Accordion */}
                    {isExpanded && (
                      <div className="p-5 bg-card/30">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between pb-3 border-b border-border/20">
                            <span className="text-xs font-bold text-muted-foreground">
                              نمونه‌ها و زیرمجموعه‌های تخصیص‌یافته به مشتریان ({assignedList.length})
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAssigningToCatalog(svc);
                                setAssignSubServiceName("");
                                setSelectedCustomerId("");
                                setPriceToman(0);
                                const nowIso = new Date().toISOString();
                                setPurchaseDate(nowIso);
                                setDurationDays(30);
                                setAssignRenewalDate(calcAddDays(nowIso, 30));
                                setTrackingType("HYBRID");
                              }}
                              className="h-7 text-xs px-2.5 gap-1.5 text-emerald-600 hover:text-emerald-700 cursor-pointer rounded-lg"
                            >
                              <Plus className="h-3 w-3" />
                              تخصیص نمونه جدید
                            </Button>
                          </div>

                          {assignedList.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                              هنوز هیچ مشتری این سرویس را دریافت نکرده است. از دکمه «تخصیص به مشتری» استفاده کنید.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead>
                                  <tr className="text-muted-foreground border-b border-border/30">
                                    <th className="py-3 px-4">نام زیرسرویس و مشتری</th>
                                    <th className="py-3 px-4">مدل ردگیری و باقیمانده</th>
                                    <th className="py-3 px-4">تاریخ ساخت</th>
                                    <th className="py-3 px-4">تاریخ خرید</th>
                                    <th className="py-3 px-4">تاریخ پایان / سررسید</th>
                                    <th className="py-3 px-4">مبلغ قرارداد</th>
                                    <th className="py-3 px-4 text-center">وضعیت</th>
                                    <th className="py-3 px-4 text-center">عملیات</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                  {assignedList.map((sub: any) => {
                                    const details = getServiceRemainingDetails(sub);
                                    const customerName =
                                      sub.customer?.displayName || sub.customer?.name || "مشتری";

                                    return (
                                      <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                                        {/* Sub-service Custom Name & Customer */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-bold text-foreground text-xs">
                                                {sub.name || svc.name}
                                              </span>
                                              {sub.name && sub.name.trim().toLowerCase() !== svc.name.trim().toLowerCase() && (
                                                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/50">
                                                  قالب مرجع: {svc.name}
                                                </span>
                                              )}
                                            </div>
                                            <Link
                                              to="/customers/$id"
                                              params={{ id: String(sub.customerId) }}
                                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-emerald-600 transition-colors"
                                            >
                                              <User className="h-3 w-3" />
                                              <span>{customerName}</span>
                                              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                            </Link>
                                          </div>
                                        </td>

                                        {/* Tracking Info: Time, Quantity, Hybrid */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex flex-col gap-0.5">
                                            {details.trackingType === "TIME" ? (
                                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                {details.daysLeft.toLocaleString("fa-IR")} روز باقی‌مانده از {details.daysTotal.toLocaleString("fa-IR")} روز
                                              </span>
                                            ) : details.trackingType === "QUANTITY" ? (
                                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                {details.remainingQty.toLocaleString("fa-IR")} عدد باقی‌مانده از {details.totalQty.toLocaleString("fa-IR")} بسته
                                              </span>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                  {details.daysLeft.toLocaleString("fa-IR")} روز مانده
                                                </span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                  {details.remainingQty.toLocaleString("fa-IR")} عدد مانده
                                                </span>
                                              </div>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                              مدل: {details.trackingType === "TIME" ? "زمان‌محور (فقط زمان)" : details.trackingType === "QUANTITY" ? "تعدادمحور (فقط تعداد)" : "ترکیبی (زمان و تعداد)"}
                                            </span>
                                            {details.isAlarmExceeded && (
                                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-medium mt-0.5 animate-pulse">
                                                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                <span>هشدار: دوره تعیین‌شده ({details.configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه ({details.daysTotal.toLocaleString("fa-IR")} روز)</span>
                                              </span>
                                            )}
                                            {details.isExpired && details.trackingType !== "QUANTITY" && (
                                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded-md font-medium mt-0.5">
                                                <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                                                <span>سررسید منقضی شده</span>
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Creation Date */}
                                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                          {formatJalaliDate(sub.createdAt || sub.startDate || sub.purchaseDate)}
                                        </td>

                                        {/* Purchase Date */}
                                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                          {formatJalaliDate(sub.purchaseDate || sub.startDate || sub.createdAt)}
                                        </td>

                                        {/* End / Renewal Date */}
                                        <td className="py-2.5 px-3 font-mono text-[11px]">
                                          {details.trackingType === "QUANTITY" ? (
                                            <span className="text-muted-foreground/60 text-[10px]">بدون انقضای زمانی</span>
                                          ) : (
                                            <span className="text-foreground font-semibold">
                                              {formatJalaliDate(sub.renewalDate)}
                                            </span>
                                          )}
                                        </td>

                                        {/* Price */}
                                        <td className="py-2.5 px-3 font-bold text-foreground">
                                          {(sub.priceToman || 0).toLocaleString("fa-IR")}{" "}
                                          <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-2.5 px-3 text-center">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                              sub.status === "ACTIVE"
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                : sub.status === "SUSPENDED"
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                            }`}
                                          >
                                            {sub.status === "ACTIVE"
                                              ? "فعال"
                                              : sub.status === "SUSPENDED"
                                              ? "معلق"
                                              : "غیرفعال"}
                                          </span>
                                        </td>

                                        {/* Actions with Edit, Toggle, and Delete */}
                                        <td className="py-2.5 px-3 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleOpenEditSubService(sub)}
                                              className="h-6 text-[11px] px-2 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer rounded-md"
                                              title={`ویرایش سرویس ${customerName}`}
                                            >
                                              <Edit2 className="h-3 w-3" />
                                              <span>ویرایش</span>
                                            </Button>

                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleSubServiceStatus(sub)}
                                              className={`h-6 text-[11px] px-2 gap-1 cursor-pointer rounded-md ${
                                                sub.status === "ACTIVE"
                                                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                              }`}
                                              title={
                                                sub.status === "ACTIVE"
                                                  ? `تعلیق سرویس ${customerName}`
                                                  : `فعال‌سازی سرویس ${customerName}`
                                              }
                                            >
                                              {sub.status === "ACTIVE" ? (
                                                <>
                                                  <Pause className="h-3 w-3" />
                                                  تعلیق
                                                </>
                                              ) : (
                                                <>
                                                  <Play className="h-3 w-3" />
                                                  فعال‌سازی
                                                </>
                                              )}
                                            </Button>

                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteSubService(sub)}
                                              className="h-6 text-[11px] px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer rounded-md"
                                              title={`حذف سرویس ${customerName}`}
                                            >
                                              <Trash2 className="h-3 w-3" />
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* MODAL: CREATE SERVICE / CATALOG TEMPLATE */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ایجاد سرویس / بسته جدید</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تعریف در کاتالوگ سیستم با قابلیت تخصیص مستقیم به مشتری
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                {/* 1. Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب دسته‌بندی / نوع سرویس *</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus:ring-1 focus:ring-ring font-medium cursor-pointer"
                    required
                  >
                    {dynamicCategories.length > 0 ? (
                      dynamicCategories.map((c: any) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="domain">دامنه (ثبت و مدیریت دامنه)</option>
                        <option value="server">سرور (سرور ابری و اختصاصی)</option>
                        <option value="hosting">هاست (هاستینگ و میزبانی وب)</option>
                        <option value="api">وب‌سرویس و API (سرویس‌های ابری و API)</option>
                        <option value="package">بسته تعدادی / پکیج (بسته‌های پیامک، پکیج‌های حجمی و...)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 2. Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام بسته / سرویس اصلی *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: هاست لینوکس ابری NVMe، سرور مجازی آلمان، بسته ۵۰۰۰ پیامک..."
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>

                {/* 3. Customer Assignment (Optional) */}
                <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>تخصیص به مشترک (اختیاری)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {selectedCustomerId ? "تخصیص مستقیم" : "صرفاً ذخیره در کاتالوگ"}
                    </span>
                  </Label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-card px-3 py-1 text-xs shadow-xs font-medium cursor-pointer"
                  >
                    <option value="">بدون مشتری (فقط تعریف به عنوان قالب در کاتالوگ)</option>
                    {customersList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName || c.name} ({c.phone || c.email || c.id})
                      </option>
                    ))}
                  </select>

                  {/* Customer Allocation Specific Fields */}
                  {selectedCustomerId && (
                    <div className="flex flex-col gap-3 pt-3 mt-2 border-t border-border/40 animate-in fade-in duration-200">
                      {/* Tracking Type */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">مدل ردگیری و مصرف سرویس *</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={trackingType === "HYBRID" ? "default" : "outline"}
                            onClick={() => setTrackingType("HYBRID")}
                            className={`text-xs h-8 cursor-pointer rounded-xl ${
                              trackingType === "HYBRID" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                            }`}
                          >
                            ترکیبی (هر دو)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={trackingType === "TIME" ? "default" : "outline"}
                            onClick={() => setTrackingType("TIME")}
                            className={`text-xs h-8 cursor-pointer rounded-xl ${
                              trackingType === "TIME" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                            }`}
                          >
                            زمان (فقط زمان)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={trackingType === "QUANTITY" ? "default" : "outline"}
                            onClick={() => setTrackingType("QUANTITY")}
                            className={`text-xs h-8 cursor-pointer rounded-xl ${
                              trackingType === "QUANTITY" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                            }`}
                          >
                            تعداد (فقط تعداد)
                          </Button>
                        </div>
                      </div>

                      {/* Price, Duration, Quantity conditional inputs */}
                      {trackingType === "TIME" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              dir="ltr"
                              value={formatPriceInput(priceToman)}
                              onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                              placeholder="0"
                              className="rounded-xl h-9 text-xs font-mono text-left"
                            />
                            {priceToman > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                معادل: {priceToman.toLocaleString("fa-IR")} تومان
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                            <Input
                              type="number"
                              value={durationDays}
                              onChange={(e) => setDurationDays(Number(e.target.value))}
                              className="rounded-xl h-9 text-xs font-mono"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {trackingType === "QUANTITY" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              dir="ltr"
                              value={formatPriceInput(priceToman)}
                              onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                              placeholder="0"
                              className="rounded-xl h-9 text-xs font-mono text-left"
                            />
                            {priceToman > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                معادل: {priceToman.toLocaleString("fa-IR")} تومان
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">تعداد ظرفیت / پکیج اولیه (عدد) *</Label>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="rounded-xl h-9 text-xs font-mono"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {trackingType === "HYBRID" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              dir="ltr"
                              value={formatPriceInput(priceToman)}
                              onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                              placeholder="0"
                              className="rounded-xl h-9 text-xs font-mono text-left"
                            />
                            {priceToman > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                معادل: {priceToman.toLocaleString("fa-IR")} تومان
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                            <Input
                              type="number"
                              value={durationDays}
                              onChange={(e) => setDurationDays(Number(e.target.value))}
                              className="rounded-xl h-9 text-xs font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">ظرفیت پکیج (عدد) *</Label>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="rounded-xl h-9 text-xs font-mono"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {/* Jalali Dates (Only for TIME and HYBRID) */}
                      {trackingType !== "QUANTITY" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">تاریخ ساخت و ایجاد (شمسی) *</Label>
                            <JalaliDatePicker
                              value={purchaseDate}
                              onChange={(iso) => setPurchaseDate(iso)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">تاریخ شروع / خرید (شمسی) *</Label>
                            <JalaliDatePicker
                              value={purchaseDate}
                              onChange={(iso) => setPurchaseDate(iso)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و مشخصات فنی (اختیاری)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات اختیاری درباره امکانات و کاربرد این سرویس"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="cursor-pointer rounded-xl text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createServiceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl text-xs"
                  >
                    {createServiceMutation.isPending ? "در حال ایجاد..." : "ثبت و ایجاد سرویس"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: QUICK ASSIGN CATALOG TEMPLATE TO CUSTOMER (with custom name) */}
        {assigningToCatalog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">تخصیص سرویس به مشتری جدید</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      قالب کاتالوگ پایه: {assigningToCatalog.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAssigningToCatalog(null)}
                  className="cursor-pointer rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleQuickAssignSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                {/* Info Card: Parent Base Catalog Template */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">الگوی کاتالوگ پایه:</span>
                    <span className="font-bold text-foreground text-xs">{assigningToCatalog.name}</span>
                  </div>
                  {(() => {
                    const badge = getCategoryBadge(assigningToCatalog.categorySlug);
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                {/* 1. Custom Name for Sub-service */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    نام اختصاصی سرویس برای این مشتری <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={assignSubServiceName}
                    onChange={(e) => setAssignSubServiceName(e.target.value)}
                    placeholder="مثال: وب‌سایت اصلی شرکت، سرور توسعه، دامنه choobinooo.ir..."
                    className="rounded-xl h-9 text-xs font-medium"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">
                    نام اختصاصی این اشتراک که با نام قالب کاتالوگ متفاوت است و برای مشتری نمایش داده می‌شود.
                  </span>
                </div>

                {/* 2. Customer Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب مشتری *</Label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-card px-3 py-1 text-xs shadow-xs font-medium cursor-pointer"
                    required
                  >
                    <option value="">انتخاب کنید...</option>
                    {customersList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName || c.name} ({c.phone || c.email || c.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Tracking Mode */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">مدل ردگیری و مصرف سرویس *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={trackingType === "HYBRID" ? "default" : "outline"}
                      onClick={() => setTrackingType("HYBRID")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        trackingType === "HYBRID" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      ترکیبی (هر دو)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={trackingType === "TIME" ? "default" : "outline"}
                      onClick={() => setTrackingType("TIME")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        trackingType === "TIME" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      زمان (فقط زمان)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={trackingType === "QUANTITY" ? "default" : "outline"}
                      onClick={() => setTrackingType("QUANTITY")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        trackingType === "QUANTITY" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      تعداد (فقط تعداد)
                    </Button>
                  </div>
                </div>

                {/* 4. Tracking Parameters: Price, Duration, Quantity */}
                {trackingType === "TIME" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(priceToman)}
                        onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {priceToman > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {priceToman.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(e) => handleAssignDurationChange(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                {trackingType === "QUANTITY" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(priceToman)}
                        onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {priceToman > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {priceToman.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">تعداد ظرفیت / پکیج اولیه (عدد) *</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                {trackingType === "HYBRID" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(priceToman)}
                        onChange={(e) => setPriceToman(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {priceToman > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {priceToman.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(e) => handleAssignDurationChange(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">ظرفیت پکیج (عدد) *</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 5. Dates: Creation Date & Start/Purchase Date (Only for TIME and HYBRID) */}
                {trackingType !== "QUANTITY" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تاریخ ثبت و خرید (شمسی) *</Label>
                        <JalaliDatePicker
                          value={purchaseDate}
                          onChange={handleAssignPurchaseDateChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تاریخ سررسید / پایان (شمسی) *</Label>
                        <JalaliDatePicker
                          value={assignRenewalDate}
                          onChange={handleAssignRenewalDateChange}
                        />
                      </div>
                    </div>

                    {/* Live Span & Alarm indicator */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">بازه زمانی کلی سررسید:</span>
                        <span className="font-bold text-foreground font-mono">
                          {assignSpanDays.toLocaleString("fa-IR")} روز
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">دوره تعیین‌شده برای سرویس:</span>
                        <span className="font-bold text-foreground font-mono">
                          {durationDays.toLocaleString("fa-IR")} روز
                        </span>
                      </div>

                      {isAssignAlarmExceeded && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium animate-pulse mt-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>
                              هشدار: دوره تعیین‌شده ({durationDays.toLocaleString("fa-IR")} روز) از بازه سررسید ({assignSpanDays.toLocaleString("fa-IR")} روز) بیشتر است!
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssignDurationChange(assignSpanDays)}
                            className="text-[11px] underline text-amber-800 dark:text-amber-200 font-bold hover:text-amber-900 cursor-pointer shrink-0"
                          >
                            تطبیق دوره با بازه
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssigningToCatalog(null)}
                    className="cursor-pointer rounded-xl text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createServiceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl text-xs"
                  >
                    {createServiceMutation.isPending ? "در حال ثبت..." : "تخصیص به مشتری و ثبت"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT SERVICE TEMPLATE (Master Catalog) */}
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش کاتالوگ سرویس مرجع</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تغییر نام قالب مرجع، دسته‌بندی و مشخصات کاتالوگ
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingService(null)}
                  className="cursor-pointer rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب دسته‌بندی / نوع سرویس *</Label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus:ring-1 focus:ring-ring font-medium cursor-pointer"
                    required
                  >
                    {dynamicCategories.length > 0 ? (
                      dynamicCategories.map((c: any) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="domain">دامنه (ثبت و مدیریت دامنه)</option>
                        <option value="server">سرور (سرور ابری و اختصاصی)</option>
                        <option value="hosting">هاست (هاستینگ و میزبانی وب)</option>
                        <option value="api">وب‌سرویس و API (سرویس‌های ابری و API)</option>
                        <option value="package">بسته تعدادی / پکیج (بسته‌های پیامک، پکیج‌های حجمی و...)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام بسته / سرویس مرجع *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl h-9 text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">توضیحات و مشخصات فنی (اختیاری)</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                    className="cursor-pointer rounded-xl text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateServiceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl text-xs"
                  >
                    {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT ASSIGNED SUB-SERVICE (Instance of Customer) */}
        {editingSubService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش سرویس اختصاصی مشترک</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      مشتری: {editingSubService.customer?.displayName || editingSubService.customer?.name || "مشترک"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingSubService(null)}
                  className="cursor-pointer rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSubServiceSubmit} className="flex flex-col gap-4 mt-4 text-xs">
                {/* 1. Custom Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    نام اختصاصی این زیرسرویس <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={editSubName}
                    onChange={(e) => setEditSubName(e.target.value)}
                    placeholder="مثال: وب‌سایت اصلی شرکت، سرور پشتیبان..."
                    className="rounded-xl h-9 text-xs font-medium"
                    required
                  />
                </div>

                {/* 2. Tracking Mode */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">مدل ردگیری و مصرف سرویس *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={editSubTrackingType === "HYBRID" ? "default" : "outline"}
                      onClick={() => setEditSubTrackingType("HYBRID")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editSubTrackingType === "HYBRID" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      ترکیبی (هر دو)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editSubTrackingType === "TIME" ? "default" : "outline"}
                      onClick={() => setEditSubTrackingType("TIME")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editSubTrackingType === "TIME" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      زمان (فقط زمان)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editSubTrackingType === "QUANTITY" ? "default" : "outline"}
                      onClick={() => setEditSubTrackingType("QUANTITY")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editSubTrackingType === "QUANTITY" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      تعداد (فقط تعداد)
                    </Button>
                  </div>
                </div>

                {/* 3. Tracking Parameters: Price, Duration, Quantity */}
                {editSubTrackingType === "TIME" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(editSubPrice)}
                        onChange={(e) => setEditSubPrice(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {editSubPrice > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {editSubPrice.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editSubDurationDays}
                        onChange={(e) => handleEditSubDurationChange(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                {editSubTrackingType === "QUANTITY" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ قرارداد (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(editSubPrice)}
                        onChange={(e) => setEditSubPrice(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {editSubPrice > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {editSubPrice.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">ظرفیت کل (عدد) *</Label>
                      <Input
                        type="number"
                        value={editSubQuantity}
                        onChange={(e) => setEditSubQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مصرف‌شده (عدد)</Label>
                      <Input
                        type="number"
                        value={editSubUsedQuantity}
                        onChange={(e) => setEditSubUsedQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {editSubTrackingType === "HYBRID" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مبلغ (تومان)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatPriceInput(editSubPrice)}
                        onChange={(e) => setEditSubPrice(parsePriceInput(e.target.value))}
                        placeholder="0"
                        className="rounded-xl h-9 text-xs font-mono text-left"
                      />
                      {editSubPrice > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          معادل: {editSubPrice.toLocaleString("fa-IR")} تومان
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">اعتبار (روز) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editSubDurationDays}
                        onChange={(e) => handleEditSubDurationChange(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">ظرفیت کل (عدد) *</Label>
                      <Input
                        type="number"
                        value={editSubQuantity}
                        onChange={(e) => setEditSubQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">مصرف‌شده (عدد)</Label>
                      <Input
                        type="number"
                        value={editSubUsedQuantity}
                        onChange={(e) => setEditSubUsedQuantity(Number(e.target.value))}
                        className="rounded-xl h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Dates (Only for TIME and HYBRID) */}
                {editSubTrackingType !== "QUANTITY" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تاریخ ساخت و خرید (شمسی) *</Label>
                        <JalaliDatePicker
                          value={editSubPurchaseDate}
                          onChange={handleEditSubPurchaseDateChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">تاریخ سررسید / پایان (شمسی) *</Label>
                        <JalaliDatePicker
                          value={editSubRenewalDate}
                          onChange={handleEditSubRenewalDateChange}
                        />
                      </div>
                    </div>

                    {/* Live Span & Alarm indicator for Edit */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">بازه زمانی کلی سررسید:</span>
                        <span className="font-bold text-foreground font-mono">
                          {editSubSpanDays.toLocaleString("fa-IR")} روز
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">دوره تعیین‌شده برای سرویس:</span>
                        <span className="font-bold text-foreground font-mono">
                          {editSubDurationDays.toLocaleString("fa-IR")} روز
                        </span>
                      </div>

                      {isEditSubAlarmExceeded && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium animate-pulse mt-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>
                              هشدار: دوره تعیین‌شده ({editSubDurationDays.toLocaleString("fa-IR")} روز) از بازه سررسید ({editSubSpanDays.toLocaleString("fa-IR")} روز) بیشتر است!
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditSubDurationChange(editSubSpanDays)}
                            className="text-[11px] underline text-amber-800 dark:text-amber-200 font-bold hover:text-amber-900 cursor-pointer shrink-0"
                          >
                            تطبیق دوره با بازه
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">وضعیت سرویس</Label>
                  <select
                    value={editSubStatus}
                    onChange={(e) => setEditSubStatus(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 py-1 text-xs shadow-xs font-medium cursor-pointer"
                  >
                    <option value="ACTIVE">فعال (ACTIVE)</option>
                    <option value="SUSPENDED">معلق (SUSPENDED)</option>
                    <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingSubService(null)}
                    className="cursor-pointer rounded-xl text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateServiceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl text-xs"
                  >
                    {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات زیرسرویس"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal for Status Toggle */}
        {confirmStatusModal && (
          <ConfirmModal
            isOpen={confirmStatusModal.isOpen}
            onClose={() => setConfirmStatusModal(null)}
            onConfirm={() => {
              updateServiceMutation.mutate({
                id: confirmStatusModal.sub.id,
                data: { status: confirmStatusModal.nextStatus },
              });
              setConfirmStatusModal(null);
            }}
            title={confirmStatusModal.nextStatus === "ACTIVE" ? "فعال‌سازی سرویس" : "تعلیق و غیرفعال‌سازی سرویس"}
            description={
              <div className="space-y-2 text-xs">
                <p>
                  آیا از {confirmStatusModal.nextStatus === "ACTIVE" ? "فعال‌سازی مجدد" : "تعلیق و غیرفعال‌سازی موقت"} سرویس <strong className="text-foreground font-semibold">«{confirmStatusModal.sub?.name}»</strong> متعلق به مشتری <strong className="text-foreground font-semibold">«{confirmStatusModal.customerName}»</strong> اطمینان دارید؟
                </p>
                {confirmStatusModal.nextStatus !== "ACTIVE" && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    توجه: با تعلیق سرویس، وضعیت آن در پنل مشترک نیز به حالت معلق تغییر می‌یابد.
                  </p>
                )}
              </div>
            }
            confirmText={confirmStatusModal.nextStatus === "ACTIVE" ? "بله، فعال شود" : "بله، تعلیق شود"}
            variant={confirmStatusModal.nextStatus === "ACTIVE" ? "success" : "warning"}
            isLoading={updateServiceMutation.isPending}
          />
        )}

        {/* Confirm Modal for Sub-Service Deletion */}
        {confirmDeleteModal && (
          <ConfirmModal
            isOpen={confirmDeleteModal.isOpen}
            onClose={() => setConfirmDeleteModal(null)}
            onConfirm={() => {
              deleteServiceMutation.mutate(confirmDeleteModal.sub.id);
              setConfirmDeleteModal(null);
            }}
            title="حذف دائم سرویس"
            description={
              <div className="space-y-2 text-xs">
                <p>
                  آیا از حذف کامل و دائمی سرویس <strong className="text-foreground font-semibold">«{confirmDeleteModal.sub?.name}»</strong> متعلق به مشتری <strong className="text-foreground font-semibold">«{confirmDeleteModal.customerName}»</strong> اطمینان دارید؟
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  هشدار: این عملیات غیرقابل بازگشت است و رکورد این سرویس به صورت کامل حذف خواهد شد.
                </p>
              </div>
            }
            confirmText="بله، حذف دائم شود"
            variant="danger"
            isLoading={deleteServiceMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}
