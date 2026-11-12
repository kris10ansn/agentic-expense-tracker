import { ArrowUpRight } from "lucide-react";
import {
  categories,
  type Expense,
  formatAmount,
  formatDate,
} from "../../lib/expenses";
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

export function JournalPrototype({ workspace }: PrototypeProps) {
  const isExpenses = workspace.view === "expenses";
  const days = new Map<string, Expense[]>();
  for (const expense of workspace.filteredExpenses) {
    const entries = days.get(expense.date) ?? [];
    entries.push(expense);
    days.set(expense.date, entries);
  }

  return (
    <div className="font-inter min-h-dvh bg-stone-50 text-stone-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 border-b border-stone-300 px-5 py-5 sm:px-10 sm:py-7">
        <a
          href="/"
          className="font-editorial text-xl font-medium tracking-tight sm:text-2xl"
        >
          Expense journal
        </a>
        <a
          href="/playground"
          className="flex min-h-11 items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
        >
          Playground
          <ArrowUpRight className="size-3" />
        </a>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-5 pt-8 pb-32 sm:px-10 sm:pt-14 lg:grid-cols-3 lg:gap-16">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <p className="text-xs text-stone-500">
            {isExpenses
              ? workspace.selectedMonth.slice(0, 4)
              : "Personal expenses"}
          </p>
          <h1 className="font-editorial mt-4 text-4xl leading-tight font-normal tracking-tight sm:text-5xl">
            {isExpenses ? workspace.monthLabel.split(" ")[0] : "Collections"}
          </h1>
          <div className="mt-7 flex items-end justify-between lg:mt-10 lg:block">
            <div>
              <p className="text-xs text-stone-500">
                {isExpenses ? "Spent this month" : "Your collections"}
              </p>
              <p className="font-editorial mt-2 text-3xl tracking-tight tabular-nums">
                {isExpenses
                  ? formatAmount(workspace.spent, 2)
                  : workspace.collections.length}
                {isExpenses && (
                  <span className="font-inter ml-2 text-xs tracking-normal text-stone-500">
                    NOK
                  </span>
                )}
              </p>
            </div>
            <MonthFilter
              workspace={workspace}
              className="border-0 px-0 lg:mt-3"
            />
          </div>
          <AddAction
            workspace={workspace}
            className="mt-6 rounded-none border border-stone-800 bg-transparent text-stone-800 hover:bg-stone-800 hover:text-white lg:mt-8"
          />
          <p className="mt-10 hidden text-xs leading-relaxed text-stone-400 lg:block">
            A working design study.
            <br />
            Mock data resets on refresh.
          </p>
        </aside>
        <section
          className="min-w-0 lg:col-span-2"
          aria-label={isExpenses ? "Expense journal" : "Your collections"}
        >
          <div className="flex items-end justify-between gap-3 border-b border-stone-300">
            <WorkspaceTabs workspace={workspace} />
            {isExpenses && (
              <span className="pb-3 text-xs text-stone-400">
                {workspace.visibleExpenses.length} entries
              </span>
            )}
          </div>
          {isExpenses ? (
            <>
              <div className="my-5 flex gap-2">
                <ExpenseSearch
                  workspace={workspace}
                  className="min-w-0 flex-1"
                />
                <CollectionFilter workspace={workspace} />
              </div>
              {[...days].map(([date, expenses]) => (
                <section key={date} className="border-b border-stone-200 py-6">
                  <h2 className="font-editorial mb-4 text-xl">
                    {formatDate(date)}
                  </h2>
                  <ul className="space-y-1">
                    {expenses.map((expense) => (
                      <li key={expense.id}>
                        <button
                          type="button"
                          aria-label={`View ${expense.title}`}
                          onClick={() =>
                            workspace.setDialog({ kind: "expense", expense })
                          }
                          className="flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left hover:text-stone-500"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm">
                              {expense.title}
                            </span>
                            <span className="mt-1 block text-xs text-stone-400">
                              {categories[expense.category].label}
                            </span>
                          </span>
                          <span className="text-sm whitespace-nowrap tabular-nums">
                            {formatAmount(expense.amount, 2)}
                            <span className="ml-1 text-xs text-stone-400">
                              kr
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {days.size === 0 && <EmptyExpenses workspace={workspace} />}
            </>
          ) : (
            <PrototypeCollectionList workspace={workspace} />
          )}
          <p className="mt-8 text-xs text-stone-400 lg:hidden">
            Mock data · resets on refresh
          </p>
        </section>
      </main>
    </div>
  );
}
