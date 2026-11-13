import { AddButton } from "../components/AddButton";
import { PageHeader } from "../components/PageHeader";
import { CollectionList } from "../features/collections/CollectionList";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";

export function CollectionsPage() {
  const { collections, expenses, openDialog } = useWorkspace();
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
        <CollectionList
          collections={collections}
          expenses={expenses}
          onEdit={(collection) =>
            openDialog({ kind: "collection", collection })
          }
          onDelete={(collection) =>
            openDialog({ kind: "delete-collection", collection })
          }
        />
      </div>
    </>
  );
}
