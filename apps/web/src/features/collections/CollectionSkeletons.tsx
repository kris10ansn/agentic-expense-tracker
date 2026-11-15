import { Skeleton, SkeletonRegion } from "../../components/Skeleton";

export function CollectionListSkeleton() {
  return (
    <SkeletonRegion
      label="Loading collections"
      className="divide-y divide-neutral-200/70"
    >
      {["first", "second", "third"].map((row) => (
        <div key={row} className="flex items-center gap-4 py-5">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 max-w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="mx-3 size-5 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function CollectionLinksSkeleton() {
  return (
    <SkeletonRegion label="Loading sidebar collections">
      {["first", "second", "third"].map((row) => (
        <div key={row} className="flex min-h-10 items-center gap-3 px-3">
          <Skeleton className="size-1.5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function CollectionSelectSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label} className="flex h-11 w-36 items-center">
      <Skeleton className="h-9 w-full rounded-lg" />
    </SkeletonRegion>
  );
}
