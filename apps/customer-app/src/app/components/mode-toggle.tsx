import { Chip } from "@heroui/react";
import { Sun2 } from "@solar-icons/react-perf/BoldDuotone";
import { useTheme } from "@/app/providers/theme-provider";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-4">
      <Chip
        size="lg"
        variant="tertiary"
        onClick={() => {
          setTheme(theme === "dark" ? "light" : "dark");
        }}
      >
        <Sun2 className="size-6 animate-spin-fast" />
      </Chip>
    </div>
  );
}
