import { ArrowUpRight, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import {
  type Collection,
  type Expense,
  formatAmount,
  totalExpenses,
} from "../../lib/expenses";
import { IconButton } from "../inputs";
import { SectionCard } from "../SectionCard";

export function CollectionList({
  collections,
  expenses,
  onOpen,
  onEdit,
  onDelete,
  onAdd,
}: {
  collections: Collection[];
  expenses: Expense[];
  onOpen: (id: string) => void;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => {
        const items = expenses.filter(
          (expense) => expense.collectionId === collection.id,
        );
        const spent = totalExpenses(items);
        return (
          <SectionCard className="p-6" key={collection.id}>
            <div className="flex items-center justify-between">
              <span
                className="grid size-12 place-items-center rounded-xl bg-slate-50"
                style={{ color: collection.color }}
              >
                <FolderOpen className="size-6" strokeWidth={1.5} />
              </span>
              <div className="flex">
                <IconButton
                  aria-label={`Edit ${collection.name} collection`}
                  onClick={() => onEdit(collection)}
                >
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  className="hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete ${collection.name} collection`}
                  onClick={() => onDelete(collection)}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
            <button
              type="button"
              className="mt-5 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-left hover:text-emerald-800"
              onClick={() => onOpen(collection.id)}
            >
              <h2 className="text-lg font-semibold wrap-anywhere">
                {collection.name}
              </h2>
              <ArrowUpRight className="size-5 shrink-0 text-slate-400" />
            </button>
            <p className="mt-1 min-h-10 text-sm leading-relaxed wrap-anywhere text-slate-500">
              {collection.description ||
                "A place to keep your expenses together."}
            </p>
            <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums">
              {formatAmount(spent)}
              <span className="text-sm font-normal text-slate-400"> kr</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>
                {items.length} {items.length === 1 ? "expense" : "expenses"}
              </span>
              <span>{formatAmount(collection.budget)} kr budget</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    spent > collection.budget
                      ? "var(--color-red-500)"
                      : collection.color,
                  width: `${Math.min((spent / collection.budget) * 100, 100)}%`,
                }}
              />
            </div>
          </SectionCard>
        );
      })}
      <button
        type="button"
        className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-emerald-800 transition-colors hover:bg-emerald-50"
        onClick={onAdd}
      >
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-emerald-100">
          <Plus className="size-6" />
        </span>
        <strong className="text-sm font-semibold">Create a collection</strong>
        <span className="mt-2 text-xs text-slate-500">
          Give your expenses a place to belong.
        </span>
      </button>
    </div>
  );
}
