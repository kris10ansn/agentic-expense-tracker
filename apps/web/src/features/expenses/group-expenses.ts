import type { Expense } from "../../lib/expenses";

export function sumExpenses(expenses: Expense[]) {
  return (
    expenses.reduce(
      (cents, expense) => cents + Math.round(expense.amount * 100),
      0,
    ) / 100
  );
}

export function groupExpenses(expenses: Expense[], period: "day" | "month") {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const date = period === "day" ? expense.date : expense.date.slice(0, 7);
    const group = groups.get(date);
    if (group) group.push(expense);
    else groups.set(date, [expense]);
  }
  return [...groups.entries()]
    .sort(([first], [second]) => second.localeCompare(first))
    .map(([date, entries]) => ({
      date,
      expenses: entries,
      total: sumExpenses(entries),
    }));
}
