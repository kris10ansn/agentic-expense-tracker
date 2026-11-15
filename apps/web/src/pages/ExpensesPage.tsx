import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { AddButton } from "../components/AddButton";
import { Button } from "../components/inputs";
import { PageHeader } from "../components/PageHeader";
import { QueryError } from "../components/QueryError";
import { ExpenseFilters } from "../features/expenses/ExpenseFilters";
import { ExpenseHistory } from "../features/expenses/ExpenseHistory";
import { ExpenseHistorySkeleton } from "../features/expenses/ExpenseSkeletons";
import type { ExpenseSearch } from "../features/expenses/search";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";
import { trpc } from "../trpc";

const route = getRouteApi("/_app/expenses");

export function ExpensesPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { addExpense } = useWorkspace();
  const collections = useQuery(trpc.collections.list.queryOptions());

  function onSearchChange(search: ExpenseSearch, replace = false) {
    void navigate({ search, replace, resetScroll: false });
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        action={
          <AddButton
            disabled={Boolean(search.collection) && !collections.data}
            onClick={() =>
              addExpense(
                collections.data?.find((item) => item.id === search.collection)
                  ?.id,
              )
            }
          >
            Add expense
          </AddButton>
        }
      />
      <ExpenseFilters value={search} onChange={onSearchChange} />
      <ExpenseResults
        search={search}
        onClearFilters={() => onSearchChange({})}
      />
    </>
  );
}

function ExpenseResults({
  search,
  onClearFilters,
}: {
  search: ExpenseSearch;
  onClearFilters: () => void;
}) {
  const { addExpense, openDialog } = useWorkspace();
  const expenses = useQuery(trpc.expenses.list.queryOptions());
  const collections = useQuery(trpc.collections.list.queryOptions());
  const error =
    expenses.isError || collections.isError ? (
      <QueryError
        message={
          expenses.data && collections.data
            ? "Unable to refresh expenses. Showing previous data."
            : "Unable to load expenses."
        }
        onRetry={() => {
          void expenses.refetch();
          void collections.refetch();
        }}
        retrying={expenses.isFetching || collections.isFetching}
      />
    ) : null;

  if (!expenses.data || !collections.data) {
    return error ?? <ExpenseHistorySkeleton />;
  }

  const query = search.q?.trim().toLowerCase() ?? "";
  const filteredExpenses = expenses.data.filter(
    (expense) =>
      expense.title.toLowerCase().includes(query) &&
      (!search.collection || expense.collectionId === search.collection),
  );
  const filtered = Boolean(query || search.collection);

  return (
    <>
      {error}
      {filteredExpenses.length ? (
        <ExpenseHistory
          key={`${query}:${search.collection ?? ""}`}
          expenses={filteredExpenses}
          collections={collections.data}
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
            onClick={() => (filtered ? onClearFilters() : addExpense())}
          >
            {filtered ? "Clear filters" : "Add your first expense"}
          </Button>
        </div>
      )}
    </>
  );
}
