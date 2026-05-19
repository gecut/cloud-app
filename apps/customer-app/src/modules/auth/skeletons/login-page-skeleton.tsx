import { Card, Skeleton } from "@heroui/react";

export function LoginPageSkeleton() {
  return (
    <main className="flex-1 size-full flex p-6 items-center justify-center">
      <Card className="w-full max-w-md p-6 overflow-visible">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Skeleton className="size-20 rounded-full -mt-16" />
          <Skeleton className="h-6 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl mt-6" />
        </div>
      </Card>
    </main>
  );
}
