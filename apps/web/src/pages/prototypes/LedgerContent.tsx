import { categories, formatAmount, formatDate } from "../../lib/expenses";
import { PendingExpenseRow } from "./PendingExpenseRow";
import {
  AddAction,
  CollectionFilter,
  EmptyExpenses,
  ExpenseSearch,
  MonthFilter,
  PrototypeCollectionList,
  type PrototypeProps,
} from "./PrototypeControls";

function ExpenseTable({ workspace }: PrototypeProps) {
  if (!workspace.filteredExpenses.length)
    return <EmptyExpenses workspace={workspace} />;
  const collectionNames = new Map(
    workspace.collections.map((collection) => [collection.id, collection.name]),
  );
  return (
    <>
      <div className="hidden grid-cols-12 gap-4 border-y border-neutral-200 py-3 text-xs text-neutral-500 md:grid">
        <span className="col-span-5">Expense</span>
        <span className="col-span-2">Date</span>
        <span className="col-span-3">Collection</span>
        <span className="col-span-2 text-right">Amount</span>
      </div>
      <ul className="divide-y divide-neutral-100">
        {!workspace.search && workspace.selectedCollection === "all" && (
          <li>
            <PendingExpenseRow />
          </li>
        )}
        {workspace.filteredExpenses.map((expense) => (
          <li key={expense.id}>
            <button
              type="button"
              aria-label={`View ${expense.title}`}
              className="grid w-full cursor-pointer grid-cols-12 items-center gap-3 py-4 text-left hover:bg-neutral-50 md:gap-4"
              onClick={() => workspace.setDialog({ kind: "expense", expense })}
            >
              <span className="col-span-8 min-w-0 md:col-span-5">
                <span className="block truncate text-sm font-medium">
                  {expense.title}
                </span>
                <span className="mt-1.5 block truncate text-xs text-neutral-500">
                  {categories[expense.category].label}
                  <span className="md:hidden">
                    {" "}
                    · {formatDate(expense.date)}
                  </span>
                </span>
              </span>
              <span className="col-span-2 hidden text-xs text-neutral-500 md:block">
                {formatDate(expense.date)}
              </span>
              <span className="col-span-3 hidden truncate text-xs text-neutral-500 md:block">
                {collectionNames.get(expense.collectionId)}
              </span>
              <span className="col-span-4 text-right text-sm whitespace-nowrap tabular-nums md:col-span-2">
                {formatAmount(expense.amount, 2)}
                <span className="ml-1 text-xs text-neutral-400">kr</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function LedgerContent({ workspace }: PrototypeProps) {
  const isSettings = workspace.view === "settings";
  const isExpenses = workspace.view === "expenses";
  const title = isSettings
    ? "Settings"
    : isExpenses
      ? "Expenses"
      : "Collections";
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {!isSettings && (
          <AddAction
            workspace={workspace}
            className="shrink-0 rounded-lg bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm"
          />
        )}
      </div>
      {!isSettings && (
        <>
          <div className="mt-7 mb-5 flex flex-wrap items-center gap-2">
            {isExpenses && (
              <ExpenseSearch
                workspace={workspace}
                className="w-full sm:mr-auto sm:w-56"
              />
            )}
            <MonthFilter
              workspace={workspace}
              className="flex-1 sm:flex-none"
            />
            {isExpenses && (
              <CollectionFilter
                workspace={workspace}
                className="w-auto flex-1 sm:flex-none"
              />
            )}
          </div>
          {isExpenses ? (
            <ExpenseTable workspace={workspace} />
          ) : (
            <PrototypeCollectionList workspace={workspace} />
          )}
          <p className="mt-7 border-t border-neutral-100 pt-5 text-xs text-neutral-400">
            Mock data · changes reset on refresh
          </p>
        </>
      )}
    </>
  );
}
