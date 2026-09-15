import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import "./globals.css";

export const Route = createRootRouteWithContext()({
  errorComponent: ({ reset }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center dir-rtl">
      <div className="max-w-md w-full p-6 rounded-2xl border bg-card shadow-lg flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold">
          !
        </div>
        <div>
          <h2 className="text-base font-bold">خطا در بارگذاری بخش مورد نظر</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            سیستم با یک خطای موقت مواجه شد. لطفاً مجدداً امتحان کنید.
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
          >
            تلاش مجدد
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 py-2 px-4 rounded-xl border border-border text-xs font-medium cursor-pointer"
          >
            بارگذاری مجدد
          </button>
        </div>
      </div>
    </div>
  ),
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "gecut-cloud" },
      { name: "description", content: "gecut-cloud is a web application" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}
