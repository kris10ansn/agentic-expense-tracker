import { ConfirmDialog } from "../../components/ConfirmDialog";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import { toDateInput } from "../../lib/expenses";
import { CollectionDialog } from "../collections/CollectionDialog";
import { ExpenseDialog } from "../expenses/ExpenseDialog";
import type { DialogState } from "./WorkspaceProvider";

export function WorkspaceDialogs({
  dialog,
  collections,
  expenses,
  pending,
  error,
  onChange,
  onSaveExpense,
  onSaveCollection,
  onDeleteExpense,
  onDeleteCollection,
}: {
  dialog: DialogState;
  collections: Collection[];
  expenses: Expense[];
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
          collections={collections}
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
        <ConfirmDialog
          {...shared}
          title={`Delete ${dialog.collection.title}?`}
          description={
            expenses.some((item) => item.collectionId === dialog.collection.id)
              ? "Move or remove this collection's expenses before deleting it."
              : "This will permanently delete the collection. This can't be undone."
          }
          onConfirm={() => onDeleteCollection(dialog.collection)}
        />
      );
  }
}
