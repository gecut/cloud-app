import { ModeToggle } from "@/app/components/mode-toggle";

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 border-b border-b-border bg-surface supports-[backdrop-filter]:backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80 h-16 z-50">
      <nav className="w-full max-w-md mx-auto flex items-center justify-between px-6">
        <div>Hello World</div>
        <ModeToggle />
      </nav>
    </header>
  );
}
