import { Check } from "lucide-react";
import { demoMonth } from "../../data/demo";
import type { ExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import { CollectionDialog } from "./CollectionDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExpenseDialog } from "./ExpenseDialog";

export function WorkspaceDialogs({
  workspace,
  showBudgets = true,
}: {
  workspace: ExpenseWorkspace;
  showBudgets?: boolean;
}) {
  const {
    dialog,
    collections,
    expenses,
    notice,
    selectedCollection,
    selectedMonth,
    saveExpense,
    saveCollection,
    closeDialog,
    deleteExpense,
    deleteCollection,
    setDialog,
  } = workspace;
  return (
    <>
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
      {dialog.kind === "expense" && (
        <ExpenseDialog
          expense={dialog.expense}
          collections={collections}
          defaultCollectionId={
            selectedCollection === "all"
              ? (collections[0]?.id ?? "")
              : selectedCollection
          }
          defaultDate={`${selectedMonth}-${selectedMonth === demoMonth ? "12" : "01"}`}
          onSave={saveExpense}
          onDelete={(expense) => setDialog({ kind: "delete-expense", expense })}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === "collection" && (
        <CollectionDialog
          showBudget={showBudgets}
          collection={dialog.collection}
          onSave={saveCollection}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === "delete-expense" && (
        <ConfirmDialog
          title={`Delete ${dialog.expense.title}?`}
          description="This expense will be removed from its collection. This can't be undone."
          onClose={() =>
            setDialog({ kind: "expense", expense: dialog.expense })
          }
          onConfirm={() => deleteExpense(dialog.expense)}
        />
      )}
      {dialog.kind === "delete-collection" && (
        <ConfirmDialog
          title={`Delete ${dialog.collection.name}?`}
          description={`This will delete the collection and all ${expenses.filter((item) => item.collectionId === dialog.collection.id).length} of its expenses across every month. This can't be undone.`}
          onClose={closeDialog}
          onConfirm={() => deleteCollection(dialog.collection)}
        />
      )}
    </>
  );
}
