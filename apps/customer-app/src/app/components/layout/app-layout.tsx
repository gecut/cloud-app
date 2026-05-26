import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { Navigation } from "@/app/components/layout/navigation";
import { Header } from "@/app/components/layout/header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const isDashboardRoute = pathname === "/";

  return (
    <div className={`flex flex-col pt-16 pb-22 overflow-hidden `}>
      <Header />
      <main
        className={`page-transition-container flex-1 min-h-0 mx-auto w-full max-w-md ${
          isDashboardRoute ? "overflow-hidden" : ""
        }`}
      >
        <div
          key={pathname}
          className="page-transition-fallback h-full min-h-0 p-2"
        >
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
}
