import { Check } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import {
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "../collections/mutations";
import {
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "../expenses/mutations";
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
  const updateCollection = useUpdateCollection();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(operation: () => Promise<unknown>, message: string) {
    setError("");
    setPending(true);
    try {
      await operation();
      setDialog({ kind: "closed" });
      setNotice(message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save changes. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

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
    const { expense } = dialog;
    const isCreate = expense === null;

    const message = isCreate ? "Expense added." : "Expense updated.";
    const action = () =>
      isCreate
        ? createExpense.mutateAsync(input)
        : updateExpense.mutateAsync({ ...expense, ...input });

    save(action, message);
  }

  function saveCollection(input: CollectionInput) {
    if (dialog.kind !== "collection") return;

    const { collection } = dialog;
    const isCreate = collection === null;

    const message = isCreate ? "Collection created." : "Collection updated.";
    const action = () =>
      isCreate
        ? createCollection.mutateAsync(input)
        : updateCollection.mutateAsync({ ...collection, ...input });

    save(action, message);
  }

  function onDeleteCollection(collection: Collection) {
    save(
      () => deleteCollection.mutateAsync({ id: collection.id }),
      "Collection and its expenses deleted.",
    );
  }

  function onDeleteExpense(expense: Expense) {
    save(
      () => deleteExpense.mutateAsync({ id: expense.id }),
      "Expense deleted.",
    );
  }

  return (
    <WorkspaceContext value={{ ...data, openDialog, addExpense }}>
      {children}
      <WorkspaceDialogs
        dialog={dialog}
        collections={data.collections}
        expenses={data.expenses}
        pending={pending}
        error={error}
        onChange={openDialog}
        onSaveExpense={saveExpense}
        onSaveCollection={saveCollection}
        onDeleteExpense={onDeleteExpense}
        onDeleteCollection={onDeleteCollection}
      />
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-40 z-40 flex justify-center"
      >
        {notice && (
          <div className="flex max-w-full items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
            <Check className="size-4 shrink-0" />
            {notice}
          </div>
        )}
      </div>
    </WorkspaceContext>
  );
}
