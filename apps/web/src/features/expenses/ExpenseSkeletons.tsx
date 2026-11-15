import { Skeleton, SkeletonRegion } from "../../components/Skeleton";

function ExpenseRowsSkeleton() {
  return (
    <div className="divide-y divide-neutral-100">
      {["first", "second", "third", "fourth"].map((row) => (
        <div key={row} className="flex min-h-16 items-center gap-4 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 max-w-52" />
            <Skeleton className="h-3 w-2/5 max-w-32" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ExpenseListSkeleton() {
  return (
    <SkeletonRegion label="Loading recent expenses">
      <ExpenseRowsSkeleton />
    </SkeletonRegion>
  );
}

export function ExpenseHistorySkeleton() {
  return (
    <SkeletonRegion
      label="Loading expense history"
      className="border-y border-neutral-200"
    >
      <div className="flex min-h-14 items-center justify-between gap-4 py-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="pb-6">
        <div className="flex min-h-9 items-center justify-between border-b border-neutral-200">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <ExpenseRowsSkeleton />
      </div>
    </SkeletonRegion>
  );
}

export function ExpenseDialogSkeleton() {
  return (
    <SkeletonRegion label="Loading expense form" className="mt-6 space-y-5">
      {["title", "amount", "currency", "category", "collection"].map(
        (field) => (
          <div key={field} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ),
      )}
    </SkeletonRegion>
  );
}
