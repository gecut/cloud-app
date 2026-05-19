import type { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr]">
      {header}
      <main className="p-4">
        <div>Hello World</div>
        {children}
      </main>
    </div>
  );
}
