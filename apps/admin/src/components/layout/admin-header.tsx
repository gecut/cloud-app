import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  DEMO_USERS,
  getActiveUser,
  setActiveUser,
  clearAdminAuth,
  apiClient,
  type DemoUser,
} from "@/utils/api-client";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@gecut-cloud/ui/components/button";
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
} from "lucide-react";
import { toast } from "sonner";
import { navItems } from "./app-shell";

export function AdminHeader() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState?.location?.pathname || "/";
  const [currentUser, setCurrentUser] = useState<DemoUser>(getActiveUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getActiveUser());
    };
    window.addEventListener("auth-change", handleAuth);
    return () => window.removeEventListener("auth-change", handleAuth);
  }, []);

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

          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 shadow-xs group-hover:scale-105 transition-all duration-300">
              <img src="/logo.png" alt="Gecut" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm -z-10 group-hover:opacity-100 opacity-60 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm font-black tracking-tight text-foreground">جیکات کلود</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">ادمین</span>
              </div>
              <span className="hidden sm:inline text-[11px] text-muted-foreground font-normal">
                مرکز فرماندهی زیرساخت و عملیات
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Customer App Quick Link */}
          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
              <ExternalLink className="h-3.5 w-3.5" />
              پنل مشتریان
            </Button>
          </a>

          {/* Admin User Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
            <span className="max-w-[140px] truncate text-foreground font-semibold">
              {currentUser.name || "مدیر سامانه"}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              مدیر
            </span>
          </div>

          {/* Direct Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 rounded-xl cursor-pointer shadow-xs"
            title="خروج از سامانه مدیریت"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">خروج</span>
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
              <a
                href="http://localhost:3002"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>مشاهده پنل مشتریان</span>
              </a>

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
    </>
  );
}

