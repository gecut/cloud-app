import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { JalaliDatePicker } from "@/components/common/jalali-datepicker";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { ModalPortal } from "@/components/common/modal-portal";
import { apiClient } from "@/utils/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import { normalizePhoneNumber, getTelegramChatUrl } from "@/utils/phone";
import { formatJalaliDate, formatJalaliDateWords, formatJalaliDateTime, analyzeDateRange } from "@gecut-cloud/contracts";
import {
  User,
  Users,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Server,
  FileText,
  CreditCard,
  Bell,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
  Activity,
  X,
  Ban,
  Eye,
  Globe,
  HardDrive,
  Cpu,
  Package,
  Repeat,
  MapPin,
  Tag,
} from "lucide-react";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

function getServiceCategoryBadge(slug?: string, name?: string) {
  const s = `${slug || ""} ${name || ""}`.toLowerCase();
  if (s.includes("domain") || s.includes("دامنه")) {
    return {
      label: name || "دامنه",
      icon: Globe,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }
  if (s.includes("server") || s.includes("سرور") || s.includes("vps") || s.includes("اختصاصی")) {
    return {
      label: name || "سرور",
      icon: Server,
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };
  }
  if (s.includes("package") || s.includes("بسته") || s.includes("پکیج") || s.includes("تعدادی") || s.includes("اشتراک")) {
    return {
      label: name || "بسته تعدادی",
      icon: Package,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (s.includes("api") || s.includes("وب‌سرویس") || s.includes("وب سرویس") || s.includes("هوش")) {
    return {
      label: name || "وب‌سرویس و API",
      icon: Cpu,
      className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    };
  }
  if (s.includes("host") || s.includes("هاست") || s.includes("میزبانی")) {
    return {
      label: name || "هاست",
      icon: HardDrive,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  return {
    label: name || "متفرقه",
    icon: Tag,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  };
}

function getBillingCycleLabel(cycle?: string | number) {
  if (!cycle) return "۳۰ روزه";
  const num = Number(cycle);
  if (!isNaN(num) && num > 0) {
    return `${num.toLocaleString("fa-IR")} روزه`;
  }
  switch (String(cycle).toUpperCase()) {
    case "MONTHLY":
      return "۳۰ روزه";
    case "QUARTERLY":
      return "۹۰ روزه";
    case "SEMI_ANNUAL":
      return "۱۸۰ روزه";
    case "ANNUAL":
      return "۳۶۵ روزه";
    default:
      return `${cycle} روزه`;
  }
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

  const configuredCycleDays = parseBillingCycleDays(service.billingCycle);

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

  // Prevent invalid negative range if legacy data had corrupted start date after renewalDate
  if (trackingType !== "QUANTITY" && start.getTime() > end.getTime()) {
    start = new Date(end.getTime() - (configuredCycleDays || 30) * MS_PER_DAY);
  }

  const analysis = analyzeDateRange({
    startDate: start,
    endDate: end,
    configuredCycleDays,
  });

  // Quantity calculation
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

export const Route = createFileRoute("/customers/$id")({
  component: AdminCustomerProfileDetailPage,
});

function AdminCustomerProfileDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Tab: 'profile' | 'services' | 'invoices' | 'notifications'
  const [activeTab, setActiveTab] = useState<"profile" | "services" | "invoices" | "notifications">("profile");

  // Modals state
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);

  // Fetch Customer Details
  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => apiClient<any>(`/customers/${id}`),
  });

  // Fetch direct invoices for this customer to ensure fresh sync
  const { data: customerInvoicesData } = useQuery({
    queryKey: ["admin", "invoices", "customer", id],
    queryFn: () => apiClient<{ items: any[]; total: number }>(`/invoices?customerId=${id}&limit=100`),
  });

  // Fetch Audit Logs for this customer
  const { data: auditLogsData } = useQuery({
    queryKey: ["admin", "audit-logs", "customer", id],
    queryFn: () => apiClient<any>(`/audit-logs?entityId=${id}&limit=20`),
  });

  // Fetch All Created Services Catalog
  const { data: allServicesData } = useQuery({
    queryKey: ["admin", "services", "catalog"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/services?limit=100"),
  });

  // Fetch Categories for dynamic category resolution
  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient<{ items: any[]; total: number }>("/categories"),
  });
  const dynamicCategories = categoriesData?.items || [];

  // Unique base services created in the system catalog
  const rawCatalogList = (allServicesData?.items || []).filter(
    (s: any) => !s.customerId && !s.parentServiceId,
  );
  const catalogServices = Array.from(
    new Map(
      (rawCatalogList.length > 0 ? rawCatalogList : allServicesData?.items || []).map((s: any) => [
        s.id,
        {
          id: s.id,
          name: s.name,
          categorySlug: s.serviceType?.slug || "hosting",
          categoryName: s.serviceType?.name || "",
          serviceTypeId: s.serviceTypeId,
          serviceType: s.serviceType,
          description: s.description,
          server: s.server,
          priceToman: s.priceToman,
          quantity: s.quantity,
          trackingType: s.trackingType,
        },
      ]),
    ).values(),
  );

  // Profile Edit Form State
  const [profileName, setProfileName] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileStatus, setProfileStatus] = useState<string>("ACTIVE");
  const [profileBirthDate, setProfileBirthDate] = useState<string | null>(null);
  const [profileCooperationStartDate, setProfileCooperationStartDate] = useState<string | null>(null);
  const [profileTelegramChatId, setProfileTelegramChatId] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [hasProfileInitialized, setHasProfileInitialized] = useState(false);

  useEffect(() => {
    if (customer && !hasProfileInitialized) {
      setProfileName(customer.name || "");
      setProfileDisplayName(customer.displayName || customer.company || "");
      setProfilePhone(customer.phone || customer.user?.phone || "");
      setProfileEmail(customer.email || customer.user?.email || "");
      setProfileStatus(customer.status || "ACTIVE");
      setProfileBirthDate(customer.birthDate || null);
      setProfileCooperationStartDate(customer.cooperationStartDate || null);
      setProfileTelegramChatId(customer.telegramChatId || "");
      setProfileAddress(customer.address || customer.user?.address || "");
      setProfileDescription(customer.description || "");
      setHasProfileInitialized(true);
    }
  }, [customer, hasProfileInitialized]);

  // Assign Created Service Form State
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState("");
  const [serviceCustomName, setServiceCustomName] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1000);
  const [servicePrice, setServicePrice] = useState<string>("2500000");
  const [serviceDurationDays, setServiceDurationDays] = useState<number>(30);
  const [serviceAutoRenew, setServiceAutoRenew] = useState<boolean>(true);
  const [serviceCreateInvoice, setServiceCreateInvoice] = useState<boolean>(true);
  const [serviceTrackingType, setServiceTrackingType] = useState<"TIME" | "QUANTITY" | "HYBRID">("HYBRID");
  const [servicePurchaseDate, setServicePurchaseDate] = useState<string | null>(() => new Date().toISOString());
  const [newServiceRenewalDate, setNewServiceRenewalDate] = useState<string>(() =>
    calcAddDays(new Date().toISOString(), 30),
  );

  // Two-way reactive date handlers for Assign Service
  const handleAssignDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setServiceDurationDays(cleanDays);
    setNewServiceRenewalDate(calcAddDays(servicePurchaseDate, cleanDays));
  };

  const handleAssignPurchaseDateChange = (val: string) => {
    const cleanVal = safeIso(val);
    setServicePurchaseDate(cleanVal);
    if (newServiceRenewalDate) {
      const calculatedDays = calcDaysBetween(cleanVal, newServiceRenewalDate);
      setServiceDurationDays(calculatedDays);
    }
  };

  const handleAssignRenewalDateChange = (val: string) => {
    const cleanVal = safeIso(val, new Date(calcAddDays(servicePurchaseDate, serviceDurationDays)));
    setNewServiceRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(servicePurchaseDate, cleanVal);
    setServiceDurationDays(calculatedDays);
  };

  // Derived span and alarm for Assign Service
  const assignRangeAnalysis = analyzeDateRange({
    startDate: servicePurchaseDate,
    endDate: newServiceRenewalDate,
    configuredCycleDays: serviceTrackingType !== "QUANTITY" ? serviceDurationDays : undefined,
  });
  const assignSpanDays = assignRangeAnalysis.totalDays;
  const isAssignAlarmExceeded =
    serviceTrackingType !== "QUANTITY" && assignRangeAnalysis.isAlarmExceeded;

  const activeSelectedService =
    catalogServices.find((s: any) => s.id === selectedCatalogServiceId) ||
    catalogServices[0] ||
    null;

  useEffect(() => {
    if (activeSelectedService && !serviceCustomName) {
      setServiceCustomName(activeSelectedService.name);
    }
  }, [activeSelectedService]);

  // View Invoice Details State
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);

  // Edit Service Form State
  const [editServiceName, setEditServiceName] = useState("");
  const [editServicePrice, setEditServicePrice] = useState("");
  const [editServiceQuantity, setEditServiceQuantity] = useState<number>(1);
  const [editServiceUsedQuantity, setEditServiceUsedQuantity] = useState<number>(0);
  const [editServiceTrackingType, setEditServiceTrackingType] = useState<"TIME" | "QUANTITY" | "HYBRID">("HYBRID");
  const [editServicePurchaseDate, setEditServicePurchaseDate] = useState<string | null>(null);
  const [editServiceDurationDays, setEditServiceDurationDays] = useState<number>(30);
  const [editServiceAutoRenew, setEditServiceAutoRenew] = useState(true);
  const [editServiceStatus, setEditServiceStatus] = useState("ACTIVE");
  const [editServiceRenewalDate, setEditServiceRenewalDate] = useState("");

  // Derived span and alarm for Edit Service
  const editServiceRangeAnalysis = analyzeDateRange({
    startDate: editServicePurchaseDate || selectedService?.purchaseDate || selectedService?.startDate,
    endDate: editServiceRenewalDate,
    configuredCycleDays: editServiceTrackingType !== "QUANTITY" ? editServiceDurationDays : undefined,
  });
  const editServiceSpanDays = editServiceRangeAnalysis.totalDays;
  const isEditServiceAlarmExceeded =
    editServiceTrackingType !== "QUANTITY" && editServiceRangeAnalysis.isAlarmExceeded;

  const handleEditServiceDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Number(days) || 1);
    setEditServiceDurationDays(cleanDays);
    const base = editServicePurchaseDate || selectedService?.purchaseDate || selectedService?.startDate || new Date().toISOString();
    setEditServiceRenewalDate(calcAddDays(base, cleanDays));
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
    const base = editServicePurchaseDate || selectedService?.purchaseDate || selectedService?.startDate || new Date().toISOString();
    const cleanVal = safeIso(val, new Date(calcAddDays(base, editServiceDurationDays)));
    setEditServiceRenewalDate(cleanVal);
    const calculatedDays = calcDaysBetween(base, cleanVal);
    setEditServiceDurationDays(calculatedDays);
  };

  const [confirmDeactivateModal, setConfirmDeactivateModal] = useState<{
    isOpen: boolean;
    nextStatus: string;
  } | null>(null);

  // Create Invoice Form State
  const [invoiceItemTitle, setInvoiceItemTitle] = useState("");
  const [invoiceItemAmount, setInvoiceItemAmount] = useState("2500000");
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

  // Edit Invoice Form State
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editInvoiceTitle, setEditInvoiceTitle] = useState("");
  const [editInvoiceAmount, setEditInvoiceAmount] = useState<number>(0);
  const [editInvoiceNotes, setEditInvoiceNotes] = useState("");
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<string>("UNPAID");
  const [editInvoiceDueDays, setEditInvoiceDueDays] = useState<number>(7);

  // Send Notification Form State
  const [notificationType, setNotificationType] = useState<"SMS" | "EMAIL">("SMS");
  const [notificationTemplate, setNotificationTemplate] = useState("renewal_reminder");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Update Customer Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("اطلاعات پروفایل مشتری با موفقیت بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در بروزرسانی اطلاعات پروفایل");
    },
  });

  // Toggle Customer Status (Activate / Deactivate) Mutation
  const toggleCustomerStatusMutation = useMutation({
    mutationFn: (newStatus: "ACTIVE" | "INACTIVE") =>
      apiClient(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: (_, newStatus) => {
      toast.success(
        newStatus === "ACTIVE"
          ? "مشتری با موفقیت فعال شد"
          : "مشتری با موفقیت غیرفعال شد",
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در تغییر وضعیت مشتری");
    },
  });

  // Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس با موفقیت به این مشتری اختصاص داده شد و صورت‌حساب اولیه ثبت گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsCreateServiceOpen(false);
      setServiceCustomName("");
      setServiceQuantity(1000);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد سرویس");
    },
  });

  // Update Service Mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: any }) =>
      apiClient(`/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس با موفقیت ویرایش شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
      setIsEditServiceOpen(false);
      setSelectedService(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش سرویس");
    },
  });

  // Renew Service Mutation
  const renewServiceMutation = useMutation({
    mutationFn: (serviceId: string) =>
      apiClient(`/services/${serviceId}/renew`, {
        method: "POST",
      }),
    onSuccess: (res: any) => {
      toast.success(res?.message || "سرویس با موفقیت تمدید شد و فاکتور تمدید صادر گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accounting"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در تمدید سرویس");
    },
  });

  // Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("صورت‌حساب جدید صادر شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsCreateInvoiceOpen(false);
      setInvoiceItemTitle("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در صدور صورت‌حساب");
    },
  });

  // Cancel Invoice Mutation
  const cancelInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient(`/invoices/${invoiceId}/cancel`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت لغو شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در لغو فاکتور");
    },
  });

  // Reactivate Invoice Mutation
  const reactivateInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient(`/invoices/${invoiceId}/reactivate`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت مجدداً فعال شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در فعال‌سازی مجدد فاکتور");
    },
  });

  // Update Invoice Mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ invId, payload }: { invId: string; payload: any }) =>
      apiClient(`/invoices/${invId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت ویرایش شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      setIsEditInvoiceOpen(false);
      setEditingInvoice(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش فاکتور");
    },
  });

  const handleOpenEditInvoice = (inv: any) => {
    setEditingInvoice(inv);
    setEditInvoiceTitle(inv.items?.[0]?.title || "");
    setEditInvoiceAmount(inv.totalToman || 0);
    setEditInvoiceNotes(inv.notes || "");
    setEditInvoiceStatus(inv.status || "UNPAID");
    const remainingDays = inv.dueDate
      ? Math.max(1, Math.round((new Date(inv.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 7;
    setEditInvoiceDueDays(remainingDays);
    setIsEditInvoiceOpen(true);
  };

  const handleEditInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!editInvoiceTitle.trim()) {
      toast.error("عنوان ردیف فاکتور الزامی است");
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(editInvoiceDueDays));

    updateInvoiceMutation.mutate({
      invId: editingInvoice.id,
      payload: {
        status: editInvoiceStatus,
        dueDate: dueDate.toISOString(),
        notes: editInvoiceNotes,
        items: [
          {
            title: editInvoiceTitle,
            unitPriceToman: Number(editInvoiceAmount),
            quantity: 1,
          },
        ],
      },
    });
  };

  // Send Notification Mutation
  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/notifications/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("اعلان در صف ارسال پیامک/ایمیل قرار گرفت");
      setIsSendNotificationOpen(false);
      setNotificationMessage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ارسال اعلان");
    },
  });

  // Handle direct Telegram PV by chat ID / username
  const handleOpenTelegram = () => {
    if (!activeCustomer.telegramChatId) {
      toast.error("شناسه تلگرام برای این مشتری ثبت نشده است");
      return;
    }
    const cleanId = activeCustomer.telegramChatId.trim().replace(/^@/, "");
    window.open(`https://t.me/${cleanId}`, "_blank", "noopener,noreferrer");
  };

  // Delete Customer Mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: () =>
      apiClient(`/customers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("پرونده مشتری و کلیه اطلاعات وابسته با موفقیت حذف گردید");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      navigate({ to: "/customers" });
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در حذف مشتری");
    },
  });

  // Handle Profile Update
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = profilePhone ? normalizePhoneNumber(profilePhone) : undefined;
    updateProfileMutation.mutate({
      name: profileName,
      displayName: profileDisplayName || undefined,
      phone: cleanPhone,
      email: profileEmail || undefined,
      status: profileStatus,
      birthDate: profileBirthDate || null,
      cooperationStartDate: profileCooperationStartDate || null,
      telegramChatId: profileTelegramChatId ? profileTelegramChatId.trim() : null,
      address: profileAddress ? profileAddress.trim() : null,
      description: profileDescription ? profileDescription.trim() : null,
    });
  };

  // Handle Assign Service Submit
  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedService) {
      toast.error("لطفاً یک سرویس از سرویس‌های تعریف‌شده را انتخاب کنید");
      return;
    }
    if (serviceTrackingType !== "QUANTITY" && assignRangeAnalysis.isNegativeRange) {
      toast.error("خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد");
      return;
    }
    const qty = serviceTrackingType === "TIME" ? 1 : Math.max(1, Number(serviceQuantity) || 1);
    const finalPrice = Math.round(Number(servicePrice)) || 0;
    const finalName = serviceCustomName.trim() || activeSelectedService.name;

    const pDate = safeDate(servicePurchaseDate);
    const renewalDateIso =
      serviceTrackingType === "QUANTITY"
        ? null
        : safeIso(newServiceRenewalDate, new Date(calcAddDays(pDate, serviceDurationDays)));

    createServiceMutation.mutate({
      customerId: activeCustomer?.id || id,
      parentServiceId: activeSelectedService.id,
      serviceTypeId: activeSelectedService.serviceTypeId,
      serviceTypeSlug: activeSelectedService.categorySlug,
      name: finalName,
      priceToman: finalPrice,
      billingCycle: serviceTrackingType === "QUANTITY" ? "NONE" : String(serviceDurationDays),
      autoRenew: serviceAutoRenew,
      quantity: qty,
      trackingType: serviceTrackingType,
      purchaseDate: pDate.toISOString(),
      startDate: pDate.toISOString(),
      renewalDate: renewalDateIso,
      description: activeSelectedService.description || undefined,
    });
  };

  // Handle Edit Service Submit
  const handleEditServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (editServiceTrackingType !== "QUANTITY" && editServiceRangeAnalysis.isNegativeRange) {
      toast.error("خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد");
      return;
    }
    updateServiceMutation.mutate({
      serviceId: selectedService.id,
      data: {
        name: editServiceName,
        priceToman: Math.round(Number(editServicePrice)) || 0,
        billingCycle: editServiceTrackingType === "QUANTITY" ? "NONE" : String(editServiceDurationDays),
        autoRenew: editServiceAutoRenew,
        quantity: editServiceTrackingType === "TIME" ? 1 : Math.max(1, Number(editServiceQuantity) || 1),
        usedQuantity: editServiceTrackingType === "TIME" ? 0 : Math.max(0, Number(editServiceUsedQuantity) || 0),
        status: editServiceStatus,
        trackingType: editServiceTrackingType,
        purchaseDate: safeIso(editServicePurchaseDate || selectedService.purchaseDate || selectedService.startDate || new Date()),
        renewalDate:
          editServiceTrackingType === "QUANTITY"
            ? null
            : safeIso(editServiceRenewalDate, new Date(calcAddDays(editServicePurchaseDate || new Date(), editServiceDurationDays))),
      },
    });
  };

  // Handle Create Invoice Submit
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number(invoiceItemAmount)) || 0;
    if (amount <= 0) {
      toast.error("مبلغ فاکتور باید بزرگتر از صفر باشد");
      return;
    }
    const cleanDueDate = invoiceDueDate
      ? new Date(invoiceDueDate).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    createInvoiceMutation.mutate({
      customerId: activeCustomer?.id || id,
      dueDate: cleanDueDate,
      items: [
        {
          title: invoiceItemTitle || "تمدید دوره‌ای خدمات هاستینگ و زیرساخت",
          quantity: 1,
          unitPriceToman: amount,
        },
      ],
    });
  };

  // Handle Send Notification Submit
  const handleSendNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = notificationType === "SMS" ? (customer?.phone || profilePhone) : (customer?.email || profileEmail);
    if (!recipient) {
      toast.error(`شماره تماس یا ایمیل مشتری برای ارسال ${notificationType} یافت نشد`);
      return;
    }
    sendNotificationMutation.mutate({
      type: notificationType,
      recipient,
      template: notificationTemplate,
      data: {
        customerName: customer?.name || profileName,
        message: notificationMessage || undefined,
      },
    });
  };

  const invoicesList = useMemo(() => {
    const sourceInvoices =
      customerInvoicesData?.items && customerInvoicesData.items.length > 0
        ? customerInvoicesData.items
        : customer?.invoices || [];
    return [...sourceInvoices].sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || a.issuedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.issuedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [customer?.invoices, customerInvoicesData?.items]);

  const activeCustomer = customer;

  if (isLoading) {
    return (
      <AppShell header={<AdminHeader />}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs text-muted-foreground">در حال بارگذاری اطلاعات پرونده مشتری...</span>
        </div>
      </AppShell>
    );
  }

  if (!activeCustomer) {
    return (
      <AppShell header={<AdminHeader />}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 opacity-80" />
          <div>
            <h2 className="text-base font-bold text-foreground">پرونده مشتری یافت نشد</h2>
            <p className="text-xs text-muted-foreground mt-1">مشترکی با شناسه مشخص شده در پایگاه داده وجود ندارد.</p>
          </div>
          <Link to="/customers">
            <Button size="sm" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
              بازگشت به فهرست مشترکین
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const servicesList = useMemo(() => {
    return [...(activeCustomer.services || [])]
      .filter((s: any) => (!s.childServices || s.childServices.length === 0))
      .sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.purchaseDate || a.startDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.purchaseDate || b.startDate || 0).getTime();
        return timeB - timeA;
      });
  }, [activeCustomer?.services]);
  
  // Calculate summary metrics
  const isInvoicePaid = (inv: any) => String(inv.status).toUpperCase() === "PAID" || Boolean(inv.payment);
  const isInvoiceCancelled = (inv: any) => String(inv.status).toUpperCase() === "CANCELLED";
  const isInvoiceUnpaid = (inv: any) => !isInvoicePaid(inv) && !isInvoiceCancelled(inv);

  const activeServicesCount = servicesList.filter((s: any) => s.status === "ACTIVE").length;
  const unpaidInvoices = invoicesList.filter(isInvoiceUnpaid);
  const unpaidTotalToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);
  const paidInvoices = invoicesList.filter(isInvoicePaid);
  const paidTotalToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/customers">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs hover:text-foreground h-9 px-3">
                <ArrowRight className="h-4 w-4" />
                بازگشت به مشتریان
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-sm">پروفایل و مدیریت مشتری</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 h-9 px-3.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
            {activeCustomer.status === "ACTIVE" ? (
              <Button
                key="btn-deactivate-header"
                size="sm"
                variant="outline"
                onClick={() => toggleCustomerStatusMutation.mutate("INACTIVE")}
                disabled={toggleCustomerStatusMutation.isPending}
                className="gap-2 h-9 px-3.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>غیرفعال‌سازی مشتری</span>
              </Button>
            ) : (
              <Button
                key="btn-activate-header"
                size="sm"
                variant="outline"
                onClick={() => toggleCustomerStatusMutation.mutate("ACTIVE")}
                disabled={toggleCustomerStatusMutation.isPending}
                className="gap-2 h-9 px-3.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>فعال‌سازی مشتری</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleOpenTelegram}
              className="gap-2 h-9 px-3.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 cursor-pointer shadow-xs font-semibold"
              title={activeCustomer.telegramChatId ? `ارسال پیام به ${activeCustomer.telegramChatId} در تلگرام` : "ارسال پیام در تلگرام"}
            >
              <Send className="h-3.5 w-3.5 text-sky-500" />
              <span>ارسال پیام</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDeleteCustomerOpen(true)}
              disabled={deleteCustomerMutation.isPending}
              className="gap-2 h-9 px-3.5 text-rose-600 hover:text-white hover:bg-rose-600 border-rose-300 dark:border-rose-900/50 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>حذف مشتری</span>
            </Button>
          </div>
        </div>

        {/* Main Content Area (Covered in Blur when Inactive) */}
        <div className="relative">
          <div
            className={`flex flex-col gap-6 transition-all duration-300 ${
              activeCustomer.status === "INACTIVE"
                ? "filter blur-[3px] opacity-40 select-none pointer-events-none"
                : ""
            }`}
          >
            {/* Customer Top Header Profile Card */}
            <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Avatar & Main Info */}
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-xs">
                  {activeCustomer.name ? activeCustomer.name.charAt(0) : "U"}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {activeCustomer.name}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        activeCustomer.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{activeCustomer.status === "ACTIVE" ? "حساب فعال" : "غیرفعال / معلق"}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground mt-1.5">
                    {activeCustomer.displayName && (
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5" />
                        {activeCustomer.displayName}
                      </span>
                    )}
                    {activeCustomer.phone && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5" />
                        {activeCustomer.phone}
                      </span>
                    )}
                    {activeCustomer.telegramChatId && (
                      <a
                        href={
                          activeCustomer.telegramChatId.startsWith("@")
                            ? `https://t.me/${activeCustomer.telegramChatId.slice(1)}`
                            : `https://t.me/${activeCustomer.telegramChatId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {activeCustomer.telegramChatId}
                      </a>
                    )}
                    {activeCustomer.email && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Mail className="h-3.5 w-3.5" />
                        {activeCustomer.email}
                      </span>
                    )}
                    {activeCustomer.cooperationStartDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>همکاری از: {formatJalaliDate(activeCustomer.cooperationStartDate)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges / ID Info */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-border gap-2">
                <div className="text-left">
                  <span className="text-[11px] text-muted-foreground">شناسه سیستمی:</span>
                  <p className="font-mono text-xs font-semibold text-foreground">{activeCustomer.id}</p>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-muted-foreground">تاریخ عضویت:</span>
                  <p className="text-xs text-foreground font-mono">
                    {formatJalaliDate(activeCustomer.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-2xl border bg-card shadow-xs p-5 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3 p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                سرویس‌های فعال
              </CardTitle>
              <Server className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl font-bold">
                {activeServicesCount} <span className="text-xs font-normal text-muted-foreground">از {servicesList.length} سرویس</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs p-5 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3 p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                بدهی در انتظار پرداخت
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {unpaidTotalToman.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{unpaidInvoices.length} فاکتور باز</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs p-5 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3 p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                مجموع پرداختی‌های موفق
              </CardTitle>
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl font-bold text-foreground font-mono">
                {paidTotalToman.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{paidInvoices.length} پرداخت ثبت شده</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs p-5 sm:p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-3 p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                وضعیت کلی زیرساخت
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ۹۹.۹٪ پایداری
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">تمام اندپوینت‌ها در دسترس</p>
            </CardContent>
          </Card>
        </div>

        {/* Custom Tab Navigation Bar */}
        <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-5 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <User className="h-4 w-4" />
            مشخصات و ویرایش پروفایل
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2.5 px-5 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "services"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Server className="h-4 w-4" />
            سرویس‌ها و هاستینگ ({servicesList.length})
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2.5 px-5 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "invoices"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <FileText className="h-4 w-4" />
            فاکتورها و تراکنش‌ها ({invoicesList.length})
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2.5 px-5 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "notifications"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Bell className="h-4 w-4" />
            اعلانات و تاریخچه فعالیت
          </button>
        </div>

        {/* TAB 1: PROFILE & EDIT */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl border bg-card shadow-xs">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-semibold">ویرایش مشخصات مشتری</CardTitle>
                <CardDescription className="text-xs">
                  اطلاعات هویتی، شرکتی و وضعیت دسترسی این حساب کاربری را ویرایش کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="prof-name" className="text-xs font-semibold">
                      نام و نام خانوادگی / نام مدیر حساب *
                    </Label>
                    <Input
                      id="prof-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="نام مشتری"
                      className="h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="prof-display" className="text-xs font-semibold">
                        نام برند / شرکت
                      </Label>
                      <Input
                        id="prof-display"
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder="عنوان برند تجاری"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold">
                        شماره تماس اصلی
                      </Label>
                      <Input
                        id="prof-phone"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="0912xxxxxxx"
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="prof-email" className="text-xs font-semibold">
                        آدرس ایمیل
                      </Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prof-status" className="text-xs font-semibold">
                        وضعیت حساب کاربری
                      </Label>
                      <select
                        id="prof-status"
                        value={profileStatus}
                        onChange={(e) => setProfileStatus(e.target.value)}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                      >
                        <option value="ACTIVE">فعال (ACTIVE)</option>
                        <option value="SUSPENDED">معلق (SUSPENDED)</option>
                        <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">
                        تاریخ تولد
                      </Label>
                      <JalaliDatePicker
                        value={profileBirthDate}
                        onChange={(val) => setProfileBirthDate(val)}
                        placeholder="انتخاب تاریخ تولد..."
                        minYear={1300}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">
                        تاریخ شروع همکاری
                      </Label>
                      <JalaliDatePicker
                        value={profileCooperationStartDate}
                        onChange={(val) => setProfileCooperationStartDate(val)}
                        placeholder="انتخاب تاریخ شروع همکاری..."
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-telegram" className="text-xs font-semibold">
                      شناسه / آیدی تلگرام (Chat ID یا Username)
                    </Label>
                    <div className="relative">
                      <Send className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
                      <Input
                        id="prof-telegram"
                        value={profileTelegramChatId}
                        onChange={(e) => setProfileTelegramChatId(e.target.value)}
                        placeholder="@username یا 123456789"
                        dir="ltr"
                        className="font-mono pl-9 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-address" className="text-xs font-semibold">
                      نشانی و آدرس پستی
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
                      <Input
                        id="prof-address"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="مثال: تهران، خیابان ولیعصر، پلاک ..."
                        className="pl-9 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prof-desc" className="text-xs font-semibold">
                      توضیحات و یادداشت‌های پرونده مشتری
                    </Label>
                    <textarea
                      id="prof-desc"
                      value={profileDescription}
                      onChange={(e) => setProfileDescription(e.target.value)}
                      placeholder="توضیحات تکمیلی، شرایط خاص قرارداد یا یادداشت‌های اداری مشتری..."
                      rows={3}
                      className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t mt-2">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="gap-2 h-9 px-5"
                    >
                      {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات مشخصات"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-xs">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-semibold">اطلاعات احراز هویت و امنیت</CardTitle>
                <CardDescription className="text-xs">
                  جزئیات حساب کاربری متصل و ورود به سامانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">نقش کاربری:</span>
                  <span className="font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px]">
                    CUSTOMER
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">روش احراز هویت:</span>
                  <span className="font-semibold text-foreground">کد پیامکی (OTP) و رمز عبور</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">شناسه یکتای User:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {activeCustomer.userId || activeCustomer.id}
                  </span>
                </div>
                {activeCustomer.birthDate && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">تاریخ تولد:</span>
                    <span className="text-foreground font-mono">
                      {formatJalaliDate(activeCustomer.birthDate)}
                    </span>
                  </div>
                )}
                {activeCustomer.cooperationStartDate && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">شروع همکاری:</span>
                    <span className="text-foreground font-mono">
                      {formatJalaliDate(activeCustomer.cooperationStartDate)}
                    </span>
                  </div>
                )}
                {activeCustomer.telegramChatId && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">چت آیدی تلگرام:</span>
                    <a
                      href={
                        activeCustomer.telegramChatId.startsWith("@")
                          ? `https://t.me/${activeCustomer.telegramChatId.slice(1)}`
                          : `https://t.me/${activeCustomer.telegramChatId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      {activeCustomer.telegramChatId}
                    </a>
                  </div>
                )}
                {activeCustomer.address && (
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      آدرس پستی:
                    </span>
                    <span className="text-foreground text-[11px] leading-relaxed pr-4">
                      {activeCustomer.address}
                    </span>
                  </div>
                )}
                {activeCustomer.description && (
                  <div className="flex flex-col gap-1 py-2 border-b">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      توضیحات و یادداشت:
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed pr-4 italic">
                      {activeCustomer.description}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">عضویت از:</span>
                  <span className="text-foreground font-mono">
                    {formatJalaliDate(activeCustomer.createdAt)}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-lg bg-muted/40 border text-[11px] text-muted-foreground flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>
                      دسترسی‌های چندمستأجره (Tenant Isolation) برای این مشتری فعال است و فقط به سرویس‌ها و فاکتورهای مربوط به خود دسترسی دارد.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: SERVICES MANAGEMENT */}
        {activeTab === "services" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">لیست سرویس‌های مشتری</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  مشاهده وضعیت، اندپوینت‌های مانیتورینگ و امکان ویرایش یا ایجاد سرویس جدید
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateServiceOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                تعریف سرویس جدید برای مشتری
              </Button>
            </div>

            {servicesList.length === 0 ? (
              <Card className="rounded-xl border bg-card p-8 text-center">
                <Server className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold">هیچ سرویسی برای این مشتری ثبت نشده است</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  می‌توانید اولین سرویس هاستینگ یا زیرساختی را برای ایشان تعریف کنید
                </p>
                <Button size="sm" onClick={() => setIsCreateServiceOpen(true)}>
                  افزودن اولین سرویس
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {servicesList.map((svc: any) => {
                  const parentService =
                    svc.parentService ||
                    (allServicesData?.items || []).find((s: any) => s.id === svc.parentServiceId);

                  const matchedCategory =
                    dynamicCategories.find(
                      (c: any) =>
                        c.id === svc.serviceTypeId ||
                        c.slug === svc.serviceTypeId ||
                        c.slug === svc.serviceTypeSlug ||
                        (svc.serviceType && (c.id === svc.serviceType.id || c.slug === svc.serviceType.slug))
                    ) ||
                    svc.serviceType ||
                    parentService?.serviceType ||
                    dynamicCategories.find(
                      (c: any) =>
                        c.id === parentService?.serviceTypeId ||
                        c.slug === parentService?.serviceTypeId
                    ) ||
                    (allServicesData?.items || []).find(
                      (s: any) => s.id === svc.serviceTypeId
                    )?.serviceType;

                  const parentName = parentService?.name;
                  const categoryName = matchedCategory?.name || svc.serviceType?.name || parentService?.serviceType?.name;
                  const targetSlug = matchedCategory?.slug || svc.serviceType?.slug || parentService?.serviceType?.slug || "";

                  const catBadge = getServiceCategoryBadge(targetSlug, categoryName);
                  const CatIcon = catBadge.icon;
                  const isPackage = targetSlug === "package" || svc.quantity;
                  const details = getServiceRemainingDetails(svc);
                  const showDays = details.trackingType === "TIME" || details.trackingType === "HYBRID";
                  const showQty = details.trackingType === "QUANTITY" || details.trackingType === "HYBRID";

                  return (
                    <Card key={svc.id} className="rounded-2xl border bg-card shadow-xs overflow-hidden">
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b bg-muted/20">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <CatIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">{svc.name}</h4>
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge.className}`}
                                    >
                                      <CatIcon className="h-3 w-3" />
                                      {categoryName || catBadge.label}
                                    </span>
                                    {parentName && parentName.trim().toLowerCase() !== svc.name.trim().toLowerCase() && (
                                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                                        قالب مرجع: {parentName}
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        details.isExpired && details.trackingType !== "QUANTITY"
                                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold"
                                          : svc.status === "ACTIVE"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {details.isExpired && details.trackingType !== "QUANTITY"
                                        ? "منقضی شده"
                                        : svc.status === "ACTIVE"
                                        ? "فعال"
                                        : "معلق"}
                                    </span>
                                  </div>

                                  {/* Remaining Balance Badges & Progress */}
                                  <div className="flex flex-wrap items-center gap-3 mt-1">
                                    {/* Days Remaining (for TIME and HYBRID only) */}
                                    {showDays && (
                                      <div className="flex flex-col gap-1 min-w-[190px]">
                                        <div
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono border ${
                                            details.isExpired
                                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                              : details.urgency === "critical"
                                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                          }`}
                                        >
                                          <Clock
                                            className={`h-3.5 w-3.5 ${
                                              details.isExpired
                                                ? "text-rose-500"
                                                : details.urgency === "critical"
                                                ? "text-amber-500"
                                                : "text-blue-500"
                                            }`}
                                          />
                                          <span>
                                            {details.isExpired
                                              ? `۰ روز باقی‌مانده (منقضی شده - ${details.overdueDays?.toLocaleString("fa-IR")} روز گذشته)`
                                              : `${details.daysLeft.toLocaleString("fa-IR")} روز باقی‌مانده از ${details.daysTotal.toLocaleString("fa-IR")} روز`}
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
                                            style={{
                                              width: `${details.remainingPercent}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Quantity / Pack Consumable Remaining (for QUANTITY and HYBRID only) */}
                                    {showQty && (
                                      <div className="flex flex-col gap-1 min-w-[220px]">
                                        <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-mono">
                                            <Package className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>
                                              {details.remainingQty.toLocaleString("fa-IR")} باقی‌مانده از {details.totalQty.toLocaleString("fa-IR")} عدد
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                              ({details.usedQty.toLocaleString("fa-IR")} مصرف‌شده)
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              title="کاهش مصرف (بازگشت به موجودی)"
                                              disabled={details.usedQty <= 0 || updateServiceMutation.isPending}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateServiceMutation.mutate({
                                                  serviceId: svc.id,
                                                  data: { usedQuantity: Math.max(0, details.usedQty - 1) },
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
                                                  data: { usedQuantity: details.usedQty + 1 },
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
                                  </div>

                                  {/* Alarm, Depleted, and Warning Badges */}
                                  {details.isAlarmExceeded && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium mt-0.5 animate-pulse w-fit">
                                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                      <span>هشدار: دوره تعیین‌شده ({details.configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه ({details.daysTotal.toLocaleString("fa-IR")} روز) است</span>
                                    </span>
                                  )}
                                  {details.isQuantityDepleted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold mt-0.5 w-fit">
                                      <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                                      <span>بسته تمام شده (نیازمند تمدید سهمیه)</span>
                                    </span>
                                  )}
                                  {details.isTimeExpired && !details.isQuantityDepleted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-medium mt-0.5 w-fit">
                                      <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
                                      <span>خطا: موعد سررسید {details.overdueDays?.toLocaleString("fa-IR")} روز پیش منقضی شده است</span>
                                    </span>
                                  )}
                                  {!details.isExpired && details.isQuantityNearDepletion && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold mt-0.5 animate-pulse w-fit">
                                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                      <span>هشدار: کمتر از ۵٪ سهمیه بسته باقی‌مانده است ({details.remainingQty.toLocaleString("fa-IR")} عدد)</span>
                                    </span>
                                  )}
                                  {!details.isExpired && details.isTimeNearExpiry && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold mt-0.5 animate-pulse w-fit">
                                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                      <span>هشدار: {details.daysLeft.toLocaleString("fa-IR")} روز مانده تا پایان مهلت سرویس</span>
                                    </span>
                                  )}

                                  <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                                    شناسه: {svc.id} • سرور: {svc.server?.name || "زیرساخت ابری جیکات"} • تاریخ خرید: {formatJalaliDate(svc.purchaseDate || svc.startDate || svc.createdAt)} • سررسید تمدید: {details.trackingType === "QUANTITY" ? "بدون انقضای زمانی" : formatJalaliDate(svc.renewalDate)}
                                  </span>
                                </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">هزینه دوره:</span>
                            <span className="font-bold text-sm text-foreground font-mono">
                              {(svc.priceToman || 0) === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
                              ) : (
                                `${(svc.priceToman || 0).toLocaleString("fa-IR")} تومان`
                              )}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">
                              {(svc.trackingType || "HYBRID").toUpperCase() === "QUANTITY" ? "نوع پکیج:" : "دوره پرداخت:"}
                            </span>
                            <span className="font-semibold text-xs text-foreground">
                              {(svc.trackingType || "HYBRID").toUpperCase() === "QUANTITY"
                                ? "شارژ مصرفی / بسته اعتباری"
                                : getBillingCycleLabel(svc.billingCycle)}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">تمدید خودکار:</span>
                            {svc.autoRenew !== false ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <Repeat className="h-3 w-3" />
                                فعال
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                غیرفعال
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">
                              {(svc.trackingType || "HYBRID").toUpperCase() === "QUANTITY" ? "اعتبار زمانی:" : "تاریخ سررسید:"}
                            </span>
                            <span className="font-mono text-xs text-foreground">
                              {(svc.trackingType || "HYBRID").toUpperCase() === "QUANTITY"
                                ? "بدون انقضای زمانی"
                                : formatJalaliDate(svc.renewalDate)}
                            </span>
                          </div>
                          {/* Renew Service Button (Available for all 3 models) */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={renewServiceMutation.isPending}
                            onClick={() => renewServiceMutation.mutate(svc.id)}
                            className={`gap-1.5 font-bold cursor-pointer ${
                              details.isExpired || details.isQuantityDepleted
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 animate-pulse"
                                : details.isQuantityNearDepletion || details.isTimeNearExpiry
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border-amber-500/30"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/20"
                            }`}
                            title={`تمدید دستی سرویس ${svc.name} (شارژ مجدد و صدور فاکتور)`}
                          >
                            <Repeat className={`h-3.5 w-3.5 ${renewServiceMutation.isPending ? "animate-spin" : ""}`} />
                            {renewServiceMutation.isPending ? "در حال تمدید..." : "تمدید سرویس"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(svc);
                              setEditServiceName(svc.name);
                              setEditServicePrice(String(svc.priceToman || "0"));
                              setEditServiceQuantity(svc.quantity || 1);
                              setEditServiceUsedQuantity(svc.usedQuantity || 0);
                              setEditServiceTrackingType(svc.trackingType || "HYBRID");
                              const pDate = svc.purchaseDate || svc.startDate || svc.createdAt || new Date().toISOString();
                              const initialDays = parseBillingCycleDays(svc.billingCycle) || 30;
                              const rDate = svc.renewalDate || calcAddDays(pDate, initialDays);
                              setEditServicePurchaseDate(safeIso(pDate));
                              setEditServiceRenewalDate(safeIso(rDate));
                              setEditServiceDurationDays(initialDays);
                              setEditServiceAutoRenew(svc.autoRenew !== false);
                              setEditServiceStatus(svc.status || "ACTIVE");
                              setIsEditServiceOpen(true);
                            }}
                            className="gap-1.5"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            ویرایش سرویس
                          </Button>
                        </div>
                      </div>

                      {/* Endpoints Sub-Section */}
                    <div className="p-5 bg-card">
                      <h5 className="text-xs font-semibold text-muted-foreground mb-3.5 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        اندپوینت‌ها و وضعیت پایداری (Uptime Visibility)
                      </h5>

                      {svc.endpoints && svc.endpoints.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {svc.endpoints.map((ep: any) => (
                            <div
                              key={ep.id}
                              className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{ep.label}</span>
                                  <a
                                    href={ep.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono direction-ltr text-right"
                                  >
                                    {ep.url}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                                  {ep.uptimePercentage30d ?? 99.9}%
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {ep.responseTimeMs ?? 85}ms
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          هیچ اندپوینتی برای این سرویس تعریف نشده است.
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

        {/* TAB 3: INVOICES & PAYMENTS */}
        {activeTab === "invoices" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">صورت‌حساب‌ها و پرداخت‌ها</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  مشاهده سوابق مالی، صدور فاکتور جدید و بررسی رسیدهای تراکنش آنلاین
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="gap-2 h-9 px-4"
              >
                <Plus className="h-4 w-4" />
                صدور فاکتور جدید
              </Button>
            </div>

            {/* Invoices Table */}
            <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-sm font-semibold">لیست صورت‌حساب‌ها</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="py-4 px-5">شماره فاکتور</th>
                        <th className="py-4 px-5">مبلغ (تومان)</th>
                        <th className="py-4 px-5">وضعیت</th>
                        <th className="py-4 px-5">تاریخ صدور</th>
                        <th className="py-4 px-5">مهلت پرداخت</th>
                        <th className="py-4 px-5">رسید پرداخت</th>
                        <th className="py-4 px-5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoicesList.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-5 font-mono font-bold text-primary">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingInvoice(inv);
                                setIsViewInvoiceOpen(true);
                              }}
                              className="font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="h-4 w-4" />
                              {inv.invoiceNumber || inv.id}
                            </button>
                          </td>
                          <td className="py-4 px-5 font-semibold font-mono">
                            {(inv.totalToman || 0).toLocaleString("fa-IR")} تومان
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium ${
                                isInvoicePaid(inv)
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : isInvoiceUnpaid(inv)
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isInvoicePaid(inv)
                                ? "پرداخت شده"
                                : isInvoiceUnpaid(inv)
                                ? "پرداخت نشده"
                                : "لغو شده"}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px] text-muted-foreground">
                            {formatJalaliDate(inv.issuedAt || inv.createdAt)}
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px] text-muted-foreground">
                            {formatJalaliDate(inv.dueDate)}
                          </td>
                          <td className="py-4 px-5">
                            {inv.payment ? (
                              <div className="flex flex-col text-[10px] font-mono">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {inv.payment.provider}
                                </span>
                                <span className="text-muted-foreground">{inv.payment.gatewayRef}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewingInvoice(inv);
                                  setIsViewInvoiceOpen(true);
                                }}
                                className="text-primary hover:bg-primary/10 text-xs h-7.5 px-2.5 gap-1.5 font-medium cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                مشاهده
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditInvoice(inv)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 text-xs h-7.5 px-2.5 font-medium cursor-pointer"
                              >
                                ویرایش
                              </Button>
                              {inv.status === "UNPAID" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                                  disabled={cancelInvoiceMutation.isPending}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7.5 px-2.5 cursor-pointer"
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
                                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 text-xs h-7.5 px-2.5 font-medium cursor-pointer"
                                >
                                  فعال‌سازی
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

            {/* Payments Summary Section */}
            <Card className="rounded-2xl border bg-card shadow-xs">
              <CardHeader className="p-5 pb-3 border-b">
                <CardTitle className="text-sm font-semibold">تراکنش‌ها و رسیدهای آنلاین</CardTitle>
                <CardDescription className="text-xs">
                  رسیدهای موفق درگاه پرداخت اختصاص داده شده به مشتری
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {invoicesList.filter((inv: any) => inv.payment).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    هنوز پرداخت موفقی برای این مشتری ثبت نشده است
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {invoicesList
                      .filter((inv: any) => inv.payment)
                      .map((inv: any) => (
                        <div
                          key={inv.payment.id}
                          className="p-4 rounded-xl border bg-muted/30 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-bold block font-mono">
                                {(inv.payment.amountToman || inv.totalToman).toLocaleString("fa-IR")} تومان
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                درگاه: {inv.payment.provider} • کد رهگیری: {inv.payment.gatewayRef}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatJalaliDate(inv.payment.paidAt)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS & AUDIT LOGS */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl border bg-card shadow-xs">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-semibold">تاریخچه اعلانات و رخدادها</CardTitle>
                <CardDescription className="text-xs">
                  سوابق پیامک‌ها، ایمیل‌ها و تغییرات سیستمی مرتبط با این مشتری
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {auditLogsData?.items && auditLogsData.items.length > 0 ? (
                  <div className="divide-y divide-border text-xs">
                    {auditLogsData.items.map((log: any) => (
                      <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-semibold block text-foreground">{log.action}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                              توسط: {log.actorDisplayNameSnapshot || "سیستم"} • موجودیت: {log.entityType}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {formatJalaliDateTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>ارسال پیامک خوش‌آمدگویی و فعال‌سازی حساب کاربری</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatJalaliDate(activeCustomer.createdAt)}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span>ارسال اطلاعیه صدور صورت‌حساب دوره‌ای</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatJalaliDate(new Date())}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-xs">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-semibold">ارسال اعلان سریع به مشتری</CardTitle>
                <CardDescription className="text-xs">
                  ارسال پیامک اطلاع‌رسانی یا ایمیل از طریق صف BullMQ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <form onSubmit={handleSendNotificationSubmit} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">نوع ارسال</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNotificationType("SMS")}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          notificationType === "SMS"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        پیامک (SMS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationType("EMAIL")}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          notificationType === "EMAIL"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        ایمیل (Email)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">قالب پیام</Label>
                    <select
                      value={notificationTemplate}
                      onChange={(e) => setNotificationTemplate(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                      <option value="renewal_reminder">یادآوری تمدید سرویس</option>
                      <option value="invoice_created">اطلاع‌رسانی صدور فاکتور جدید</option>
                      <option value="service_alert">هشدار فنی / وضعیت سرویس</option>
                      <option value="custom_notice">پیام دلخواه و عمومی</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">متن / یادداشت همراه پیام</Label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={3}
                      placeholder="متن دلخواه خود را در صورت تمایل بنویسید..."
                      className="w-full rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendNotificationMutation.isPending}
                    className="w-full gap-2 h-10 mt-2 font-semibold"
                  >
                    <Send className="h-4 w-4" />
                    {sendNotificationMutation.isPending ? "در حال قرار دادن در صف..." : "ارسال پیام"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
          </div>

          {/* Blur Deactivated Overlay */}
          {activeCustomer.status === "INACTIVE" && (
            <div key="customer-inactive-overlay" className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 sm:pt-24 bg-background/25 backdrop-blur-xs rounded-3xl p-4 sm:p-6 pointer-events-auto">
              <div className="sticky top-28 max-w-md w-full bg-card/95 border-2 border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-inner">
                  <Ban className="h-8 w-8 stroke-[2.2]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">
                    حساب کاربری این مشتری غیرفعال است
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    تمامی خدمات، دسترسی‌ها و فرآیندهای مالی این مشتری در وضعیت تعلیق قرار گرفته‌اند و اطلاعات برای امنیت در حالت محو (Blur) نمایش داده می‌شوند.
                  </p>
                </div>
                <Button
                  key="btn-reactivate-overlay"
                  onClick={() => toggleCustomerStatusMutation.mutate("ACTIVE")}
                  disabled={toggleCustomerStatusMutation.isPending}
                  className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md py-2.5 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {toggleCustomerStatusMutation.isPending ? "در حال فعال‌سازی..." : "فعال‌سازی مجدد حساب مشتری"}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: ASSIGN CREATED SERVICE TO CUSTOMER */}
        {isCreateServiceOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !createServiceMutation.isPending) setIsCreateServiceOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">تخصیص سرویس به {activeCustomer.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      انتخاب از میان سرویس‌های تعریف‌شده در کاتالوگ
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateServiceOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {catalogServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 gap-3 my-2">
                  <div className="p-3 rounded-full bg-muted text-muted-foreground">
                    <Server className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">هنوز هیچ سرویسی در سامانه تعریف نشده است</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      برای تخصیص سرویس به این مشتری، ابتدا باید از بخش سرویس‌ها یک سرویس تعریف نمایید.
                    </p>
                  </div>
                  <Link to="/services">
                    <Button size="sm" className="mt-2 gap-1.5">
                      <Plus className="h-4 w-4" />
                      تعریف سرویس جدید در سامانه
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreateServiceSubmit} className="flex flex-col gap-4 mt-4">
                  {/* Service Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">انتخاب سرویس تعریف‌شده *</Label>
                    <select
                      value={activeSelectedService?.id || ""}
                      onChange={(e) => setSelectedCatalogServiceId(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                      required
                    >
                      {catalogServices.map((svc: any) => {
                        const badge = getServiceCategoryBadge(svc.categorySlug, svc.categoryName || svc.name);
                        return (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} ({badge.label})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Name field for this customer */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">نام / عنوان سرویس برای این مشتری *</Label>
                    <Input
                      value={serviceCustomName}
                      onChange={(e) => setServiceCustomName(e.target.value)}
                      placeholder={activeSelectedService?.name || "مثال: هاست وب‌سایت اصلی شرکت"}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      نامی که برای این مشترک نمایش داده می‌شود. می‌توانید عنوان دلخواه بنویسید یا همان نام کاتالوگ را حفظ کنید.
                    </p>
                  </div>

                  {/* Selected Service Information Card */}
                  {activeSelectedService && (
                    <div className="p-3 rounded-xl border bg-muted/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground">{activeSelectedService.name}</span>
                        {(() => {
                          const badge = getServiceCategoryBadge(activeSelectedService.categorySlug, activeSelectedService.categoryName || activeSelectedService.name);
                          const BadgeIcon = badge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      {activeSelectedService.description && (
                        <p className="text-muted-foreground text-[11px]">
                          {activeSelectedService.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Tracking Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مدل ردگیری و مصرف سرویس *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "HYBRID" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("HYBRID")}
                        className={`text-xs h-8 cursor-pointer rounded-xl ${
                          serviceTrackingType === "HYBRID" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                        }`}
                      >
                        ترکیبی (هر دو)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "TIME" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("TIME")}
                        className={`text-xs h-8 cursor-pointer rounded-xl ${
                          serviceTrackingType === "TIME" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                        }`}
                      >
                        زمان (فقط زمان)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={serviceTrackingType === "QUANTITY" ? "default" : "outline"}
                        onClick={() => setServiceTrackingType("QUANTITY")}
                        className={`text-xs h-8 cursor-pointer rounded-xl ${
                          serviceTrackingType === "QUANTITY" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                        }`}
                      >
                        تعداد (فقط تعداد)
                      </Button>
                    </div>
                  </div>

                  {/* 4. Tracking Parameters: Price, Duration, Quantity */}
                  {serviceTrackingType === "TIME" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">هزینه دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePrice)}
                          onChange={(e) => setServicePrice(parsePriceInput(e.target.value))}
                          placeholder="0"
                          className="font-mono text-left"
                          required
                        />
                        {Number(servicePrice) > 0 && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            معادل: {Number(servicePrice).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={serviceDurationDays}
                            onChange={(e) => handleAssignDurationChange(Number(e.target.value))}
                            placeholder="مثال: 30"
                            className="pl-12 font-mono"
                            required
                          />
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                            روز
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {serviceTrackingType === "QUANTITY" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">مبلغ کل بسته (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePrice)}
                          onChange={(e) => setServicePrice(parsePriceInput(e.target.value))}
                          placeholder="0"
                          className="font-mono text-left"
                          required
                        />
                        {Number(servicePrice) > 0 && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            معادل: {Number(servicePrice).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">تعداد ظرفیت / پکیج اولیه (عدد) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Math.max(1, Number(e.target.value)))}
                          placeholder="مثال: 5000"
                          className="font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {serviceTrackingType === "HYBRID" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">هزینه دوره (تومان) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={formatPriceInput(servicePrice)}
                          onChange={(e) => setServicePrice(parsePriceInput(e.target.value))}
                          placeholder="0"
                          className="font-mono text-left"
                          required
                        />
                        {Number(servicePrice) > 0 && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            معادل: {Number(servicePrice).toLocaleString("fa-IR")} تومان
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">مدت اعتبار (روز) *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={serviceDurationDays}
                            onChange={(e) => handleAssignDurationChange(Number(e.target.value))}
                            placeholder="مثال: 30"
                            className="pl-12 font-mono"
                            required
                          />
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                            روز
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">ظرفیت پکیج (عدد) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Math.max(1, Number(e.target.value)))}
                          placeholder="مثال: 1000"
                          className="font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. Dates (Only for TIME and HYBRID) */}
                  {serviceTrackingType !== "QUANTITY" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <JalaliDatePicker
                            label="تاریخ شروع / خرید (شمسی) *"
                            value={servicePurchaseDate}
                            onChange={handleAssignPurchaseDateChange}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <JalaliDatePicker
                            label="تاریخ سررسید تمدید (شمسی) *"
                            value={newServiceRenewalDate}
                            onChange={handleAssignRenewalDateChange}
                          />
                        </div>
                      </div>

                      {/* Live Span & Alarm indicator */}
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">بازه زمانی کلی سررسید (از تاریخ شروع تا سررسید):</span>
                          <span className="font-bold text-foreground font-mono">
                            {assignSpanDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">دوره تعیین‌شده برای سرویس:</span>
                          <span className="font-bold text-foreground font-mono">
                            {serviceDurationDays.toLocaleString("fa-IR")} روز
                          </span>
                        </div>

                        {/* Negative Range Error */}
                        {assignRangeAnalysis.isNegativeRange && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold mt-1">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد!
                            </span>
                          </div>
                        )}

                        {/* Expired / Past Date Notice */}
                        {!assignRangeAnalysis.isNegativeRange && assignRangeAnalysis.isExpired && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-medium mt-1">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                            <span>
                              توجه: تاریخ سررسید در گذشته است ({assignRangeAnalysis.overdueDays.toLocaleString("fa-IR")} روز معوقه). این سرویس با وضعیت منقضی‌شده (۰ روز باقی‌مانده) ثبت خواهد شد.
                            </span>
                          </div>
                        )}

                        {/* Inconsistency Warning: Cycle > Span */}
                        {!assignRangeAnalysis.isNegativeRange && isAssignAlarmExceeded && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium animate-pulse mt-1">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>
                                هشدار: دوره تعیین‌شده ({serviceDurationDays.toLocaleString("fa-IR")} روز) از بازه سررسید ({assignSpanDays.toLocaleString("fa-IR")} روز) بیشتر است!
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

                  {/* Auto-renew checkbox (for ALL models: TIME, QUANTITY & HYBRID) */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={serviceAutoRenew}
                      onChange={(e) => setServiceAutoRenew(e.target.checked)}
                      className="rounded h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">تمدید خودکار سرویس</span>
                      <span className="text-[11px] text-muted-foreground">
                        {serviceTrackingType === "QUANTITY"
                          ? "پس از پایان یافتن سهمیه بسته، صورت‌حساب شارژ مجدد به صورت اتوماتیک صادر شود"
                          : "در تاریخ سررسید، صورت‌حساب تمدید به صورت اتوماتیک صادر شود"}
                      </span>
                    </div>
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateServiceOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      disabled={createServiceMutation.isPending || (serviceTrackingType !== "QUANTITY" && assignRangeAnalysis.isNegativeRange)}
                    >
                      {createServiceMutation.isPending ? "در حال تخصیص..." : "تخصیص سرویس به مشتری"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: EDIT SERVICE */}
      {isEditServiceOpen && selectedService && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !updateServiceMutation.isPending) setIsEditServiceOpen(false);
            }}
          >
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Edit className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش سرویس {selectedService.name}</h3>
                    <p className="text-xs text-muted-foreground">تغییر هزینه دوره، تمدید خودکار و تنظیمات</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditServiceOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditServiceSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان سرویس *</Label>
                  <Input
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    required
                  />
                </div>

                {/* Tracking Mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">مدل ردگیری و مصرف سرویس *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={editServiceTrackingType === "HYBRID" ? "default" : "outline"}
                      onClick={() => setEditServiceTrackingType("HYBRID")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editServiceTrackingType === "HYBRID" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      ترکیبی (هر دو)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editServiceTrackingType === "TIME" ? "default" : "outline"}
                      onClick={() => setEditServiceTrackingType("TIME")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editServiceTrackingType === "TIME" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      زمان (فقط زمان)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editServiceTrackingType === "QUANTITY" ? "default" : "outline"}
                      onClick={() => setEditServiceTrackingType("QUANTITY")}
                      className={`text-xs h-8 cursor-pointer rounded-xl ${
                        editServiceTrackingType === "QUANTITY" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                      }`}
                    >
                      تعداد (فقط تعداد)
                    </Button>
                  </div>
                </div>

                {/* Price and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {editServiceTrackingType === "QUANTITY" ? "مبلغ کل بسته (تومان)" : "هزینه دوره (تومان)"}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={formatPriceInput(editServicePrice)}
                      onChange={(e) => setEditServicePrice(parsePriceInput(e.target.value))}
                      placeholder="0"
                      className="font-mono text-left"
                    />
                    {Number(editServicePrice) > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        معادل: {Number(editServicePrice).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">وضعیت سرویس</Label>
                    <select
                      value={editServiceStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (newStatus === "INACTIVE" || newStatus === "SUSPENDED") {
                          setConfirmDeactivateModal({
                            isOpen: true,
                            nextStatus: newStatus,
                          });
                          return;
                        }
                        setEditServiceStatus(newStatus);
                      }}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                    >
                      <option value="ACTIVE">فعال (ACTIVE)</option>
                      <option value="SUSPENDED">معلق (SUSPENDED)</option>
                      <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                    </select>
                  </div>
                </div>

                {/* TIME conditional fields */}
                {editServiceTrackingType === "TIME" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">دوره سرویس (تعداد روز) *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          value={editServiceDurationDays}
                          onChange={(e) => handleEditServiceDurationChange(Number(e.target.value))}
                          placeholder="مثال: 30"
                          className="pl-12 font-mono h-10 text-xs"
                          required
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                          روز
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <JalaliDatePicker
                        label="تاریخ سررسید تمدید"
                        value={editServiceRenewalDate}
                        onChange={handleEditServiceRenewalDateChange}
                      />
                    </div>
                  </div>
                )}

                {/* QUANTITY conditional fields */}
                {editServiceTrackingType === "QUANTITY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">تعداد کل ظرفیت پکیج (عدد) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editServiceQuantity}
                        onChange={(e) => setEditServiceQuantity(Math.max(1, Number(e.target.value)))}
                        className="font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">تعداد مصرف‌شده تا الان</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editServiceUsedQuantity}
                        onChange={(e) => setEditServiceUsedQuantity(Math.max(0, Number(e.target.value)))}
                        className="font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        باقی‌مانده: {Math.max(0, editServiceQuantity - editServiceUsedQuantity).toLocaleString("fa-IR")} عدد
                      </p>
                    </div>
                  </div>
                )}

                {editServiceTrackingType === "HYBRID" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">دوره سرویس (تعداد روز) *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={editServiceDurationDays}
                            onChange={(e) => handleEditServiceDurationChange(Number(e.target.value))}
                            placeholder="مثال: 30"
                            className="pl-12 font-mono h-10 text-xs"
                            required
                          />
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                            روز
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <JalaliDatePicker
                          label="تاریخ سررسید تمدید"
                          value={editServiceRenewalDate}
                          onChange={handleEditServiceRenewalDateChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">تعداد کل ظرفیت پکیج (عدد) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editServiceQuantity}
                          onChange={(e) => setEditServiceQuantity(Math.max(1, Number(e.target.value)))}
                          className="font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">تعداد مصرف‌شده تا الان</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editServiceUsedQuantity}
                          onChange={(e) => setEditServiceUsedQuantity(Math.max(0, Number(e.target.value)))}
                          className="font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          باقی‌مانده: {Math.max(0, editServiceQuantity - editServiceUsedQuantity).toLocaleString("fa-IR")} عدد
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {editServiceTrackingType !== "QUANTITY" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <JalaliDatePicker
                        label="تاریخ خرید / شروع سرویس (شمسی)"
                        value={editServicePurchaseDate}
                        onChange={(val) => handleEditServicePurchaseDateChange(val)}
                      />
                    </div>

                    {/* Live Span & Alarm indicator for Edit Service */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">بازه زمانی کلی سررسید (از تاریخ شروع تا سررسید):</span>
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

                      {/* Negative Range Error */}
                      {editServiceRangeAnalysis.isNegativeRange && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold mt-1">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>
                            خطای بازه تاریخی: تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد!
                          </span>
                        </div>
                      )}

                      {/* Expired / Past Date Notice */}
                      {!editServiceRangeAnalysis.isNegativeRange && editServiceRangeAnalysis.isExpired && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-medium mt-1">
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>
                            توجه: تاریخ سررسید در گذشته است ({editServiceRangeAnalysis.overdueDays.toLocaleString("fa-IR")} روز معوقه). این سرویس با وضعیت منقضی‌شده (۰ روز باقی‌مانده) ذخیره خواهد شد.
                          </span>
                        </div>
                      )}

                      {/* Inconsistency Warning: Cycle > Span */}
                      {!editServiceRangeAnalysis.isNegativeRange && isEditServiceAlarmExceeded && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium animate-pulse mt-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>
                              هشدار: دوره تعیین‌شده ({editServiceDurationDays.toLocaleString("fa-IR")} روز) از بازه سررسید ({editServiceSpanDays.toLocaleString("fa-IR")} روز) بیشتر است!
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditServiceDurationChange(editServiceSpanDays)}
                            className="text-[11px] underline text-amber-800 dark:text-amber-200 font-bold hover:text-amber-900 cursor-pointer shrink-0"
                          >
                            تطبیق دوره با بازه
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={editServiceAutoRenew}
                    onChange={(e) => setEditServiceAutoRenew(e.target.checked)}
                    className="rounded h-4 w-4 text-primary cursor-pointer"
                  />
                  <span className="text-xs font-semibold">تمدید خودکار سرویس فعال باشد</span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditServiceOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateServiceMutation.isPending || (editServiceTrackingType !== "QUANTITY" && editServiceRangeAnalysis.isNegativeRange)}
                  >
                    {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}


        {/* MODAL 3: CREATE INVOICE */}
        {isCreateInvoiceOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !createInvoiceMutation.isPending) setIsCreateInvoiceOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">صدور فاکتور جدید برای {activeCustomer.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateInvoiceOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شرح / عنوان آیتم فاکتور *</Label>
                  <Input
                    value={invoiceItemTitle}
                    onChange={(e) => setInvoiceItemTitle(e.target.value)}
                    placeholder="مثال: هزینه تمدید سالانه هاست اختصاصی و پشتیبانی"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مبلغ کل (تومان) *</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={formatPriceInput(invoiceItemAmount)}
                      onChange={(e) => setInvoiceItemAmount(parsePriceInput(e.target.value))}
                      placeholder="0"
                      className="font-mono text-left"
                      required
                    />
                    {Number(invoiceItemAmount) > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        معادل: {Number(invoiceItemAmount).toLocaleString("fa-IR")} تومان
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <JalaliDatePicker
                      label="مهلت پرداخت"
                      value={invoiceDueDate}
                      onChange={(val) => setInvoiceDueDate(val)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateInvoiceOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending ? "در حال صدور..." : "صدور صورت‌حساب"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

        {/* MODAL 4: INVOICE DETAILS MODAL */}
        <InvoiceDetailModal
          invoice={viewingInvoice}
          isOpen={isViewInvoiceOpen}
          onClose={() => {
            setIsViewInvoiceOpen(false);
            setViewingInvoice(null);
          }}
          onEdit={(inv) => handleOpenEditInvoice(inv)}
          onCancel={(invId) => cancelInvoiceMutation.mutate(invId)}
          onReactivate={(invId) => reactivateInvoiceMutation.mutate(invId)}
        />

        {/* MODAL 4.5: EDIT INVOICE MODAL */}
        {isEditInvoiceOpen && editingInvoice && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !updateInvoiceMutation.isPending) setIsEditInvoiceOpen(false);
              }}
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">ویرایش فاکتور {editingInvoice.invoiceNumber || editingInvoice.id}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      مشتری: {customer?.name || "نامشخص"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditInvoiceOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleEditInvoiceSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cust_etitle" className="text-xs font-semibold">
                    شرح خدمت یا عنوان ردیف فاکتور *
                  </Label>
                  <Input
                    id="cust_etitle"
                    value={editInvoiceTitle}
                    onChange={(e) => setEditInvoiceTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cust_eamount" className="text-xs font-semibold">
                      مبلغ کل (تومان) *
                    </Label>
                    <Input
                      id="cust_eamount"
                      type="number"
                      value={editInvoiceAmount}
                      onChange={(e) => setEditInvoiceAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust_edays" className="text-xs font-semibold">
                      مهلت پرداخت از امروز (روز)
                    </Label>
                    <Input
                      id="cust_edays"
                      type="number"
                      value={editInvoiceDueDays}
                      onChange={(e) => setEditInvoiceDueDays(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust_enotes" className="text-xs font-semibold">
                    یادداشت و توضیحات فاکتور
                  </Label>
                  <Input
                    id="cust_enotes"
                    value={editInvoiceNotes}
                    onChange={(e) => setEditInvoiceNotes(e.target.value)}
                    placeholder="توضیحات اختیاری درباره فاکتور"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust_estatus" className="text-xs font-semibold">
                    وضعیت فاکتور
                  </Label>
                  <select
                    id="cust_estatus"
                    value={editInvoiceStatus}
                    onChange={(e) => setEditInvoiceStatus(e.target.value)}
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
                    onClick={() => setIsEditInvoiceOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateInvoiceMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {updateInvoiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

        {/* MODAL 5: DELETE CUSTOMER MODAL */}
        {isDeleteCustomerOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !deleteCustomerMutation.isPending) setIsDeleteCustomerOpen(false);
              }}
            >
              <div className="relative w-full max-w-md m-auto rounded-2xl border border-rose-500/20 bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">حذف کامل پرونده مشتری</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{customer?.name}</p>
                  </div>
                </div>

                <div className="py-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    آیا از حذف پرونده مشترک <strong className="text-foreground font-semibold">{customer?.name}</strong> اطمینان دارید؟
                  </p>
                  <p className="text-rose-500/90 font-medium">
                    هشدار: با انجام این عملیات، تمامی سرویس‌های تخصیص‌یافته، صورت‌حساب‌ها و سوابق ثبت‌شده برای این مشتری از سیستم پاکسازی خواهند شد. این فرآیند غیرقابل بازگشت است.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteCustomerOpen(false)}
                    disabled={deleteCustomerMutation.isPending}
                    className="rounded-xl text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCustomerMutation.mutate()}
                    disabled={deleteCustomerMutation.isPending}
                    className="rounded-xl text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteCustomerMutation.isPending ? "در حال حذف..." : "تأیید و حذف مشتری"}
                  </Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Confirm Modal for Deactivating / Suspending Customer Service */}
        {confirmDeactivateModal && (
          <ConfirmModal
            isOpen={confirmDeactivateModal.isOpen}
            onClose={() => setConfirmDeactivateModal(null)}
            onConfirm={() => {
              setEditServiceStatus(confirmDeactivateModal.nextStatus);
              setConfirmDeactivateModal(null);
            }}
            title="تأیید غیرفعال‌سازی / تعلیق سرویس"
            description={
              <div className="space-y-2 text-xs">
                <p>
                  آیا از غیرفعال‌سازی سرویس <strong className="text-foreground font-semibold">«{selectedService?.name}»</strong> متعلق به مشتری <strong className="text-foreground font-semibold">«{activeCustomer.name}»</strong> اطمینان دارید؟
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  توجه: با تغییر وضعیت به {confirmDeactivateModal.nextStatus === "SUSPENDED" ? "معلق" : "غیرفعال"}، دسترسی مشتری به امکانات این سرویس موقتاً مسدود می‌گردد.
                </p>
              </div>
            }
            confirmText="بله، تغییر وضعیت اعمال شود"
            variant="warning"
          />
        )}
      </div>
    </AppShell>
  );
}
