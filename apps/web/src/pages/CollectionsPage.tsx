import { useQuery } from "@tanstack/react-query";
import { AddButton } from "../components/AddButton";
import { PageHeader } from "../components/PageHeader";
import { QueryError } from "../components/QueryError";
import { CollectionList } from "../features/collections/CollectionList";
import { CollectionListSkeleton } from "../features/collections/CollectionSkeletons";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";
import { trpc } from "../trpc";

export function CollectionsPage() {
  const { openDialog } = useWorkspace();
  return (
    <>
      <PageHeader
        title="Collections"
        action={
          <AddButton
            onClick={() => openDialog({ kind: "collection", collection: null })}
          >
            New collection
          </AddButton>
        }
      />
      <div className="mt-6">
        <CollectionsContent />
      </div>
    </>
  );
}

function CollectionsContent() {
  const { openDialog } = useWorkspace();
  const collections = useQuery(trpc.collections.list.queryOptions());
  const expenses = useQuery(trpc.expenses.list.queryOptions());
  const error =
    collections.isError || expenses.isError ? (
      <QueryError
        message={
          collections.data && expenses.data
            ? "Unable to refresh collections. Showing previous data."
            : "Unable to load collections."
        }
        onRetry={() => {
          void collections.refetch();
          void expenses.refetch();
        }}
        retrying={collections.isFetching || expenses.isFetching}
      />
    ) : null;

  if (!collections.data || !expenses.data) {
    return error ?? <CollectionListSkeleton />;
  }

  return (
    <>
      {error}
      <CollectionList
        collections={collections.data}
        expenses={expenses.data}
        onEdit={(collection) => openDialog({ kind: "collection", collection })}
        onDelete={(collection) =>
          openDialog({ kind: "delete-collection", collection })
        }
      />
    </>
  );
}
