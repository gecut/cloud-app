import { Chip } from "@heroui/react";
import { Sun2 } from "@solar-icons/react-perf/BoldDuotone";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Chip
      size="md"
      variant="tertiary"
      className="cursor-pointer select-none"
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      <Sun2 className="size-5" />
    </Chip>
  );
}
