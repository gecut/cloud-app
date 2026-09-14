import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ModeToggle } from "@/app/components/mode-toggle";
import { Avatar } from "@heroui/react";
import { getActiveCustomerUser, type DemoUser } from "@/lib/api-client";

export function Header({
  profileImage = "/hello.png",
  profileName,
}: {
  profileImage?: string;
  profileName?: string;
}) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(getActiveCustomerUser());

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getActiveCustomerUser());
    };
    window.addEventListener("auth-change", handleAuth);
    return () => window.removeEventListener("auth-change", handleAuth);
  }, []);

  const displayName = profileName || currentUser.name;

  return (
    <header className="fixed top-0 inset-x-0 border-b border-b-border bg-surface supports-[backdrop-filter]:backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80 h-16 z-50">
      <nav className="w-full max-w-md mx-auto flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-2">
          <ModeToggle />
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-primary hover:underline bg-primary/10 px-2 py-1 rounded-md font-medium"
          >
            پنل ادمین
          </a>
        </div>
        <Link to="/login" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {currentUser.role}
            </span>
          </div>
          <Avatar>
            <Avatar.Image alt={displayName} src={profileImage} />
            <Avatar.Fallback className="flex items-center justify-center text-xs font-bold">
              {displayName?.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
        </Link>

      </nav>
    </header>
  );
}

