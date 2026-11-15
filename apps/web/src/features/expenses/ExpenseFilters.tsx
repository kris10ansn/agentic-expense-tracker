import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { IconButton, Select, TextInput } from "../../components/inputs";
import { QueryError } from "../../components/QueryError";
import { trpc } from "../../trpc";
import { CollectionSelectSkeleton } from "../collections/CollectionSkeletons";

import type { ExpenseSearch } from "./search";

type ExpenseFiltersProps = {
  value: ExpenseSearch;
  onChange: (value: ExpenseSearch, replace?: boolean) => void;
};

export function ExpenseFilters({
  value: search,
  onChange,
}: ExpenseFiltersProps) {
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
      <div className="sm:ml-auto">
        <CollectionFilter value={search} onChange={onChange} />
      </div>
    </div>
  );
}

function CollectionFilter({ value: search, onChange }: ExpenseFiltersProps) {
  const query = useQuery(trpc.collections.list.queryOptions());
  const error = query.isError ? (
    <QueryError
      message={
        query.data
          ? "Unable to refresh collections. Showing previous data."
          : "Unable to load collections."
      }
      onRetry={() => void query.refetch()}
      retrying={query.isFetching}
    />
  ) : null;

  if (!query.data) {
    return (
      error ?? <CollectionSelectSkeleton label="Loading collection filter" />
    );
  }

  return (
    <>
      {error}
      <Select
        aria-label="Collection"
        value={search.collection ?? ""}
        onChange={(event) =>
          onChange({ ...search, collection: event.target.value || undefined })
        }
        className="w-36 shrink-0 rounded-lg border-neutral-200 bg-transparent text-xs text-neutral-600 shadow-none sm:w-auto sm:text-xs"
      >
        <option value="">All collections</option>
        {search.collection &&
          !query.data.some((item) => item.id === search.collection) && (
            <option value={search.collection}>Deleted collection</option>
          )}
        {query.data.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.title}
          </option>
        ))}
      </Select>
    </>
  );
}
