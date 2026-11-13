import { ConfirmDialog } from "../../components/ConfirmDialog";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import { CollectionDialog } from "../collections/CollectionDialog";
import { ExpenseDialog } from "../expenses/ExpenseDialog";
import type { DialogState } from "./WorkspaceProvider";

function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

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
          defaultCollectionId={dialog.collectionId ?? collections[0]?.id ?? ""}
          defaultDate={today()}
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
          title={`Delete ${dialog.collection.name}?`}
          description={`This will delete the collection and all ${expenses.filter((item) => item.collectionId === dialog.collection.id).length} of its expenses across every month. This can't be undone.`}
          onConfirm={() => onDeleteCollection(dialog.collection)}
        />
      );
  }
}
