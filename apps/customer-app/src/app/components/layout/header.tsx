import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ModeToggle } from "@/app/components/mode-toggle";
import { Avatar, toast } from "@heroui/react";
import {
  getActiveCustomerUser,
  clearAuth,
  apiClient,
  type DemoUser,
} from "@/lib/api-client";

export function Header({
  profileImage = "/hello.png",
  profileName,
}: {
  profileImage?: string;
  profileName?: string;
}) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUser>(getActiveCustomerUser());

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getActiveCustomerUser());
    };
    window.addEventListener("auth-change", handleAuth);
    return () => window.removeEventListener("auth-change", handleAuth);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      clearAuth();
      toast.success("با موفقیت از حساب خارج شدید");
      navigate({ to: "/login" });
    }
  };

  const displayName = profileName || currentUser.name;

  return (
    <header className="fixed top-0 inset-x-0 border-b border-b-border bg-surface supports-[backdrop-filter]:backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80 h-16 z-50">
      <nav className="w-full max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-between px-4 md:px-6 h-full transition-all duration-200">
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-left">
            <span className="text-xs font-semibold text-foreground max-w-[160px] truncate">
              {displayName}
            </span>
          </div>
          <Avatar>
            <Avatar.Image alt={displayName} src={profileImage} />
            <Avatar.Fallback className="flex items-center justify-center text-xs font-bold">
              {displayName?.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <button
            type="button"
            onClick={handleLogout}
            title="خروج از حساب کاربری"
            className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

