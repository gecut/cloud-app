import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

import { Navigation } from "@/app/components/layout/navigation";
import { Header } from "@/app/components/layout/header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col pt-16 pb-22 overflow-hidden min-h-screen">
      <Header />
      <main className="flex-1 min-h-0 mx-auto w-full max-w-100">
        <div key={pathname} className="h-full min-h-0 p-2">
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
}
