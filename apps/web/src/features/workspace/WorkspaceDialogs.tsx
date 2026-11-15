import { useQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { QueryError } from "../../components/QueryError";
import { Skeleton, SkeletonRegion } from "../../components/Skeleton";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import { toDateInput } from "../../lib/expenses";
import { trpc } from "../../trpc";
import { CollectionDialog } from "../collections/CollectionDialog";
import { ExpenseDialog } from "../expenses/ExpenseDialog";
import type { DialogState } from "./WorkspaceProvider";

export function WorkspaceDialogs({
  dialog,
  pending,
  error,
  onChange,
  onSaveExpense,
  onSaveCollection,
  onDeleteExpense,
  onDeleteCollection,
}: {
  dialog: DialogState;
  pending: boolean;
  error: string;
  onChange: (dialog: DialogState) => void;
  onSaveExpense: (input: ExpenseInput) => void;
  onSaveCollection: (input: CollectionInput) => void;
  onDeleteExpense: (expense: Expense) => void;
  onDeleteCollection: (collection: Collection) => void;
}) {
  const shared = {
    pending,
    error,
    onClose: () => onChange({ kind: "closed" }),
  };
  switch (dialog.kind) {
    case "closed":
      return null;
    case "expense":
      return (
        <ExpenseDialog
          {...shared}
          expense={dialog.expense}
          defaultCollectionId={dialog.collectionId ?? ""}
          defaultDate={toDateInput(new Date())}
          onSave={onSaveExpense}
          onDelete={(expense) => onChange({ kind: "delete-expense", expense })}
        />
      );
    case "collection":
      return (
        <CollectionDialog
          {...shared}
          collection={dialog.collection}
          onSave={onSaveCollection}
        />
      );
    case "delete-expense":
      return (
        <ConfirmDialog
          {...shared}
          title={`Delete ${dialog.expense.title}?`}
          description="This expense will be removed from its collection. This can't be undone."
          onClose={() => onChange({ kind: "expense", expense: dialog.expense })}
          onConfirm={() => onDeleteExpense(dialog.expense)}
        />
      );
    case "delete-collection":
      return (
        <DeleteCollectionDialog
          {...shared}
          collection={dialog.collection}
          onConfirm={() => onDeleteCollection(dialog.collection)}
        />
      );
  }
}

function DeleteCollectionDialog({
  collection,
  ...props
}: Pick<
  ComponentProps<typeof ConfirmDialog>,
  "onClose" | "onConfirm" | "pending" | "error"
> & { collection: Collection }) {
  const expenses = useQuery(trpc.expenses.list.queryOptions());
  let description = "Review this collection before deleting it.";
  if (expenses.data) {
    description =
      "This will permanently delete the collection. This can't be undone.";
    if (expenses.data.some((item) => item.collectionId === collection.id)) {
      description =
        "Move or remove this collection's expenses before deleting it.";
    }
  }

  return (
    <ConfirmDialog
      {...props}
      title={`Delete ${collection.title}?`}
      description={description}
      confirmDisabled={!expenses.data}
    >
      {expenses.isError && (
        <QueryError
          message={
            expenses.data
              ? "Unable to refresh expenses. Showing previous data."
              : "Unable to load this collection's expenses."
          }
          onRetry={() => void expenses.refetch()}
          retrying={expenses.isFetching}
        />
      )}
      {!expenses.data && !expenses.isError && (
        <SkeletonRegion
          label="Loading collection expenses"
          className="mt-5 space-y-2"
        >
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </SkeletonRegion>
      )}
    </ConfirmDialog>
  );
}
