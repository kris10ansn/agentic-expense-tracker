// Compare day sections, collapsible months, and month tabs in the inset workspace.
import { ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../components/inputs";
import { PageHeader } from "../../components/PageHeader";
import { type Expense, formatAmount, formatMonth } from "../../lib/expenses";
import { ExpenseHistory, groupExpenses } from "./ExpenseHistory";
import {
  AddAction,
  CollectionFilter,
  ExpenseSearch,
  type PrototypeWorkspace,
  type VariantOption,
} from "./PrototypeControls";

export type HistoryVariant = "days" | "months" | "month-tabs";

export const historyVariants: VariantOption<HistoryVariant>[] = [
  {
    id: "days",
    name: "Day sections",
    description: "One continuous list with a total for each day",
  },
  {
    id: "months",
    name: "Collapsible months",
    description: "Open a month to see its days and expenses",
  },
  {
    id: "month-tabs",
    name: "Month tabs",
    description: "One month at a time, with daily totals",
  },
];

const monthTabFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export function ExpenseHistoryStudy({
  workspace,
  variant,
}: {
  workspace: PrototypeWorkspace;
  variant: HistoryVariant;
}) {
  const query = workspace.search.trim().toLowerCase();
  const matchingExpenses = workspace.expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(query) &&
      (workspace.selectedCollection === "all" ||
        expense.collectionId === workspace.selectedCollection),
  );
  const visibleExpenses =
    variant === "month-tabs"
      ? matchingExpenses.filter((expense) =>
          expense.date.startsWith(workspace.selectedMonth),
        )
      : matchingExpenses;
  const months = groupExpenses(matchingExpenses, "month");
  const monthOptions = groupExpenses(workspace.expenses, "month");
  function selectExpense(expense: Expense) {
    workspace.setDialog({ kind: "expense", expense });
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        action={
          <AddAction
            workspace={workspace}
            className="shrink-0 rounded-lg bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm"
          />
        }
      />
      <div className="mt-6 mb-5 flex items-center gap-2">
        <ExpenseSearch workspace={workspace} className="flex-1 sm:max-w-64" />
        <CollectionFilter
          workspace={workspace}
          className="w-36 sm:ml-auto sm:w-auto"
        />
      </div>
      {variant === "month-tabs" && (
        <nav
          aria-label="Choose month"
          className="mb-4 flex gap-1 overflow-x-auto border-b border-neutral-200"
        >
          {monthOptions.map((month) => (
            <button
              key={month.date}
              type="button"
              aria-pressed={workspace.selectedMonth === month.date}
              onClick={() => workspace.setSelectedMonth(month.date)}
              className={twMerge(
                "min-h-11 min-w-20 flex-1 shrink-0 cursor-pointer border-b-2 border-transparent px-2 text-xs whitespace-nowrap text-neutral-400 hover:text-neutral-900 sm:flex-none sm:px-5",
                workspace.selectedMonth === month.date &&
                  "border-neutral-900 font-medium text-neutral-900",
              )}
            >
              {monthTabFormatter.format(new Date(`${month.date}-01T12:00:00`))}
            </button>
          ))}
        </nav>
      )}
      {visibleExpenses.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-neutral-500">
            {query ? "No matching expenses." : "No expenses to show."}
          </p>
          {query && (
            <Button
              variant="ghost"
              className="mt-3 text-neutral-900"
              onClick={() => workspace.setSearch("")}
            >
              Clear search
            </Button>
          )}
        </div>
      ) : variant === "months" ? (
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {months.map((month, index) => (
            <details
              key={month.date}
              open={index === 0 || query.length > 0}
              className="group"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 py-3 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 shrink-0 text-neutral-400 group-open:rotate-90" />
                <h2 className="min-w-0 flex-1 text-sm font-medium">
                  {formatMonth(month.date)}
                </h2>
                <span className="shrink-0 text-xs whitespace-nowrap text-neutral-500 tabular-nums">
                  {formatAmount(month.total, 2)} kr
                </span>
              </summary>
              <ExpenseHistory
                expenses={month.expenses}
                collections={workspace.collections}
                onSelectExpense={selectExpense}
                className="pt-1 pb-6"
              />
            </details>
          ))}
        </div>
      ) : (
        <ExpenseHistory
          expenses={visibleExpenses}
          collections={workspace.collections}
          onSelectExpense={selectExpense}
        />
      )}
    </>
  );
}
