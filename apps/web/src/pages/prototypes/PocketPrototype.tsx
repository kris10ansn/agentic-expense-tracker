import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  List,
  Plus,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button, IconButton } from "../../components/inputs";
import { categories, formatAmount, formatDate } from "../../lib/expenses";
import {
  AddAction,
  EmptyExpenses,
  ExpenseSearch,
  MonthFilter,
  PrototypeCollectionList,
  type PrototypeProps,
} from "./PrototypeControls";

export function PocketPrototype({ workspace }: PrototypeProps) {
  const isExpenses = workspace.view === "expenses";
  return (
    <div className="font-manrope min-h-dvh bg-stone-100 text-stone-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-stone-200 bg-white px-7 pt-10 lg:flex">
        <a href="/" className="text-2xl font-semibold tracking-tight">
          pocket<span className="text-orange-700">.</span>
        </a>
        <p className="mt-2 text-xs text-stone-400">Personal expenses</p>
        <div className="mt-12 flex items-center justify-between">
          <p className="text-xs font-medium text-stone-400">Collections</p>
          <IconButton
            aria-label="New collection"
            onClick={() =>
              workspace.setDialog({ kind: "collection", collection: null })
            }
          >
            <Plus className="size-4" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => {
            workspace.setSelectedCollection("all");
            workspace.changeView("expenses");
          }}
          className={twMerge(
            "mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm",
            workspace.selectedCollection === "all" &&
              "bg-stone-100 font-semibold",
          )}
        >
          <List className="size-4" />
          All expenses
        </button>
        {workspace.collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className={twMerge(
              "mt-1 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm text-stone-500",
              workspace.selectedCollection === collection.id &&
                "bg-stone-100 font-semibold text-stone-900",
            )}
            onClick={() => workspace.openCollection(collection.id)}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: collection.color }}
            />
            <span className="truncate">{collection.name}</span>
          </button>
        ))}
        <Button
          variant="ghost"
          className="mt-5 justify-start px-3 text-xs"
          onClick={() => workspace.changeView("collections")}
        >
          Manage collections
          <ChevronRight className="size-3" />
        </Button>
        <p className="mt-auto py-8 text-xs text-stone-400">
          Mock data · changes reset on refresh
        </p>
      </aside>
      <div className="lg:ml-72">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-6 sm:px-8 sm:pt-10 lg:hidden">
          <a
            href="/"
            className="text-xl font-semibold tracking-tight lg:invisible"
          >
            pocket<span className="text-orange-700">.</span>
          </a>
        </header>
        <main className="mx-auto max-w-3xl px-5 pt-6 pb-52 sm:px-8">
          {isExpenses ? (
            <>
              <button
                type="button"
                className="mb-6 flex min-h-11 cursor-pointer items-center gap-1 text-xs text-stone-500 lg:hidden"
                onClick={() => workspace.changeView("collections")}
              >
                <ChevronLeft className="size-4" />
                Collections
              </button>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-sm text-stone-500">
                  {workspace.selectedCollectionName ?? "All expenses"}
                </h1>
                <p className="mt-4 text-5xl font-semibold tracking-tighter tabular-nums sm:text-6xl">
                  {formatAmount(workspace.spent)}
                  <span className="ml-2 text-xl font-normal tracking-normal text-stone-400">
                    kr
                  </span>
                </p>
                <MonthFilter
                  workspace={workspace}
                  className="mt-3 border-0 px-0 text-stone-500"
                />
              </div>
              <div className="mt-8 flex items-center gap-3">
                <ExpenseSearch workspace={workspace} className="flex-1" />
                <AddAction
                  workspace={workspace}
                  className="rounded-xl bg-orange-700 hover:bg-orange-800"
                />
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl bg-white p-2 sm:p-3">
                {workspace.filteredExpenses.length ? (
                  <ul className="divide-y divide-stone-100">
                    {workspace.filteredExpenses.map((expense) => {
                      const Icon = categories[expense.category].icon;
                      return (
                        <li key={expense.id}>
                          <button
                            type="button"
                            aria-label={`View ${expense.title}`}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-4 text-left hover:bg-stone-50 sm:px-4"
                            onClick={() =>
                              workspace.setDialog({ kind: "expense", expense })
                            }
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-stone-100 text-stone-500">
                              <Icon className="size-5" strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {expense.title}
                              </span>
                              <span className="mt-1 block text-xs text-stone-400">
                                {formatDate(expense.date)}
                              </span>
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                              {formatAmount(expense.amount, 2)}
                              <span className="ml-1 text-xs font-normal text-stone-400">
                                kr
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyExpenses workspace={workspace} />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Collections
                </h1>
                <AddAction
                  workspace={workspace}
                  className="rounded-xl bg-orange-700 hover:bg-orange-800"
                />
              </div>
              <p className="mt-3 text-sm text-stone-500">
                Choose where to keep your expenses.
              </p>
              <div className="mt-6">
                <MonthFilter workspace={workspace} />
              </div>
              <div className="mt-4 rounded-3xl bg-white px-4 sm:px-6">
                <PrototypeCollectionList workspace={workspace} />
              </div>
              <Button
                variant="ghost"
                className="mt-4 text-stone-500"
                onClick={() => {
                  workspace.setSelectedCollection("all");
                  workspace.changeView("expenses");
                }}
              >
                View all expenses
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
        </main>
        <nav
          aria-label="Workspace navigation"
          className="fixed inset-x-5 bottom-24 z-20 mx-auto flex max-w-sm items-center justify-around rounded-2xl border border-stone-200 bg-white/95 p-2 backdrop-blur-sm lg:hidden"
        >
          <button
            type="button"
            onClick={() => workspace.changeView("expenses")}
            aria-current={isExpenses ? "page" : undefined}
            className={twMerge(
              "flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-xs text-stone-400",
              isExpenses && "text-stone-900",
            )}
          >
            <List className="size-5" />
            Expenses
          </button>
          <button
            type="button"
            onClick={() => workspace.changeView("collections")}
            aria-current={!isExpenses ? "page" : undefined}
            className={twMerge(
              "flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-xs text-stone-400",
              !isExpenses && "text-stone-900",
            )}
          >
            <FolderOpen className="size-5" />
            Collections
          </button>
        </nav>
      </div>
    </div>
  );
}
