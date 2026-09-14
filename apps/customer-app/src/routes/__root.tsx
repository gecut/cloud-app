import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import "./globals.css";

export const Route = createRootRouteWithContext()({
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
