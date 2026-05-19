import { Toast } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { queryClient } from "@/lib/orpc";

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="customer-app-theme"
      >
        {children}
        <Toast.Provider />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
