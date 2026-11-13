import { type Expense, toDateInput } from "../../lib/expenses";

export function sumExpenses(expenses: Expense[]) {
  const totals = new Map<Expense["currency"], number>();
  for (const expense of expenses) {
    totals.set(
      expense.currency,
      (totals.get(expense.currency) ?? 0) + expense.amountInCents,
    );
  }
  return [...totals.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([currency, amountInCents]) => ({ currency, amountInCents }));
}

export function groupExpenses(expenses: Expense[], period: "day" | "month") {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const purchasedDate = toDateInput(expense.purchasedAt);
    const date = period === "day" ? purchasedDate : purchasedDate.slice(0, 7);
    const group = groups.get(date);
    if (group) group.push(expense);
    else groups.set(date, [expense]);
  }
  return [...groups.entries()]
    .sort(([first], [second]) => second.localeCompare(first))
    .map(([date, entries]) => ({
      date,
      expenses: entries,
      totals: sumExpenses(entries),
    }));
}
