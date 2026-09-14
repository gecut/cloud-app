import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DEMO_USERS,
  getActiveUser,
  setActiveUser,
  type DemoUser,
} from "@/utils/api-client";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@gecut-cloud/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gecut-cloud/ui/components/dropdown-menu";
import {
  ShieldCheck,
  User,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
} from "lucide-react";

export function AdminHeader() {
  const [currentUser, setCurrentUser] = useState<DemoUser>(getActiveUser());

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getActiveUser());
    };
    window.addEventListener("auth-change", handleAuth);
    return () => window.removeEventListener("auth-change", handleAuth);
  }, []);

  const handleSelectUser = (u: DemoUser) => {
    setActiveUser(u);
    setCurrentUser(u);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
            GC
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-none">گکوت کلود</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              سامانه یکپارچه مدیریت زیرساخت و مالی
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Customer App Quick Link */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex"
        >
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            مشاهده پنل مشتریان
          </Button>
        </a>

        {/* Demo Persona / Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                {currentUser.role === "ADMIN" ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                ) : (
                  <User className="h-4 w-4 text-blue-500" />
                )}
                <span className="max-w-[140px] truncate text-xs font-medium">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 text-right">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              تغییر نقش دمو / تست سناریوها
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEMO_USERS.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{user.email}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    user.role === "ADMIN"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {user.role}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mode Toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}

