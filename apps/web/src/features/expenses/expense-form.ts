import {
  type Collection,
  type Expense,
  type ExpenseInput,
  isCurrency,
  toDateInput,
} from "../../lib/expenses";

export function parseExpenseForm({
  data,
  expense,
  collections,
}: {
  data: FormData;
  expense: Expense | null;
  collections: Collection[];
}): ExpenseInput | undefined {
  const title = String(data.get("title") ?? "").trim();
  const amount = String(data.get("amount") ?? "").trim();
  const amountInCents = Math.round(Number(amount) * 100);
  const currency = String(data.get("currency") ?? "");
  const category = String(data.get("category") ?? "").trim();
  const date = String(data.get("date") ?? "");
  const purchasedAt = new Date(`${date}T12:00:00`);
  const collectionId = String(data.get("collectionId") ?? "") || null;
  if (
    !title ||
    title.length > 64 ||
    !amount ||
    !Number.isSafeInteger(amountInCents) ||
    amountInCents < -2147483648 ||
    amountInCents > 2147483647 ||
    !isCurrency(currency) ||
    !category ||
    category.length > 255 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    toDateInput(purchasedAt) !== date ||
    (collectionId !== null &&
      !collections.some((collection) => collection.id === collectionId))
  ) {
    return undefined;
  }

  return {
    title,
    amountInCents,
    currency,
    category,
    collectionId,
    purchasedAt:
      expense && toDateInput(expense.purchasedAt) === date
        ? expense.purchasedAt
        : purchasedAt,
    description: expense?.description ?? "",
    merchant: expense?.merchant ?? null,
  };
}
