import { createContext, type ReactNode, useContext, useState } from "react";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import { WorkspaceDialogs } from "./WorkspaceDialogs";

export type DialogState =
  | { kind: "closed" }
  | { kind: "expense"; expense: Expense | null; collectionId?: string }
  | { kind: "collection"; collection: Collection | null }
  | { kind: "delete-expense"; expense: Expense }
  | { kind: "delete-collection"; collection: Collection };

type WorkspaceData = { expenses: Expense[]; collections: Collection[] };
type WorkspaceContextValue = WorkspaceData & {
  openDialog: (dialog: DialogState) => void;
  addExpense: (collectionId?: string) => void;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace requires WorkspaceProvider.");
  return context;
}

// Only dialog state lives here. Resource data comes from WorkspaceLayout.
export function WorkspaceProvider({
  data,
  children,
}: {
  data: WorkspaceData;
  children: ReactNode;
}) {
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });

  function openDialog(next: DialogState) {
    setDialog(next);
  }

  function addExpense(collectionId?: string) {
    openDialog({
      kind: "expense",
      expense: null,
      ...(collectionId ? { collectionId } : {}),
    });
  }

  function saveExpense(input: ExpenseInput) {
    if (dialog.kind !== "expense") return;
    if (dialog.expense) {
      console.log("Update expense", { id: dialog.expense.id, input });
    } else {
      console.log("Create expense", input);
    }
  }

  function saveCollection(input: CollectionInput) {
    if (dialog.kind !== "collection") return;
    if (dialog.collection) {
      console.log("Update collection", { id: dialog.collection.id, input });
    } else {
      console.log("Create collection", input);
    }
  }

  return (
    <WorkspaceContext value={{ ...data, openDialog, addExpense }}>
      {children}
      <WorkspaceDialogs
        dialog={dialog}
        collections={data.collections}
        expenses={data.expenses}
        pending={false}
        error=""
        onChange={openDialog}
        onSaveExpense={saveExpense}
        onSaveCollection={saveCollection}
        onDeleteExpense={(expense) => console.log("Delete expense", expense)}
        onDeleteCollection={(collection) =>
          console.log("Delete collection", collection)
        }
      />
    </WorkspaceContext>
  );
}
