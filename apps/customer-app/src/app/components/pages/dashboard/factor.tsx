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
    <div className="w-full flex items-center bg-surface px-6 py-4 rounded-[20px] gap-2 text-sm font-light border border-border/40 shadow-xs">
      <span className="flex-1 text-muted-foreground">{title}</span>
      <span className="font-semibold text-foreground text-base">
        {numericPrice.toLocaleString("fa-IR")}{" "}
        <span className="text-xs text-muted-foreground font-normal">تومان</span>
      </span>
      {showAction && (
        <Button
          variant="primary"
          className="rounded-xl px-5 py-2 text-center text-xs font-medium mr-2 cursor-pointer shadow-xs"
          size="sm"
          onPress={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
