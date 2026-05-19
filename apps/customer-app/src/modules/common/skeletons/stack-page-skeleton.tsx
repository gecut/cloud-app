import { Skeleton } from "@heroui/react";

export function StackPageSkeleton() {
  return (
    <div className="w-full px-6 py-6 space-y-4">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}
