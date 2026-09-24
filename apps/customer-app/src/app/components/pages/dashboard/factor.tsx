import { Button } from "@heroui/react";

export interface FactorProps {
  price?: number | string;
  title?: string;
  actionText?: string;
  showAction?: boolean;
  onAction?: () => void;
}

export function Factor({
  price,
  title = "مبلغ قابل پرداخت",
  actionText = "پرداخت",
  showAction = true,
  onAction,
}: FactorProps) {
  const numericPrice = typeof price === "number" ? price : Number(price) || 0;

  return (
    <div className="w-full flex flex-col bg-surface p-4 sm:p-5 rounded-[20px] gap-3.5 text-sm border border-border/40 shadow-xs">
      <div className="w-full flex items-center justify-between gap-3 min-w-0">
        <span className="text-muted-foreground text-xs sm:text-sm font-medium truncate">{title}</span>
        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm sm:text-base whitespace-nowrap">
          <span>{numericPrice.toLocaleString("fa-IR")}</span>
          <span className="text-xs text-muted-foreground font-normal">تومان</span>
        </div>
      </div>
      {showAction && (
        <Button
          variant="primary"
          className="w-full rounded-xl py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium cursor-pointer shadow-xs whitespace-nowrap"
          size="md"
          onPress={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
