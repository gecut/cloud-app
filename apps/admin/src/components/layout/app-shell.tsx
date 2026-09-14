import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Server,
  FileText,
  CreditCard,
  HardDrive,
  History,
  ShieldAlert,
} from "lucide-react";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

const navItems = [
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
    label: "سرورها و زیرساخت",
    icon: HardDrive,
  },
  {
    to: "/audit-logs",
    label: "لاگ‌های سیستمی",
    icon: History,
  },
];

export function AppShell({ header, children }: AppShellProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {header}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-l bg-card/40 p-4 hidden md:flex flex-col gap-1 shrink-0">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            ناوبری پنل ادمین
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? currentPath === item.to
                : currentPath.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex flex-col gap-1">
              <span className="font-semibold text-foreground">گکوت وب کلود v1.0</span>
              <span>محیط تست دمو با NestJS و CQRS</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

