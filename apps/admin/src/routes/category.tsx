import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/category")({
  beforeLoad: () => {
    throw redirect({
      to: "/categories",
    });
  },
});
