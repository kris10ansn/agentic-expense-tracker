import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { Button, IconButton, Select, TextInput } from "../../components/inputs";
import type { ExpenseWorkspace } from "../../hooks/useExpenseWorkspace";
import { type Expense, formatMonth } from "../../lib/expenses";

export type PrototypeWorkspace = ExpenseWorkspace & {
  search: string;
  setSearch: (search: string) => void;
  filteredExpenses: Expense[];
};
export type PrototypeProps = { workspace: PrototypeWorkspace };
export type Variant = "dock" | "voice" | "one-hand";
export type VariantOption<Id extends string = Variant> = {
  id: Id;
  name: string;
  description: string;
};
export const captureVariants: VariantOption[] = [
  { id: "dock", name: "Dock", description: "Full-width recording" },
  { id: "voice", name: "Voice first", description: "Central recording" },
  { id: "one-hand", name: "One hand", description: "Thumb-side recording" },
];

export function PrototypeSwitcher<Id extends string>({
  variant,
  variants,
  onChange,
  className,
}: {
  variant: Id;
  variants: VariantOption<Id>[];
  className?: string;
  onChange: (variant: Id) => void;
}) {
  const index = variants.findIndex((item) => item.id === variant);
  const current = variants[index];
  function cycle(direction: number) {
    const next =
      variants[(index + direction + variants.length) % variants.length];
    if (next) onChange(next.id);
  }
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        document.querySelector("dialog[open]") ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (target instanceof HTMLElement &&
          target.closest(
            "input, textarea, select, [contenteditable=true], [role=slider]",
          ))
      )
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next =
          variants[(index + direction + variants.length) % variants.length];
        if (next) onChange(next.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, onChange, variants]);

  return (
    <aside
      aria-label="Prototype switcher"
      className={twMerge(
        "font-inter relative z-40 flex h-11 items-center justify-center gap-2 bg-neutral-900 text-white lg:fixed lg:bottom-4 lg:left-1/2 lg:h-auto lg:-translate-x-1/2 lg:rounded-full lg:border lg:border-white/15 lg:p-1.5 lg:shadow-xl",
        className,
      )}
    >
      <IconButton
        aria-label="Previous design"
        className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => cycle(-1)}
      >
        <ArrowLeft className="size-4" />
      </IconButton>
      <div
        className="flex min-w-48 items-center justify-center gap-3 px-2 text-center lg:block"
        aria-live="polite"
      >
        <div className="text-xs font-medium">
          <span className="mr-2 text-white/40">
            {index + 1} / {variants.length}
          </span>
          {current?.name}
        </div>
        <p className="text-xs text-white/50 lg:mt-1">
          <span className="lg:hidden">Visual study</span>
          <span className="hidden lg:inline">{current?.description}</span>
        </p>
      </div>
      <IconButton
        aria-label="Next design"
        className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => cycle(1)}
      >
        <ArrowRight className="size-4" />
      </IconButton>
    </aside>
  );
}

export function MonthFilter({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  return (
    <Select
      aria-label="Month"
      value={workspace.selectedMonth}
      onChange={(event) => workspace.setSelectedMonth(event.target.value)}
      className={twMerge(
        "w-auto rounded-lg border-neutral-200 bg-transparent text-xs text-neutral-600 shadow-none sm:text-xs",
        className,
      )}
    >
      {workspace.availableMonths.map((month) => (
        <option key={month} value={month}>
          {formatMonth(month)}
        </option>
      ))}
    </Select>
  );
}

export function CollectionFilter({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  return (
    <Select
      aria-label="Collection"
      value={workspace.selectedCollection}
      onChange={(event) => workspace.setSelectedCollection(event.target.value)}
      className={twMerge(
        "w-36 shrink-0 rounded-lg border-neutral-200 bg-transparent text-xs text-neutral-600 shadow-none sm:w-auto sm:text-xs",
        className,
      )}
    >
      <option value="all">All collections</option>
      {workspace.collections.map((collection) => (
        <option key={collection.id} value={collection.id}>
          {collection.name}
        </option>
      ))}
    </Select>
  );
}

export function ExpenseSearch({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  return (
    <div className={twMerge("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-neutral-400" />
      <TextInput
        aria-label="Search expenses"
        placeholder="Search"
        value={workspace.search}
        onChange={(event) => workspace.setSearch(event.target.value)}
        className="border-neutral-200 bg-transparent pr-10 pl-9 text-sm shadow-none"
      />
      {workspace.search && (
        <IconButton
          aria-label="Clear search"
          className="absolute top-0 right-0"
          onClick={() => workspace.setSearch("")}
        >
          <X className="size-4" />
        </IconButton>
      )}
    </div>
  );
}

export function AddAction({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  const creatingCollection =
    workspace.view === "collections" || workspace.collections.length === 0;
  return (
    <Button
      className={twMerge(
        "bg-neutral-900 font-medium hover:bg-neutral-700",
        className,
      )}
      onClick={
        creatingCollection
          ? () => workspace.setDialog({ kind: "collection", collection: null })
          : workspace.addExpense
      }
    >
      <Plus className="size-4" />
      <span>{creatingCollection ? "New collection" : "Add expense"}</span>
    </Button>
  );
}

export function EmptyExpenses({ workspace }: PrototypeProps) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-neutral-500">
        {workspace.search ? "No matching expenses." : "No expenses this month."}
      </p>
      <Button
        variant="ghost"
        className="mt-3 text-neutral-900"
        onClick={
          workspace.search
            ? () => workspace.setSearch("")
            : workspace.addExpense
        }
      >
        {workspace.search ? "Clear search" : "Add your first expense"}
      </Button>
    </div>
  );
}

export function PrototypeCollectionList({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  return (
    <div className={twMerge("divide-y divide-neutral-200/70", className)}>
      {workspace.collections.map((collection) => {
        const expenses = workspace.monthlyExpenses.filter(
          (expense) => expense.collectionId === collection.id,
        );
        return (
          <div key={collection.id} className="flex items-center gap-3 py-5">
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
              onClick={() => workspace.openCollection(collection.id)}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100"
                style={{ color: collection.color }}
              >
                <FolderOpen className="size-5" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {collection.name}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {expenses.length} expenses
                </span>
              </span>
              <ChevronRight className="ml-auto hidden size-4 text-neutral-400 sm:block" />
            </button>
            <IconButton
              aria-label={`Edit ${collection.name} collection`}
              onClick={() =>
                workspace.setDialog({ kind: "collection", collection })
              }
            >
              <Pencil className="size-4" />
            </IconButton>
            <IconButton
              aria-label={`Delete ${collection.name} collection`}
              className="hover:bg-red-50 hover:text-red-700"
              onClick={() =>
                workspace.setDialog({ kind: "delete-collection", collection })
              }
            >
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        );
      })}
      {workspace.collections.length === 0 && (
        <p className="py-12 text-sm text-neutral-500">
          Create a collection to start adding expenses.
        </p>
      )}
    </div>
  );
}
