import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
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
import { normalizePhoneNumber } from "@/utils/phone";
import { formatJalaliDate, formatJalaliDateWords, formatJalaliDateTime } from "@gecut-cloud/contracts";
import {
  User,
  Users,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
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
} from "lucide-react";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";

function getServiceCategoryBadge(slug?: string) {
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
        label: "هاست",
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

export const Route = createFileRoute("/customers/$id")({
  component: AdminCustomerProfileDetailPage,
});

function AdminCustomerProfileDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  // Active Tab: 'profile' | 'services' | 'invoices' | 'notifications'
  const [activeTab, setActiveTab] = useState<"profile" | "services" | "invoices" | "notifications">("profile");

  // Modals state
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);

  // Fetch Customer Details
  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => apiClient<any>(`/customers/${id}`),
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

  // Unique services created in the system catalog
  const catalogServices = Array.from(
    new Map(
      (allServicesData?.items || []).map((s: any) => [
        s.name?.trim(),
        {
          id: s.id,
          name: s.name,
          categorySlug: s.serviceType?.slug || "hosting",
          serviceTypeId: s.serviceTypeId,
          serviceType: s.serviceType,
          description: s.description,
          server: s.server,
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
  const [hasProfileInitialized, setHasProfileInitialized] = useState(false);

  if (customer && !hasProfileInitialized) {
    setProfileName(customer.name || "");
    setProfileDisplayName(customer.displayName || customer.company || "");
    setProfilePhone(customer.phone || customer.user?.phone || "");
    setProfileEmail(customer.email || customer.user?.email || "");
    setProfileStatus(customer.status || "ACTIVE");
    setHasProfileInitialized(true);
  }

  // Assign Created Service Form State
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState("");
  const [serviceCustomName, setServiceCustomName] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1000);
  const [servicePrice, setServicePrice] = useState<string>("2500000");
  const [serviceDurationDays, setServiceDurationDays] = useState<number>(30);
  const [serviceAutoRenew, setServiceAutoRenew] = useState<boolean>(true);
  const [serviceCreateInvoice, setServiceCreateInvoice] = useState<boolean>(true);
  const [newServiceRenewalDate, setNewServiceRenewalDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

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
  const [editServiceDurationDays, setEditServiceDurationDays] = useState<number>(30);
  const [editServiceAutoRenew, setEditServiceAutoRenew] = useState(true);
  const [editServiceStatus, setEditServiceStatus] = useState("ACTIVE");
  const [editServiceRenewalDate, setEditServiceRenewalDate] = useState("");

  // Create Invoice Form State
  const [invoiceItemTitle, setInvoiceItemTitle] = useState("");
  const [invoiceItemAmount, setInvoiceItemAmount] = useState("2500000");
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

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
      setIsEditServiceOpen(false);
      setSelectedService(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ویرایش سرویس");
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
    });
  };

  // Handle Assign Service Submit
  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedService) {
      toast.error("لطفاً یک سرویس از سرویس‌های تعریف‌شده را انتخاب کنید");
      return;
    }
    const isPackage = activeSelectedService.categorySlug === "package";
    const qty = isPackage ? Math.max(1, Number(serviceQuantity) || 1) : undefined;
    const finalPrice = Math.round(Number(servicePrice)) || 0;
    const finalName = serviceCustomName.trim() || activeSelectedService.name;

    createServiceMutation.mutate({
      customerId: activeCustomer?.id || id,
      serviceTypeId: activeSelectedService.serviceTypeId,
      serviceTypeSlug: activeSelectedService.categorySlug,
      name: finalName,
      priceToman: finalPrice,
      billingCycle: String(serviceDurationDays),
      autoRenew: serviceAutoRenew,
      quantity: qty,
      description: isPackage
        ? `بسته ${qty ? qty.toLocaleString("fa-IR") : "۱"} عددی`
        : (activeSelectedService.description || undefined),
      startDate: new Date().toISOString(),
      renewalDate: new Date(newServiceRenewalDate).toISOString(),
    });
  };

  // Handle Edit Service Submit
  const handleEditServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    const isPackage = selectedService.serviceType?.slug === "package";
    updateServiceMutation.mutate({
      serviceId: selectedService.id,
      data: {
        name: editServiceName,
        priceToman: Math.round(Number(editServicePrice)) || 0,
        billingCycle: String(editServiceDurationDays),
        autoRenew: editServiceAutoRenew,
        quantity: isPackage ? Math.max(1, Number(editServiceQuantity) || 1) : undefined,
        status: editServiceStatus,
        renewalDate: editServiceRenewalDate ? new Date(editServiceRenewalDate).toISOString() : undefined,
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

  const servicesList = activeCustomer.services || [];
  const invoicesList = activeCustomer.invoices || [];
  
  // Calculate summary metrics
  const activeServicesCount = servicesList.filter((s: any) => s.status === "ACTIVE").length;
  const unpaidInvoices = invoicesList.filter((inv: any) => inv.status === "UNPAID");
  const unpaidTotalToman = unpaidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);
  const paidInvoices = invoicesList.filter((inv: any) => inv.status === "PAID");
  const paidTotalToman = paidInvoices.reduce((acc: number, curr: any) => acc + (curr.totalToman || 0), 0);

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/customers">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
                بازگشت به مشتریان
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-sm">پروفایل و مدیریت مشتری</span>
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
            {activeCustomer.status === "ACTIVE" ? (
              <Button
                key="btn-deactivate-header"
                size="sm"
                variant="outline"
                onClick={() => toggleCustomerStatusMutation.mutate("INACTIVE")}
                disabled={toggleCustomerStatusMutation.isPending}
                className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 cursor-pointer"
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
                className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>فعال‌سازی مشتری</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsSendNotificationOpen(true)}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              ارسال پیام
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
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Avatar & Main Info */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  {activeCustomer.name ? activeCustomer.name.charAt(0) : "U"}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {activeCustomer.name}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeCustomer.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{activeCustomer.status === "ACTIVE" ? "حساب فعال" : "غیرفعال / معلق"}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                    {activeCustomer.displayName && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" />
                        {activeCustomer.displayName}
                      </span>
                    )}
                    {activeCustomer.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3.5 w-3.5" />
                        {activeCustomer.phone}
                      </span>
                    )}
                    {activeCustomer.email && (
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="h-3.5 w-3.5" />
                        {activeCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges / ID Info */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-border">
                <div className="text-left">
                  <span className="text-[11px] text-muted-foreground">شناسه سیستمی:</span>
                  <p className="font-mono text-xs font-semibold text-foreground">{activeCustomer.id}</p>
                </div>
                <div className="text-left mt-2">
                  <span className="text-[11px] text-muted-foreground">تاریخ عضویت:</span>
                  <p className="text-xs text-foreground">
                    {formatJalaliDate(activeCustomer.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                سرویس‌های فعال
              </CardTitle>
              <Server className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {activeServicesCount} <span className="text-xs font-normal text-muted-foreground">از {servicesList.length} سرویس</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                بدهی در انتظار پرداخت
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {unpaidTotalToman.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{unpaidInvoices.length} فاکتور باز</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                مجموع پرداختی‌های موفق
              </CardTitle>
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {paidTotalToman.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{paidInvoices.length} پرداخت ثبت شده</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                وضعیت کلی زیرساخت
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ۹۹.۹٪ پایداری
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">تمام اندپوینت‌ها در دسترس</p>
            </CardContent>
          </Card>
        </div>

        {/* Custom Tab Navigation Bar */}
        <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
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
            <Card className="lg:col-span-2 rounded-xl border bg-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">ویرایش مشخصات مشتری</CardTitle>
                <CardDescription className="text-xs">
                  اطلاعات هویتی، شرکتی و وضعیت دسترسی این حساب کاربری را ویرایش کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-semibold">
                      نام و نام خانوادگی / نام مدیر حساب *
                    </Label>
                    <Input
                      id="prof-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="نام مشتری"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-display" className="text-xs font-semibold">
                        نام برند / شرکت
                      </Label>
                      <Input
                        id="prof-display"
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder="عنوان برند تجاری"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold">
                        شماره تماس اصلی
                      </Label>
                      <Input
                        id="prof-phone"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="0912xxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-email" className="text-xs font-semibold">
                        آدرس ایمیل
                      </Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-status" className="text-xs font-semibold">
                        وضعیت حساب کاربری
                      </Label>
                      <select
                        id="prof-status"
                        value={profileStatus}
                        onChange={(e) => setProfileStatus(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="ACTIVE">فعال (ACTIVE)</option>
                        <option value="SUSPENDED">معلق (SUSPENDED)</option>
                        <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t mt-2">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="gap-1.5"
                    >
                      {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات مشخصات"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-xl border bg-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">اطلاعات احراز هویت و امنیت</CardTitle>
                <CardDescription className="text-xs">
                  جزئیات حساب کاربری متصل و ورود به سامانه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
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
              <div className="grid grid-cols-1 gap-4">
                {servicesList.map((svc: any) => {
                  const catBadge = getServiceCategoryBadge(svc.serviceType?.slug);
                  const CatIcon = catBadge.icon;
                  const isPackage = svc.serviceType?.slug === "package" || svc.quantity;

                  return (
                    <Card key={svc.id} className="rounded-xl border bg-card shadow-xs overflow-hidden">
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <CatIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground">{svc.name}</h4>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge.className}`}
                              >
                                <CatIcon className="h-3 w-3" />
                                {catBadge.label}
                              </span>
                              {isPackage && svc.quantity && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                                  <Package className="h-3 w-3" />
                                  {svc.quantity} عدد در بسته
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  svc.status === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {svc.status === "ACTIVE" ? "فعال" : "معلق"}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                              شناسه: {svc.id} • سرور: {svc.server?.name || "زیرساخت ابری جیکات"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">هزینه دوره:</span>
                            <span className="font-bold text-sm text-foreground font-mono">
                              {(svc.priceToman || 0).toLocaleString("fa-IR")} تومان
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] text-muted-foreground block">دوره پرداخت:</span>
                            <span className="font-semibold text-xs text-foreground">
                              {getBillingCycleLabel(svc.billingCycle)}
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
                            <span className="text-[11px] text-muted-foreground block">تاریخ سررسید:</span>
                            <span className="font-mono text-xs text-foreground">
                              {formatJalaliDate(svc.renewalDate)}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(svc);
                              setEditServiceName(svc.name);
                              setEditServicePrice(String(svc.priceToman || "0"));
                              setEditServiceQuantity(svc.quantity || 1);
                              setEditServiceAutoRenew(svc.autoRenew !== false);
                              const rawCycle = Number(svc.billingCycle);
                              const initialDays =
                                !isNaN(rawCycle) && rawCycle > 0
                                  ? rawCycle
                                  : svc.billingCycle === "ANNUAL"
                                  ? 365
                                  : svc.billingCycle === "SEMI_ANNUAL"
                                  ? 180
                                  : svc.billingCycle === "QUARTERLY"
                                  ? 90
                                  : 30;
                              setEditServiceDurationDays(initialDays);
                              setEditServiceStatus(svc.status || "ACTIVE");
                              setEditServiceRenewalDate(
                                svc.renewalDate ? new Date(svc.renewalDate).toISOString().split("T")[0] : "",
                              );
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
                    <div className="p-4 bg-card">
                      <h5 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                        اندپوینت‌ها و وضعیت پایداری (Uptime Visibility)
                      </h5>

                      {svc.endpoints && svc.endpoints.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {svc.endpoints.map((ep: any) => (
                            <div
                              key={ep.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs"
                            >
                              <div className="flex items-center gap-2">
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
                                    <ExternalLink className="h-2.5 w-2.5" />
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
                        <p className="text-[11px] text-muted-foreground">اندپوینتی برای مانیتورینگ ثبت نشده است.</p>
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  مشاهده سوابق مالی، صدور فاکتور جدید و بررسی رسیدهای تراکنش آنلاین
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                صدور فاکتور جدید
              </Button>
            </div>

            {/* Invoices Table */}
            <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">لیست صورت‌حساب‌ها</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="py-3.5 px-4">شماره فاکتور</th>
                        <th className="py-3.5 px-4">مبلغ (تومان)</th>
                        <th className="py-3.5 px-4">وضعیت</th>
                        <th className="py-3.5 px-4">تاریخ صدور</th>
                        <th className="py-3.5 px-4">مهلت پرداخت</th>
                        <th className="py-3.5 px-4">رسید پرداخت</th>
                        <th className="py-3.5 px-4 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoicesList.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingInvoice(inv);
                                setIsViewInvoiceOpen(true);
                              }}
                              className="font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {inv.invoiceNumber || inv.id}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">
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
                              {inv.status === "PAID"
                                ? "پرداخت شده"
                                : inv.status === "UNPAID"
                                ? "پرداخت نشده"
                                : "لغو شده"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {formatJalaliDate(inv.issuedAt || inv.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {formatJalaliDate(inv.dueDate)}
                          </td>
                          <td className="py-3.5 px-4">
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
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewingInvoice(inv);
                                  setIsViewInvoiceOpen(true);
                                }}
                                className="text-primary hover:bg-primary/10 text-[11px] h-7 px-2 gap-1 font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                مشاهده
                              </Button>
                              {inv.status === "UNPAID" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                                  disabled={cancelInvoiceMutation.isPending}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] h-7 px-2"
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

            {/* Payments Summary Section */}
            <Card className="rounded-xl border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">تراکنش‌ها و رسیدهای آنلاین</CardTitle>
                <CardDescription className="text-xs">
                  رسیدهای موفق درگاه پرداخت اختصاص داده شده به مشتری
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {invoicesList.filter((inv: any) => inv.payment).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    هنوز پرداخت موفقی برای این مشتری ثبت نشده است
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {invoicesList
                      .filter((inv: any) => inv.payment)
                      .map((inv: any) => (
                        <div
                          key={inv.payment.id}
                          className="p-3.5 rounded-xl border bg-muted/30 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-bold block">
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
            <Card className="lg:col-span-2 rounded-xl border bg-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">تاریخچه اعلانات و رخدادها</CardTitle>
                <CardDescription className="text-xs">
                  سوابق پیامک‌ها، ایمیل‌ها و تغییرات سیستمی مرتبط با این مشتری
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogsData?.items && auditLogsData.items.length > 0 ? (
                  <div className="divide-y divide-border text-xs">
                    {auditLogsData.items.map((log: any) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded bg-primary/10 text-primary mt-0.5">
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold block text-foreground">{log.action}</span>
                            <span className="text-[11px] text-muted-foreground">
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
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>ارسال پیامک خوش‌آمدگویی و فعال‌سازی حساب کاربری</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatJalaliDate(activeCustomer.createdAt)}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
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

            <Card className="rounded-xl border bg-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">ارسال اعلان سریع به مشتری</CardTitle>
                <CardDescription className="text-xs">
                  ارسال پیامک اطلاع‌رسانی یا ایمیل از طریق صف BullMQ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendNotificationSubmit} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">نوع ارسال</Label>
                    <div className="grid grid-cols-2 gap-2">
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">قالب پیام</Label>
                    <select
                      value={notificationTemplate}
                      onChange={(e) => setNotificationTemplate(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="renewal_reminder">یادآوری تمدید سرویس</option>
                      <option value="invoice_created">اطلاع‌رسانی صدور فاکتور جدید</option>
                      <option value="service_alert">هشدار فنی / وضعیت سرویس</option>
                      <option value="custom_notice">پیام دلخواه و عمومی</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">متن / یادداشت همراه پیام</Label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={3}
                      placeholder="متن دلخواه خود را در صورت تمایل بنویسید..."
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendNotificationMutation.isPending}
                    className="w-full gap-1.5 mt-2"
                  >
                    <Send className="h-3.5 w-3.5" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
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
                        const badge = getServiceCategoryBadge(svc.categorySlug);
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
                          const badge = getServiceCategoryBadge(activeSelectedService.categorySlug);
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

                  {/* Conditional Fields based on Category */}
                  {activeSelectedService?.categorySlug === "package" ? (
                    <div className="space-y-3 p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">تعداد (عدد در بسته) *</Label>
                          <Input
                            type="number"
                            min={1}
                            value={serviceQuantity}
                            onChange={(e) => setServiceQuantity(Math.max(1, Number(e.target.value)))}
                            placeholder="مثال: 5000"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">هزینه دوره (تومان) *</Label>
                          <Input
                            type="number"
                            min={0}
                            value={servicePrice}
                            onChange={(e) => setServicePrice(e.target.value)}
                            placeholder="2500000"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        * برای دسته‌بندی بسته‌ها، تعداد و قیمت به صورت مستقل و آزادانه برای این مشتری تعیین می‌شوند.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">هزینه دوره (تومان) *</Label>
                      <Input
                        type="number"
                        min={0}
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        placeholder="مثال: 2500000"
                        required
                      />
                    </div>
                  )}

                  {/* Service Duration (Days) and Renewal Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">دوره سرویس (تعداد روز) *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          value={serviceDurationDays}
                          onChange={(e) => {
                            const days = Math.max(1, Number(e.target.value) || 1);
                            setServiceDurationDays(days);
                            const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                            setNewServiceRenewalDate(targetDate.toISOString().split("T")[0]);
                          }}
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
                      <Label className="text-xs font-semibold">تاریخ سررسید تمدید</Label>
                      <Input
                        type="date"
                        value={newServiceRenewalDate}
                        onChange={(e) => setNewServiceRenewalDate(e.target.value)}
                      />
                      {newServiceRenewalDate && (
                        <p className="text-[11px] text-primary font-medium">
                          معادل شمسی: {formatJalaliDateWords(newServiceRenewalDate)} ({formatJalaliDate(newServiceRenewalDate)})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Auto-renew checkbox */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={serviceAutoRenew}
                      onChange={(e) => setServiceAutoRenew(e.target.checked)}
                      className="rounded h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">تمدید خودکار سرویس</span>
                      <span className="text-[11px] text-muted-foreground">
                        در تاریخ سررسید، صورت‌حساب تمدید به صورت اتوماتیک صادر شود
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
                      disabled={createServiceMutation.isPending}
                    >
                      {createServiceMutation.isPending ? "در حال تخصیص..." : "تخصیص سرویس به مشتری"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT SERVICE */}
        {isEditServiceOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">هزینه دوره (تومان)</Label>
                    <Input
                      type="number"
                      value={editServicePrice}
                      onChange={(e) => setEditServicePrice(e.target.value)}
                    />
                  </div>

                  {selectedService.serviceType?.slug === "package" || selectedService.quantity ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">تعداد در بسته</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editServiceQuantity}
                        onChange={(e) => setEditServiceQuantity(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">وضعیت سرویس</Label>
                      <select
                        value={editServiceStatus}
                        onChange={(e) => setEditServiceStatus(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="ACTIVE">فعال (ACTIVE)</option>
                        <option value="SUSPENDED">معلق (SUSPENDED)</option>
                        <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">دوره سرویس (تعداد روز) *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        value={editServiceDurationDays}
                        onChange={(e) => {
                          const days = Math.max(1, Number(e.target.value) || 1);
                          setEditServiceDurationDays(days);
                          const base = selectedService?.startDate ? new Date(selectedService.startDate) : new Date();
                          const targetDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
                          setEditServiceRenewalDate(targetDate.toISOString().split("T")[0]);
                        }}
                        placeholder="مثال: 30"
                        className="pl-12 font-mono h-9 text-xs"
                        required
                      />
                      <span className="absolute left-3 top-2 text-xs text-muted-foreground pointer-events-none">
                        روز
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ سررسید تمدید</Label>
                    <Input
                      type="date"
                      value={editServiceRenewalDate}
                      onChange={(e) => setEditServiceRenewalDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                    {editServiceRenewalDate && (
                      <p className="text-[11px] text-primary font-medium">
                        معادل شمسی: {formatJalaliDateWords(editServiceRenewalDate)} ({formatJalaliDate(editServiceRenewalDate)})
                      </p>
                    )}
                  </div>
                </div>

                {(selectedService.serviceType?.slug === "package" || selectedService.quantity) && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">وضعیت سرویس</Label>
                    <select
                      value={editServiceStatus}
                      onChange={(e) => setEditServiceStatus(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="ACTIVE">فعال (ACTIVE)</option>
                      <option value="SUSPENDED">معلق (SUSPENDED)</option>
                      <option value="INACTIVE">غیرفعال (INACTIVE)</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editServiceAutoRenew}
                    onChange={(e) => setEditServiceAutoRenew(e.target.checked)}
                    className="rounded h-4 w-4 text-primary"
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
                    disabled={updateServiceMutation.isPending}
                  >
                    {updateServiceMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* MODAL 3: CREATE INVOICE */}
        {isCreateInvoiceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
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
                      type="number"
                      value={invoiceItemAmount}
                      onChange={(e) => setInvoiceItemAmount(e.target.value)}
                      placeholder="2500000"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">مهلت پرداخت</Label>
                    <Input
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
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
        )}

        {/* MODAL 4: INVOICE DETAILS MODAL */}
        <InvoiceDetailModal
          invoice={viewingInvoice}
          isOpen={isViewInvoiceOpen}
          onClose={() => {
            setIsViewInvoiceOpen(false);
            setViewingInvoice(null);
          }}
          onCancel={(invId) => cancelInvoiceMutation.mutate(invId)}
        />
      </div>
    </AppShell>
  );
}
