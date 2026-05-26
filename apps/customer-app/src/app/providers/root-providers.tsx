import { Toast } from "@heroui/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/app/providers/theme-provider";

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="customer-app-theme"
    >
      {children}
      <Toast.Provider />
    </ThemeProvider>
  );
}
