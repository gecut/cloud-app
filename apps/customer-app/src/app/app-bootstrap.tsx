import { RouterProvider, createRouter } from "@tanstack/react-router";

import { queryClient } from "@/lib/orpc";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: { queryClient },
  defaultViewTransition: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppBootstrap() {
  return <RouterProvider router={router} />;
}
