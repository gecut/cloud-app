import { Toaster } from "@gecut-cloud/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AlertTriangle } from "lucide-react";
import { Button } from "@gecut-cloud/ui/components/button";
import { ThemeProvider } from "@/components/theme-provider";
import { getValidAccessToken, isAdminAuthenticated } from "@/utils/api-client";

import "../index.css";

export interface RouterAppContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/login") {
      return;
    }
    const token = await getValidAccessToken();
    if (!token || !isAdminAuthenticated()) {
      throw redirect({
        to: "/login",
      });
    }
  },
  errorComponent: ({ reset, error }: any) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center dir-rtl">
      <div className="max-w-md w-full p-6 rounded-2xl border bg-card shadow-lg flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold">خطا در پردازش اطلاعات</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            سیستم در به‌روزرسانی یا رندر اطلاعات با خطای موقت مواجه شد. لطفاً دوباره تلاش کنید.
          </p>
          {error?.message && (
            <p className="mt-3 text-[11px] text-rose-500/90 font-mono bg-rose-500/5 p-2 rounded border border-rose-500/20 text-left dir-ltr break-all">
              {String(error.message)}
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full">
          <Button
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer"
          >
            تلاش مجدد
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1 rounded-xl text-xs cursor-pointer"
          >
            بارگذاری مجدد
          </Button>
        </div>
      </div>
    </div>
  ),
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "gecut-cloud",
      },
      {
        name: "description",
        content: "gecut-cloud is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <Outlet />
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
