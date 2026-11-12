import { ArrowRight, ChevronRight, ReceiptText, Search, X } from "lucide-react";
import { useState } from "react";
import {
  type Collection,
  categories,
  type Expense,
  formatAmount,
  formatDate,
} from "../../lib/expenses";
import { Button, IconButton, Select, TextInput } from "../inputs";
import { SectionCard, SectionHeading } from "../SectionCard";

const RECENT_EXPENSE_LIMIT = 6;

export function ExpenseList({
  expenses,
  collections,
  preview = false,
  onSelect,
  onViewAll,
  onAdd,
}: {
  expenses: Expense[];
  collections: Collection[];
  preview?: boolean;
  onSelect: (expense: Expense) => void;
  onViewAll: () => void;
  onAdd: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const filtered = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(search.trim().toLowerCase()) &&
      (category === "all" || category === expense.category),
  );
  const visible = preview ? filtered.slice(0, RECENT_EXPENSE_LIMIT) : filtered;

  function clearFilters() {
    setSearch("");
    setCategory("all");
  }

  return (
    <SectionCard>
      <SectionHeading
        title={preview ? "Recent expenses" : "All expenses"}
        description={
          preview
            ? "The little things, all accounted for."
            : "Find an expense. Tap to view or edit it."
        }
      >
        {preview && (
          <Button
            variant="ghost"
            className="shrink-0 px-0 text-xs text-emerald-800 hover:bg-transparent"
            onClick={onViewAll}
          >
            View all
            <ArrowRight className="size-4" />
          </Button>
        )}
      </SectionHeading>
      <div className="m-5 flex gap-2 sm:m-6">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-400" />
          <TextInput
            aria-label="Search expenses"
            placeholder="Search expenses…"
            className="pr-10 pl-9 text-sm shadow-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <IconButton
              className="absolute top-0 right-0"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X className="size-4" />
            </IconButton>
          )}
        </div>
        <Select
          className="w-32 shrink-0 px-2 text-xs shadow-none sm:w-36 sm:text-xs"
          aria-label="Filter by category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {Object.entries(categories).map(([id, item]) => (
            <option key={id} value={id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <div
        className="hidden grid-cols-12 gap-3 border-y border-slate-100 bg-slate-50/70 px-6 py-3 text-xs text-slate-400 sm:grid"
        aria-hidden="true"
      >
        <span className="col-span-6">Expense</span>
        <span className="col-span-3">Category</span>
        <span className="col-span-3 pr-5 text-right">Amount</span>
      </div>
      {visible.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {visible.map((expense) => {
            const categoryInfo = categories[expense.category];
            const Icon = categoryInfo.icon;
            const collection = collections.find(
              (item) => item.id === expense.collectionId,
            );
            return (
              <li key={expense.id}>
                <button
                  type="button"
                  className="grid w-full cursor-pointer grid-cols-12 items-center gap-2 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:gap-3 sm:px-6 sm:py-5"
                  aria-label={`View ${expense.title}, ${formatAmount(expense.amount, 2)} kr`}
                  onClick={() => onSelect(expense)}
                >
                  <span className="col-span-8 flex min-w-0 items-center gap-3 sm:col-span-6">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl"
                      style={{
                        color: categoryInfo.textColor,
                        backgroundColor: categoryInfo.tint,
                      }}
                    >
                      <Icon className="size-5" strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium">
                        {expense.title}
                      </strong>
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {formatDate(expense.date)}
                        <span className="mx-1.5">·</span>
                        {collection?.name}
                      </span>
                    </span>
                  </span>
                  <span className="col-span-3 hidden sm:block">
                    <span
                      className="inline-block max-w-full truncate rounded-md px-2 py-1 text-xs"
                      style={{
                        color: categoryInfo.textColor,
                        backgroundColor: categoryInfo.tint,
                      }}
                    >
                      {categoryInfo.label}
                    </span>
                  </span>
                  <span className="col-span-4 flex items-center justify-end gap-2 sm:col-span-3">
                    <span className="text-right text-xs font-medium whitespace-nowrap tabular-nums sm:text-sm">
                      {formatAmount(expense.amount, 2)}
                      <span className="text-xs font-normal text-slate-400">
                        {" "}
                        kr
                      </span>
                    </span>
                    <ChevronRight className="size-3 shrink-0 text-slate-300" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <ReceiptText className="size-8 text-slate-400" strokeWidth={1.4} />
          <h3 className="mt-4 text-base font-medium">
            {expenses.length ? "No matching expenses" : "A fresh start"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {expenses.length
              ? "Try another search or category."
              : "Add your first expense to see it here."}
          </p>
          <Button
            variant="ghost"
            className="mt-3 text-emerald-800"
            onClick={expenses.length ? clearFilters : onAdd}
          >
            {expenses.length ? "Clear filters" : "Add an expense"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {visible.length > 0 && (
        <div className="flex justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:px-6">
          <span>
            Showing {visible.length} of {filtered.length} expenses
          </span>
          <span>NOK</span>
        </div>
      )}
    </SectionCard>
  );
}
