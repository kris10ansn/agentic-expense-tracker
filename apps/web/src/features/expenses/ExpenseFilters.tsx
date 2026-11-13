import { Search, X } from "lucide-react";
import { IconButton, Select, TextInput } from "../../components/inputs";
import type { Collection } from "../../lib/expenses";

import type { ExpenseSearch } from "./search";

export function ExpenseFilters({
  collections,
  value: search,
  onChange,
}: {
  collections: Collection[];
  value: ExpenseSearch;
  onChange: (value: ExpenseSearch, replace?: boolean) => void;
}) {
  return (
    <div className="mt-6 mb-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-64">
        <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-neutral-400" />
        <TextInput
          aria-label="Search expenses"
          placeholder="Search"
          value={search.q ?? ""}
          onChange={(event) =>
            onChange({ ...search, q: event.target.value || undefined }, true)
          }
          className="border-neutral-200 bg-transparent pr-10 pl-9 text-sm shadow-none"
        />
        {search.q && (
          <IconButton
            aria-label="Clear search"
            className="absolute top-0 right-0"
            onClick={() => onChange({ ...search, q: undefined }, true)}
          >
            <X className="size-4" />
          </IconButton>
        )}
      </div>
      <Select
        aria-label="Collection"
        value={search.collection ?? ""}
        onChange={(event) =>
          onChange({ ...search, collection: event.target.value || undefined })
        }
        className="w-36 shrink-0 rounded-lg border-neutral-200 bg-transparent text-xs text-neutral-600 shadow-none sm:ml-auto sm:w-auto sm:text-xs"
      >
        <option value="">All collections</option>
        {search.collection &&
          !collections.some((item) => item.id === search.collection) && (
            <option value={search.collection}>Deleted collection</option>
          )}
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
