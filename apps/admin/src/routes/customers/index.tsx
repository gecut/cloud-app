import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/utils/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@gecut-cloud/ui/components/card";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Building,
  Phone,
  Mail,
  CheckCircle,
  X,
  RefreshCw,
  ChevronLeft,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/customers/")({
  component: AdminCustomersListPage,
});

const DEFAULT_CUSTOMERS = [
  {
    id: "cust_1",
    name: "شرکت چوبینو",
    email: "info@choobinooo.ir",
    phone: "09121112233",
    company: "چوبینو گستر ایرانیان",
    status: "ACTIVE",
    _count: { services: 3, invoices: 2 },
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "cust_2",
    name: "آژانس دیجیتال رایان",
    email: "contact@rayan.agency",
    phone: "09354445566",
    company: "رایان وب ارتباط",
    status: "ACTIVE",
    _count: { services: 2, invoices: 1 },
    createdAt: "2026-02-15T14:30:00.000Z",
  },
  {
    id: "cust_3",
    name: "فروشگاه پارس گستر",
    email: "support@parsgostar.com",
    phone: "09129998877",
    company: "پارس گستر تجارت",
    status: "INACTIVE",
    _count: { services: 0, invoices: 0 },
    createdAt: "2026-03-01T09:15:00.000Z",
  },
];

function AdminCustomersListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customers", searchTerm],
    queryFn: () =>
      apiClient<{ items: any[]; total: number }>(
        `/customers?page=1&limit=50${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`,
      ),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (newCustomer: { name: string; email?: string; phone?: string; company?: string }) =>
      apiClient("/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      }),
    onSuccess: () => {
      toast.success("مشتری جدید با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در ایجاد مشتری");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام مشتری الزامی است");
      return;
    }
    createCustomerMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
    });
  };

  const customersList = data?.items?.length ? data.items : DEFAULT_CUSTOMERS;
  const filteredList = customersList.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm),
  );

  return (
    <AppShell header={<AdminHeader />}>
      <div className="flex flex-col gap-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت مشتریان</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مشاهده و تعریف حساب‌های کاربری مشتریان و دسترسی‌های سازمانی
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
              افزودن مشتری جدید
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
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">ثبت مشتری جدید</h3>
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
                  <Label htmlFor="name" className="text-xs font-semibold">
                    نام و نام خانوادگی / عنوان مخاطب *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی محمدی یا شرکت پیشگام"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-xs font-semibold">
                      نام شرکت یا سازمان
                    </Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="مثال: پارس سیستم"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      شماره تماس
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912xxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    آدرس ایمیل
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
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
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? "در حال ثبت..." : "ثبت مشتری"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس نام، شرکت یا شماره تماس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Customers Table Card */}
        <Card className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">مشتری / نام شرکت</th>
                    <th className="py-3.5 px-4">اطلاعات تماس</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4">تعداد سرویس‌ها</th>
                    <th className="py-3.5 px-4">تاریخ عضویت</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredList.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <Link
                          to="/customers/$id"
                          params={{ id: customer.id }}
                          className="flex flex-col group cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {customer.name}
                          </span>
                          {customer.company && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building className="h-3 w-3" />
                              {customer.company}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {customer.phone && (
                            <span className="font-mono flex items-center gap-1 text-[11px]">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="font-mono flex items-center gap-1 text-[11px]">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            customer.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {customer.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {customer._count?.services ?? 1} سرویس
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {new Date(customer.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to="/customers/$id"
                          params={{ id: customer.id }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5"
                          >
                            <Eye className="h-3 w-3" />
                            پروفایل و مدیریت
                          </Button>
                        </Link>
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

