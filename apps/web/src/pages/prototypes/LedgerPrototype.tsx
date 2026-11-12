import { ArrowUpRight } from "lucide-react";
import { categories, formatAmount, formatDate } from "../../lib/expenses";
import {
  AddAction,
  CollectionFilter,
  EmptyExpenses,
  ExpenseSearch,
  MonthFilter,
  PrototypeCollectionList,
  type PrototypeProps,
  WorkspaceTabs,
} from "./PrototypeControls";

export function LedgerPrototype({ workspace }: PrototypeProps) {
  const isExpenses = workspace.view === "expenses";
  return (
    <div className="font-inter min-h-dvh bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-10">
          <a href="/" className="text-lg font-semibold tracking-tight">
            expenses<span className="text-blue-600">.</span>
          </a>
          <span className="text-xs text-neutral-400">Personal / NOK</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pt-8 pb-32 sm:px-10 sm:pt-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isExpenses ? "Expenses" : "Collections"}
            </h1>
            <p className="mt-3 text-sm text-neutral-500">
              {isExpenses
                ? `${workspace.visibleExpenses.length} expenses this month`
                : `${workspace.collections.length} collections`}
            </p>
          </div>
          <AddAction
            workspace={workspace}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          />
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200">
          <WorkspaceTabs workspace={workspace} />
          <div className="pb-3">
            <MonthFilter
              workspace={workspace}
              className="min-h-9 border-0 px-0"
            />
          </div>
        </div>
        {isExpenses ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div className="flex min-w-0 flex-1 gap-2">
                <ExpenseSearch workspace={workspace} className="w-36 sm:w-52" />
                <CollectionFilter workspace={workspace} />
              </div>
              <p className="text-xl font-medium tracking-tight whitespace-nowrap tabular-nums">
                {formatAmount(workspace.spent, 2)}
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  NOK
                </span>
              </p>
            </div>
            <div className="hidden grid-cols-12 gap-4 border-y border-neutral-200 py-3 text-xs text-neutral-500 sm:grid">
              <span className="col-span-5">Expense</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-3">Collection</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            {workspace.filteredExpenses.length ? (
              <ul className="divide-y divide-neutral-100">
                {workspace.filteredExpenses.map((expense) => (
                  <li key={expense.id}>
                    <button
                      type="button"
                      aria-label={`View ${expense.title}`}
                      className="grid w-full cursor-pointer grid-cols-12 items-center gap-3 py-4 text-left hover:bg-neutral-50 sm:gap-4"
                      onClick={() =>
                        workspace.setDialog({ kind: "expense", expense })
                      }
                    >
                      <span className="col-span-8 min-w-0 sm:col-span-5">
                        <span className="block truncate text-sm font-medium">
                          {expense.title}
                        </span>
                        <span className="mt-1.5 block text-xs text-neutral-400">
                          {categories[expense.category].label}
                          <span className="sm:hidden">
                            {" "}
                            · {formatDate(expense.date)}
                          </span>
                        </span>
                      </span>
                      <span className="col-span-2 hidden text-xs text-neutral-500 sm:block">
                        {formatDate(expense.date)}
                      </span>
                      <span className="col-span-3 hidden truncate text-xs text-neutral-500 sm:block">
                        {
                          workspace.collections.find(
                            (item) => item.id === expense.collectionId,
                          )?.name
                        }
                      </span>
                      <span className="col-span-4 text-right text-sm tabular-nums sm:col-span-2">
                        {formatAmount(expense.amount, 2)}
                        <span className="ml-1 text-xs text-neutral-400">
                          kr
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyExpenses workspace={workspace} />
            )}
          </>
        ) : (
          <PrototypeCollectionList workspace={workspace} />
        )}
        <footer className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200 pt-5 text-xs text-neutral-400">
          <span>Mock data · resets on refresh</span>
          <a
            href="/playground"
            className="flex min-h-11 items-center gap-1 hover:text-neutral-700"
          >
            Playground
            <ArrowUpRight className="size-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}
