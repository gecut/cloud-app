import { Toast } from "@heroui/react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/api-client";
import { ThemeProvider } from "@/app/providers/theme-provider";

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

