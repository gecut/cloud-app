import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEMO_USERS,
  getActiveUser,
  setActiveUser,
  clearAdminAuth,
  apiClient,
  type DemoUser,
} from "@/utils/api-client";
import { ModeToggle } from "@/components/mode-toggle";
import { ModalPortal } from "@/components/common/modal-portal";
import { Button } from "@gecut-cloud/ui/components/button";
import { Input } from "@gecut-cloud/ui/components/input";
import { Label } from "@gecut-cloud/ui/components/label";
import { formatJalaliDateTime } from "@gecut-cloud/contracts";
import {
  ShieldCheck,
  User,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
  LogOut,
  Menu,
  X,
  Database,
  AlertTriangle,
  Trash2,
  Users,
  UserPlus,
  KeyRound,
  Lock,
  Phone,
  CheckCircle2,
  SquarePen,
} from "lucide-react";
import { toast } from "sonner";
import { navItems } from "./app-shell";

export function AdminHeader() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState?.location?.pathname || "/";
  const [currentUser, setCurrentUser] = useState<DemoUser>(getActiveUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState("");

  // Admin Management States
  const queryClient = useQueryClient();
  const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false);
  const [adminsTab, setAdminsTab] = useState<"list" | "create" | "edit">("list");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Edit admin states: name, phone, and optional password
  const [editAdminId, setEditAdminId] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);

  const { data: adminsList = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ["admin", "admins-list"],
    queryFn: () => apiClient<any[]>("/auth/admins"),
    enabled: isAdminsModalOpen,
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminPhone.trim() || !newAdminPassword.trim()) {
      toast.error("تمام فیلدهای نام، شماره موبایل و رمز عبور الزامی هستند");
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setIsCreatingAdmin(true);
    try {
      await apiClient("/auth/admins", {
        method: "POST",
        body: JSON.stringify({
          name: newAdminName.trim(),
          phone: newAdminPhone.trim(),
          password: newAdminPassword.trim(),
        }),
      });
      toast.success("مدیر جدید با موفقیت ایجاد شد");
      setNewAdminName("");
      setNewAdminPhone("");
      setNewAdminPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "admins-list"] });
      setAdminsTab("list");
    } catch (err: any) {
      toast.error(err.message || "خطا در ایجاد مدیر جدید");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleOpenEdit = (adm: any) => {
    setEditAdminId(adm.id);
    setEditAdminName(adm.name || "");
    setEditAdminPhone(adm.phone || "");
    setEditAdminPassword("");
    setAdminsTab("edit");
  };

  const handleSelectEditAdmin = (adminId: string) => {
    setEditAdminId(adminId);
    const target = adminsList.find((a: any) => a.id === adminId);
    if (target) {
      setEditAdminName(target.name || "");
      setEditAdminPhone(target.phone || "");
    } else {
      setEditAdminName(currentUser.name || "");
      setEditAdminPhone(currentUser.phone || "");
    }
    setEditAdminPassword("");
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminName.trim()) {
      toast.error("نام و نام خانوادگی مدیر الزامی است");
      return;
    }
    if (!editAdminPhone.trim()) {
      toast.error("شماره موبایل مدیر الزامی است");
      return;
    }
    if (editAdminPassword.trim() && editAdminPassword.trim().length < 6) {
      toast.error("در صورت تغییر، رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    const targetId = editAdminId || currentUser.id;
    setIsUpdatingAdmin(true);
    try {
      const res: any = await apiClient(`/auth/admins/${targetId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editAdminName.trim(),
          phone: editAdminPhone.trim(),
          newPassword: editAdminPassword.trim() || undefined,
        }),
      });

      toast.success(res?.message || "مشخصات مدیر با موفقیت به‌روزرسانی شد");

      // If updating the active logged in admin, update active user in local state & storage
      if (targetId === currentUser.id || editAdminPhone.trim() === currentUser.phone) {
        const updated = {
          ...currentUser,
          name: editAdminName.trim(),
          phone: editAdminPhone.trim(),
        };
        setActiveUser(updated);
        setCurrentUser(updated);
      }

      setEditAdminPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "admins-list"] });
      setAdminsTab("list");
    } catch (err: any) {
      toast.error(err.message || "خطا در به‌روزرسانی مشخصات مدیر");
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getActiveUser());
    };
    window.addEventListener("auth-change", handleAuth);
    return () => window.removeEventListener("auth-change", handleAuth);
  }, []);

  const handlePurgeDatabase = async () => {
    setIsPurging(true);
    try {
      const res: any = await apiClient("/system/reset-database", { method: "POST" });
      toast.success(res?.message || "تمامی داده‌ها با موفقیت پاکسازی شدند");
      setIsPurgeModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      toast.error(err.message || "خطا در پاکسازی دیتابیس");
    } finally {
      setIsPurging(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      clearAdminAuth();
      toast.success("از سامانه مدیریت خارج شدید");
      navigate({ to: "/login" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 px-4 sm:px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            title="منوی ناوبری"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2 sm:gap-4 group">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 shadow-xs group-hover:scale-105 transition-all duration-300">
              <img src="/logo.png" alt="Gecut" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm -z-10 group-hover:opacity-100 opacity-60 transition-opacity" />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-foreground">جیکات کلود</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">ادمین</span>
              </div>
              <span className="hidden sm:inline text-[11px] text-muted-foreground font-normal">
                مرکز فرماندهی زیرساخت و عملیات
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Customer App Quick Link */}
          <a
            href="https://app.gecut.ir"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex"
          >
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden lg:inline">پنل مشتریان</span>
            </Button>
          </a>

          {/* Admin User Info */}
          <div className="hidden md:flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
            <span className="max-w-[90px] lg:max-w-[140px] truncate text-foreground font-semibold">
              {currentUser.name || "مدیر سامانه"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              مدیر
            </span>
          </div>

          {/* Admin Management Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdminsTab("list");
              setIsAdminsModalOpen(true);
            }}
            className="hidden md:inline-flex gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 rounded-xl cursor-pointer shadow-xs"
            title="مدیریت مدیران و تغییر گذرواژه"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden md:inline">مدیریت مدیران</span>
          </Button>

          {/* Direct Purge Database Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmKeyword("");
              setIsPurgeModalOpen(true);
            }}
            className="hidden md:inline-flex gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 rounded-xl cursor-pointer shadow-xs"
            title="پاکسازی تمام داده‌ها و رکوردهای دیتابیس"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">پاکسازی دیتابیس</span>
          </Button>

          {/* Direct Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="hidden md:inline-flex gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border rounded-xl cursor-pointer shadow-xs"
            title="خروج از سامانه مدیریت"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">خروج</span>
          </Button>

          {/* Mode Toggle */}
          <ModeToggle />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-card border-l border-border h-full shadow-2xl p-5 flex flex-col gap-4 z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Gecut" className="w-6 h-6 object-contain" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">جیکات کلود</span>
                  <span className="text-[10px] text-muted-foreground">پنل مدیریت موبایل</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {currentUser.name || "مدیر سامانه"}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                مدیر
              </span>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-1 overflow-y-auto flex-1 py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? currentPath === item.to
                  : currentPath.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-500" : "opacity-70"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setAdminsTab("list");
                  setIsAdminsModalOpen(true);
                }}
                className="w-full gap-2 rounded-xl text-xs font-semibold h-9 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>مدیریت مدیران و گذرواژه‌ها</span>
              </Button>

              <a
                href="https://app.gecut.ir"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>مشاهده پنل مشتریان</span>
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setConfirmKeyword("");
                  setIsPurgeModalOpen(true);
                }}
                className="w-full gap-2 rounded-xl text-xs font-semibold h-9 text-rose-600 border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Database className="h-3.5 w-3.5" />
                <span>پاکسازی کامل دیتابیس</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="w-full gap-2 rounded-xl text-xs font-semibold h-9"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>خروج از حساب</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Database Confirmation Modal */}
      {isPurgeModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPurging) setIsPurgeModalOpen(false);
            }}
          >
            <div className="relative w-full max-w-md m-auto rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-destructive mb-3">
                <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">پاکسازی کامل محتوای دیتابیس</h3>
                  <p className="text-xs text-muted-foreground">حذف رکوردهای محتوایی بدون تغییر ساختار مدل‌ها</p>
                </div>
              </div>

              <div className="space-y-3 py-3 text-xs text-muted-foreground leading-relaxed border-y border-border/50 my-3">
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-foreground font-medium flex flex-col gap-1.5">
                  <span className="text-destructive font-bold text-xs flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    موارد زیر به طور کامل حذف خواهند شد:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground pr-1">
                    <li>تمام مشتریان (پروفایل‌ها و اطلاعات تماس)</li>
                    <li>تمام سرویس‌ها و پکیج‌های تخصیص‌یافته</li>
                    <li>تمام فاکتورها، اقلام و صورت‌حساب‌ها</li>
                    <li>تمام تراکنش‌ها، پرداخت‌ها و رسیدها</li>
                    <li>تمام تامین‌کنندگان و سرورها</li>
                    <li>تمام لاگ‌های سیستمی و مانیتورینگ</li>
                  </ul>
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  ✓ حساب کاربری ادمین ({currentUser.name}) و ساختار تمام مدل‌ها و جداول دست‌نخورده حفظ می‌شوند.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPurgeModalOpen(false)}
                  disabled={isPurging}
                  className="rounded-xl text-xs"
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handlePurgeDatabase}
                  disabled={isPurging}
                  className="gap-1.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {isPurging ? "در حال پاکسازی..." : "بله، همه داده‌ها پاک شوند"}
                </Button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Admin Management Modal */}
      {isAdminsModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAdminsModalOpen(false);
            }}
          >
            <div className="relative w-full max-w-lg m-auto rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">مدیریت مدیران سامانه</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تعریف مدیر جدید و مدیریت گذرواژه حساب‌های کاربری مدیران
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAdminsModalOpen(false)}
                className="cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/40 border border-border/40 text-xs mt-4">
              <button
                type="button"
                onClick={() => setAdminsTab("list")}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  adminsTab === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>لیست مدیران ({adminsList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminsTab("create")}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  adminsTab === "create"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>تعریف مدیر جدید</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editAdminId) {
                    handleSelectEditAdmin(currentUser.id);
                  }
                  setAdminsTab("edit");
                }}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  adminsTab === "edit"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SquarePen className="h-3.5 w-3.5" />
                <span>ویرایش مشخصات و رمز</span>
              </button>
            </div>

            {/* Tab 1: Admins List */}
            {adminsTab === "list" && (
              <div className="mt-4 flex flex-col gap-3">
                {isLoadingAdmins ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">در حال دریافت لیست مدیران...</div>
                ) : adminsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">مدیری در سامانه ثبت نشده است.</div>
                ) : (
                  <div className="divide-y divide-border/40 rounded-xl border border-border/50 max-h-72 overflow-y-auto">
                    {adminsList.map((adm: any) => (
                      <div key={adm.id} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                            {adm.name?.charAt(0) || "م"}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              {adm.name || "مدیر سامانه"}
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                ادمین
                              </span>
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {adm.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {adm.id === currentUser.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                              (حساب شما)
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(adm)}
                            className="text-xs h-7 px-2.5 rounded-lg gap-1 border-border/60 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <SquarePen className="h-3 w-3" />
                            <span>ویرایش مشخصات</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdminsModalOpen(false)}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    بستن
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 2: Create Admin */}
            {adminsTab === "create" && (
              <form onSubmit={handleCreateAdmin} className="mt-4 flex flex-col gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-foreground text-[11px] leading-relaxed">
                  کاربر تعریف‌شده در این بخش مستقیماً دسترسی <span className="font-bold text-emerald-600 dark:text-emerald-400">مدیریت کل (ADMIN)</span> دریافت کرده و امکان ورود به پنل ادمین را خواهد داشت.
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام و نام خانوادگی مدیر *</Label>
                  <Input
                    type="text"
                    placeholder="مثال: مهندس احمدی"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شماره موبایل مدیر *</Label>
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono text-center"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رمز عبور اولیه (حداقل ۶ کاراکتر) *</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono text-center"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdminsTab("list")}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreatingAdmin}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    {isCreatingAdmin ? "در حال ایجاد..." : "ایجاد و ذخیره مدیر"}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 3: Edit Admin Details & Password */}
            {adminsTab === "edit" && (
              <form onSubmit={handleUpdateAdmin} className="mt-4 flex flex-col gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                  در این بخش می‌توانید <strong className="text-foreground">نام، شماره موبایل</strong> و در صورت نیاز <strong className="text-foreground">رمز عبور</strong> مدیر را تغییر دهید.
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">انتخاب حساب مدیر جهت ویرایش</Label>
                  <select
                    value={editAdminId}
                    onChange={(e) => handleSelectEditAdmin(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-card px-3 py-1 text-xs shadow-xs font-medium cursor-pointer"
                  >
                    <option value="">مدیر جاری ({currentUser.name || "من"})</option>
                    {adminsList.map((adm: any) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name} ({adm.phone}) {adm.id === currentUser.id ? "— (حساب شما)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نام و نام خانوادگی مدیر *</Label>
                  <Input
                    type="text"
                    placeholder="مثال: مهندس احمدی"
                    value={editAdminName}
                    onChange={(e) => setEditAdminName(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شماره موبایل مدیر *</Label>
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    value={editAdminPhone}
                    onChange={(e) => setEditAdminPhone(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono text-center"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">رمز عبور جدید (اختیاری)</Label>
                    <span className="text-[10px] text-muted-foreground">در صورت عدم نیاز به تغییر رمز، خالی بگذارید</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="اگر قصد تغییر رمز ندارید، خالی بگذارید"
                    value={editAdminPassword}
                    onChange={(e) => setEditAdminPassword(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono text-center"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdminsTab("list")}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdatingAdmin}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs cursor-pointer shadow-xs gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isUpdatingAdmin ? "در حال ذخیره..." : "ذخیره تغییرات"}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

