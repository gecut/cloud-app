import { Card, Skeleton } from "@heroui/react";

export function DashboardPageSkeleton() {
  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col py-6">
      <div className="w-full overflow-hidden shrink-0 pb-4">
        <div className="flex -ms-4 px-4 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="flex-[0_0_calc(100%-(var(--spacing)_*_20))] p-5 rounded-3xl">
              <Skeleton className="h-4 w-24 rounded-lg mb-3" />
              <Skeleton className="h-6 w-40 rounded-lg mb-6" />
              <Skeleton className="h-4 w-28 rounded-lg mb-3" />
              <Skeleton className="h-6 w-36 rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
      <div className="px-6 flex-1 min-h-0">
        <Card className="h-full rounded-3xl p-5">
          <Skeleton className="h-5 w-32 rounded-lg mb-4" />
          <Skeleton className="h-4 w-full rounded-lg mb-2" />
          <Skeleton className="h-4 w-11/12 rounded-lg mb-4" />
          <Skeleton className="h-full min-h-40 rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}
