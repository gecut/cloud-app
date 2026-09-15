import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Server,
  FileText,
  CreditCard,
  Building2,
  Layers,
  Calculator,
  History,
  LogOut,
} from "lucide-react";
import { clearAdminAuth, apiClient } from "@/utils/api-client";
import { toast } from "sonner";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export const navItems = [
  {
    to: "/",
    label: "داشبورد مدیریت",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/customers",
    label: "مشتریان",
    icon: Users,
  },
  {
    to: "/services",
    label: "سرویس‌ها",
    icon: Server,
  },
  {
    to: "/invoices",
    label: "فاکتورها",
    icon: FileText,
  },
  {
    to: "/payments",
    label: "پرداخت‌ها",
    icon: CreditCard,
  },
  {
    to: "/servers",
    label: "تامین‌کنندگان",
    icon: Building2,
  },
  {
    to: "/accounting",
    label: "حسابداری و تراز",
    icon: Calculator,
  },
  {
    to: "/audit-logs",
    label: "لاگ‌های سیستمی",
    icon: History,
  },
];

export function AppShell({ header, children }: AppShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      {header}
      <div className="flex-1 flex relative">
        {/* Sleek Minimalist Sidebar */}
        <aside className="w-60 border-l border-border/40 bg-card/20 backdrop-blur-md p-4 hidden md:flex flex-col gap-1 shrink-0 select-none">
          <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            مدیریت و نظارت
          </div>
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? currentPath === item.to
                : currentPath.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {/* Subtle active indicator bar */}
                  {isActive && (
                    <div className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-emerald-500" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-emerald-500" : "opacity-70 group-hover:opacity-100"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border/30 flex flex-col gap-2">
            <div className="p-3 rounded-xl bg-card/40 border border-border/40 text-xs flex flex-col gap-1.5 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-[11px]">جیکات کلود v1.0</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground leading-relaxed">
                سامانه عملیاتی و مالی یکپارچه
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area with Entrance Animation */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto animate-entrance">
          {children}
        </main>
      </div>
    </div>
  );
}

