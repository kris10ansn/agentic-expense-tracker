export type ExpenseSearch = {
  q?: string | undefined;
  collection?: string | undefined;
};

export function parseExpenseSearch(
  search: Record<string, unknown>,
): ExpenseSearch {
  return {
    ...(typeof search.q === "string" && search.q ? { q: search.q } : {}),
    ...(typeof search.collection === "string" && search.collection
      ? { collection: search.collection }
      : {}),
  };
}
