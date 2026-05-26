import { Button } from "@heroui/react";

export function Factor({ price }: { price: number }) {
  return (
    <div className="w-full flex items-center  bg-surface bg-tertiary py-4 px-8 rounded-3xl gap-2">
      <span className="flex-1">صورتحساب</span>
      {price.toLocaleString("fa-IR")}
      <Button variant="primary" className="rounded-xl p-4 text-center" size="lg">
        پرداخت
      </Button>
    </div>
  );
}
