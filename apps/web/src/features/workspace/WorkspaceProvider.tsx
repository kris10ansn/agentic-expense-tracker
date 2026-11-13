import { useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { mockApi } from "../../data/mock-api";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../../lib/expenses";
import { WorkspaceDialogs } from "./WorkspaceDialogs";

const NOTICE_DURATION_MS = 4500;

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

// Only UI state lives here. Resource data comes from the route loader.
export function WorkspaceProvider({
  data,
  children,
}: {
  data: WorkspaceData;
  children: ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openDialog(next: DialogState) {
    if (pending) return;
    setError("");
    setDialog(next);
  }

  function addExpense(collectionId?: string) {
    openDialog(
      data.collections.length
        ? {
            kind: "expense",
            expense: null,
            ...(collectionId ? { collectionId } : {}),
          }
        : { kind: "collection", collection: null },
    );
  }

  async function save(operation: () => Promise<unknown>, message: string) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await operation();
      await router.invalidate();
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

  function saveExpense(input: ExpenseInput) {
    if (dialog.kind !== "expense") return;
    const expense = dialog.expense;
    void save(
      () =>
        expense
          ? mockApi.expenses.update(expense.id, input)
          : mockApi.expenses.create(input),
      expense ? "Expense updated." : "Expense added.",
    );
  }

  function saveCollection(input: CollectionInput) {
    if (dialog.kind !== "collection") return;
    const collection = dialog.collection;
    void save(
      () =>
        collection
          ? mockApi.collections.update(collection.id, input)
          : mockApi.collections.create(input),
      collection ? "Collection updated." : "Collection created.",
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
        onDeleteExpense={(expense) =>
          void save(
            () => mockApi.expenses.delete(expense.id),
            "Expense deleted.",
          )
        }
        onDeleteCollection={(collection) =>
          void save(
            () => mockApi.collections.delete(collection.id),
            "Collection and its expenses deleted.",
          )
        }
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
