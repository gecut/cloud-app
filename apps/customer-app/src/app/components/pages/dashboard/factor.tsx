import { Button } from "@heroui/react";

export function Factor({ price }: { price: number }) {
  return (
    <div className="w-full flex items-center bg-surface bg-tertiary px-8 py-3 rounded-2xl gap-2 text-sm">
      <span className="flex-1">صورتحساب</span>
      {price.toLocaleString("fa-IR")}
      <Button
        variant="primary"
        className="rounded-md p-4 text-center text-sm font-light"
        size="sm"
      >
        پرداخت
      </Button>
    </div>
  );
}
