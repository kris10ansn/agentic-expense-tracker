import { AddButton } from "../components/AddButton";
import { Button } from "../components/inputs";
import { PageHeader } from "../components/PageHeader";
import { ExpenseFilters } from "../features/expenses/ExpenseFilters";
import { ExpenseHistory } from "../features/expenses/ExpenseHistory";
import type { ExpenseSearch } from "../features/expenses/search";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";

export function ExpensesPage({
  search,
  onSearchChange,
}: {
  search: ExpenseSearch;
  onSearchChange: (search: ExpenseSearch, replace?: boolean) => void;
}) {
  const { expenses, collections, addExpense, openDialog } = useWorkspace();
  const query = search.q?.trim().toLowerCase() ?? "";
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(query) &&
      (!search.collection || expense.collectionId === search.collection),
  );
  const filtered = Boolean(query || search.collection);
  return (
    <>
      <PageHeader
        title="Expenses"
        action={
          <AddButton
            onClick={() =>
              addExpense(
                collections.find((item) => item.id === search.collection)?.id,
              )
            }
          >
            {collections.length ? "Add expense" : "New collection"}
          </AddButton>
        }
      />
      <ExpenseFilters
        collections={collections}
        value={search}
        onChange={onSearchChange}
      />
      {filteredExpenses.length ? (
        <ExpenseHistory
          key={`${query}:${search.collection ?? ""}`}
          expenses={filteredExpenses}
          collections={collections}
          filtered={filtered}
          onSelectExpense={(expense) =>
            openDialog({ kind: "expense", expense })
          }
        />
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-neutral-500">
            {filtered ? "No matching expenses." : "No expenses to show."}
          </p>
          <Button
            variant="ghost"
            className="mt-3 text-neutral-900"
            onClick={() => (filtered ? onSearchChange({}) : addExpense())}
          >
            {filtered ? "Clear filters" : "Add your first expense"}
          </Button>
        </div>
      )}
    </>
  );
}
