import { buttonVariants, cn } from "@heroui/styles";
import { Link, ToPathOption, useLocation } from "@tanstack/react-router";
import {
  Widget5Linear,
  Widget5Bold,
  WalletMoneyLinear,
  WalletMoneyBold,
  ChatRoundDotsLinear,
  ChatRoundDotsBold,
} from "@solar-icons/react-perf";
import type { Icon } from "@solar-icons/react-perf/lib/types";

type NavigationItemType = {
  label: string;
  icon: Icon;
  activeIcon: Icon;
  href: ToPathOption;
};

const NAVIGATION_ITEMS: Record<string, NavigationItemType> = {
  dashboard: {
    label: "داشبورد",
    icon: Widget5Linear,
    activeIcon: Widget5Bold,
    href: "/",
  },
  payments: {
    label: "مالی",
    icon: WalletMoneyLinear,
    activeIcon: WalletMoneyBold,
    href: "/payments",
  },
  supports: {
    label: "پشتیبانی",
    icon: ChatRoundDotsLinear,
    activeIcon: ChatRoundDotsBold,
    href: "/supports",
  },
  services: {
    label: "سرویس ها",
    icon: ChatRoundDotsLinear,
    activeIcon: ChatRoundDotsBold,
    href: "/services",
  },
};

export function Navigation() {
  const { pathname } = useLocation();

  return (
    <footer
      className={cn(
        "p-2 fixed inset-x-0 bottom-0 z-50",
        "border-t border-t-border bg-overlay",
        "supports-[backdrop-filter]:backdrop-blur-sm supports-[backdrop-filter]:bg-overlay/80",
      )}
    >
      <nav
        className={cn(
          "w-full flex items-center justify-between h-full px-6",
          "max-w-md mx-auto",
        )}
      >
        {Object.keys(NAVIGATION_ITEMS).map((key) => {
          const item = NAVIGATION_ITEMS[key];
          const isSelected = item.href.split("/")[1] === pathname.split("/")[1];
          const isCurrent = item.href === pathname;

          return (
            <div key={key} className="flex-1 flex justify-center">
              <Link
                to={item.href}
                className={buttonVariants({
                  className: [
                    "flex flex-col gap-0 items-center justify-center h-min",
                    "text-accent bg-transparent! transform-none! group",
                    isCurrent && "pointer-events-none",
                  ],
                  variant: "ghost",
                })}
              >
                <div
                  className={cn(
                    "relative rounded-3xl",
                    "transition-[width,height,background-color,color] duration-300",
                    isSelected
                      ? "size-12 bg-accent text-accent-foreground delay-150"
                      : "size-6 bg-transparent text-accent",
                  )}
                >
                  <item.icon
                    className={cn(
                      "absolute inset-0 size-6 transition-opacity duration-300 m-auto",
                      isSelected
                        ? "opacity-0"
                        : "opacity-100 group-hover:opacity-0",
                    )}
                  />
                  <item.activeIcon
                    className={cn(
                      "absolute inset-0 size-6 transition-opacity duration-300 m-auto",
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "overflow-hidden transition-[max-height,padding] duration-150",
                    "text-xs font-normal",
                    isSelected ? "max-h-0 pt-0" : "max-h-8 pt-1.5",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </footer>
  );
}
