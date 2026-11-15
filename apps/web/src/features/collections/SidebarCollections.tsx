import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { QueryError } from "../../components/QueryError";
import { trpc } from "../../trpc";
import { CollectionLinksSkeleton } from "./CollectionSkeletons";

export function SidebarCollections() {
  const query = useQuery(trpc.collections.list.queryOptions());
  const error = query.isError ? (
    <QueryError
      message={
        query.data
          ? "Unable to refresh collections. Showing previous data."
          : "Unable to load collections."
      }
      onRetry={() => void query.refetch()}
      retrying={query.isFetching}
    />
  ) : null;

  if (!query.data) return error ?? <CollectionLinksSkeleton />;

  return (
    <>
      {error}
      {query.data.map((collection) => (
        <Link
          key={collection.id}
          to="/expenses"
          search={{ collection: collection.id }}
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-xs text-neutral-500 hover:bg-neutral-200/50"
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: collection.color }}
          />
          <span className="truncate">{collection.title}</span>
        </Link>
      ))}
    </>
  );
}
