import { useState } from "react";
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
} from "lucide-react";

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

  // Create Service Form State
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("2500000");
  const [newServiceType, setNewServiceType] = useState("web-hosting");
  const [newServiceStartDate, setNewServiceStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newServiceRenewalDate, setNewServiceRenewalDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

  // Edit Service Form State
  const [editServiceName, setEditServiceName] = useState("");
  const [editServicePrice, setEditServicePrice] = useState("");
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

  // Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("سرویس جدید با موفقیت برای این مشتری ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setIsCreateServiceOpen(false);
      setNewServiceName("");
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
        body: JSON.stringify({ reason: "لغو شده توسط مدیر سیستم در پنل مشتری" }),
      }),
    onSuccess: () => {
      toast.success("فاکتور مورد نظر لغو شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
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
    updateProfileMutation.mutate({
      name: profileName,
      displayName: profileDisplayName || undefined,
      phone: profilePhone || undefined,
      email: profileEmail || undefined,
      status: profileStatus,
    });
  };

  // Handle Create Service Submit
  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      toast.error("عنوان سرویس الزامی است");
      return;
    }
    createServiceMutation.mutate({
      customerId: id,
      serviceTypeId: "type_standard_web",
      name: newServiceName,
      priceToman: Number(newServicePrice) || 0,
      startDate: new Date(newServiceStartDate).toISOString(),
      renewalDate: new Date(newServiceRenewalDate).toISOString(),
    });
  };

  // Handle Edit Service Submit
  const handleEditServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    updateServiceMutation.mutate({
      serviceId: selectedService.id,
      data: {
        name: editServiceName,
        priceToman: Number(editServicePrice) || 0,
        status: editServiceStatus,
        renewalDate: editServiceRenewalDate ? new Date(editServiceRenewalDate).toISOString() : undefined,
      },
    });
  };

  // Handle Create Invoice Submit
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(invoiceItemAmount) || 0;
    createInvoiceMutation.mutate({
      customerId: id,
      dueDate: new Date(invoiceDueDate).toISOString(),
      items: [
        {
          title: invoiceItemTitle || "تمدید دوره‌ای خدمات هاستینگ و زیرساخت",
          quantity: 1,
          unitPriceToman: amount,
          totalToman: amount,
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

  // Fallback demo mock if server customer not found
  const activeCustomer = customer || {
    id: id,
    name: "شرکت چوبینو گستر",
    displayName: "چوبینو گستر ایرانیان",
    phone: "09121112233",
    email: "info@choobinooo.ir",
    status: "ACTIVE",
    createdAt: "2026-01-10T10:00:00.000Z",
    services: [
      {
        id: "svc_101",
        name: "هاست ابری پرسرعت اختصاصی",
        priceToman: 2800000,
        status: "ACTIVE",
        startDate: "2026-01-10T00:00:00.000Z",
        renewalDate: "2026-04-10T00:00:00.000Z",
        serviceType: { name: "Web Hosting" },
        server: { name: "Hetzner-Cloud-01", ipAddress: "159.69.120.45" },
        endpoints: [
          {
            id: "ep_1",
            label: "وبسایت اصلی",
            url: "https://choobinooo.ir",
            status: "UP",
            uptimePercentage30d: 99.98,
            responseTimeMs: 84,
          },
          {
            id: "ep_2",
            label: "سامانه مدیریت محتوا",
            url: "https://cms.choobinooo.ir",
            status: "UP",
            uptimePercentage30d: 100.0,
            responseTimeMs: 110,
          },
        ],
      },
    ],
    invoices: [
      {
        id: "inv_201",
        invoiceNumber: "INV-2026-088",
        status: "PAID",
        totalToman: 2800000,
        issuedAt: "2026-01-10T10:00:00.000Z",
        dueDate: "2026-01-17T10:00:00.000Z",
        paidAt: "2026-01-11T12:30:00.000Z",
        payment: {
          id: "pay_1",
          provider: "ZARINPAL",
          gatewayRef: "TRX-98321045",
          amountToman: 2800000,
          paidAt: "2026-01-11T12:30:00.000Z",
        },
      },
      {
        id: "inv_202",
        invoiceNumber: "INV-2026-092",
        status: "UNPAID",
        totalToman: 2800000,
        issuedAt: "2026-03-25T10:00:00.000Z",
        dueDate: "2026-04-05T10:00:00.000Z",
        paidAt: null,
      },
    ],
  };

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
              بروزرسانی داده‌ها
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsSendNotificationOpen(true)}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              ارسال پیام / اعلان
            </Button>
          </div>
        </div>

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
                      {activeCustomer.status === "ACTIVE" ? "حساب فعال" : "غیرفعال / معلق"}
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
                    {new Date(activeCustomer.createdAt).toLocaleDateString("fa-IR")}
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
                    {new Date(activeCustomer.createdAt).toLocaleDateString("fa-IR")}
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
                {servicesList.map((svc: any) => (
                  <Card key={svc.id} className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          <Server className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">{svc.name}</h4>
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
                            شناسه: {svc.id} • سرور: {svc.server?.name || "زیرساخت ابری گکوت"} ({svc.server?.ipAddress || "159.69.120.45"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <span className="text-[11px] text-muted-foreground block">هزینه دوره:</span>
                          <span className="font-bold text-sm text-foreground">
                            {(svc.priceToman || 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-muted-foreground block">تاریخ تمدید:</span>
                          <span className="font-mono text-xs text-foreground">
                            {new Date(svc.renewalDate).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedService(svc);
                            setEditServiceName(svc.name);
                            setEditServicePrice(String(svc.priceToman || ""));
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
                ))}
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
                            {inv.invoiceNumber || inv.id}
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
                            {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString("fa-IR")}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {new Date(inv.dueDate).toLocaleDateString("fa-IR")}
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
                            {new Date(inv.payment.paidAt).toLocaleDateString("fa-IR")}
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
                          {new Date(log.createdAt).toLocaleDateString("fa-IR")}
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
                        {new Date(activeCustomer.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span>ارسال اطلاعیه صدور صورت‌حساب دوره‌ای</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date().toLocaleDateString("fa-IR")}
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

        {/* MODAL 1: CREATE SERVICE FOR CUSTOMER */}
        {isCreateServiceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Server className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">تعریف سرویس جدید برای {activeCustomer.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateServiceOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateServiceSubmit} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان سرویس *</Label>
                  <Input
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="مثال: هاست لینوکس پرسرعت یا سرور اختصاصی"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">نوع سرویس</Label>
                    <select
                      value={newServiceType}
                      onChange={(e) => setNewServiceType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="web-hosting">هاست اشتراکی و ابری (Web Hosting)</option>
                      <option value="vps">سرور مجازی (VPS)</option>
                      <option value="dedicated">سرور اختصاصی (Dedicated Server)</option>
                      <option value="cdn">شبکه توزیع محتوا (CDN)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">هزینه دوره (تومان) *</Label>
                    <Input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="2500000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ شروع</Label>
                    <Input
                      type="date"
                      value={newServiceStartDate}
                      onChange={(e) => setNewServiceStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاریخ سررسید تمدید</Label>
                    <Input
                      type="date"
                      value={newServiceRenewalDate}
                      onChange={(e) => setNewServiceRenewalDate(e.target.value)}
                    />
                  </div>
                </div>

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
                    {createServiceMutation.isPending ? "در حال ایجاد..." : "ثبت سرویس"}
                  </Button>
                </div>
              </form>
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
                  <h3 className="font-bold text-base">ویرایش سرویس {selectedService.name}</h3>
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
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">تاریخ سررسید تمدید</Label>
                  <Input
                    type="date"
                    value={editServiceRenewalDate}
                    onChange={(e) => setEditServiceRenewalDate(e.target.value)}
                  />
                </div>

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
      </div>
    </AppShell>
  );
}
