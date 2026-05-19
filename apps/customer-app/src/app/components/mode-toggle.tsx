import { Button } from "@heroui/react";
import { Sun2, MoonStars, Monitor } from "@solar-icons/react-perf/Linear";

import { useTheme } from "@/app/providers/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        onPress={() => setTheme("light")}
      >
        <Sun2 className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        onPress={() => setTheme("dark")}
      >
        <MoonStars className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        onPress={() => setTheme("system")}
      >
        <Monitor className="size-4" />
      </Button>
    </div>
  );
}
