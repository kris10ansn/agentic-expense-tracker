import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "../../components/inputs";
import type { Collection, Expense } from "../../lib/expenses";

export function CollectionList({
  collections,
  expenses,
  onEdit,
  onDelete,
}: {
  collections: Collection[];
  expenses: Expense[];
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}) {
  return (
    <div className="divide-y divide-neutral-200/70">
      {collections.map((collection) => (
        <div key={collection.id} className="flex items-center gap-3 py-5">
          <Link
            to="/expenses"
            search={{ collection: collection.id }}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100"
              style={{ color: collection.color }}
            >
              <FolderOpen className="size-5" strokeWidth={1.5} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {collection.title}
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                {
                  expenses.filter(
                    (expense) => expense.collectionId === collection.id,
                  ).length
                }{" "}
                expenses
              </span>
            </span>
            <ChevronRight className="ml-auto hidden size-4 text-neutral-400 sm:block" />
          </Link>
          <IconButton
            aria-label={`Edit ${collection.title} collection`}
            onClick={() => onEdit(collection)}
          >
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${collection.title} collection`}
            className="hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(collection)}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      {collections.length === 0 && (
        <p className="py-12 text-sm text-neutral-500">
          Create a collection to start adding expenses.
        </p>
      )}
    </div>
  );
}
