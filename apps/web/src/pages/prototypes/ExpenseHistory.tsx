import { twMerge } from "tailwind-merge";
import {
  type Collection,
  categories,
  type Expense,
  formatAmount,
} from "../../lib/expenses";

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
  const dateLength = period === "day" ? 10 : 7;

  for (const expense of expenses) {
    const date = expense.date.slice(0, dateLength);
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

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function ExpenseHistory({
  expenses,
  collections,
  onSelectExpense,
  className,
}: {
  expenses: Expense[];
  collections: Collection[];
  onSelectExpense: (expense: Expense) => void;
  className?: string;
}) {
  const days = groupExpenses(expenses, "day");
  const collectionNames = new Map(
    collections.map((collection) => [collection.id, collection.name]),
  );

  return (
    <div className={twMerge("space-y-5", className)}>
      {days.map((day) => (
        <section key={day.date} aria-label={`Expenses for ${day.date}`}>
          <div className="flex min-h-9 items-center justify-between gap-3 border-b border-neutral-200">
            <h2 className="text-xs font-medium text-neutral-500">
              <time dateTime={day.date}>
                {dayFormatter.format(new Date(`${day.date}T12:00:00`))}
              </time>
            </h2>
            <p className="shrink-0 text-xs font-medium whitespace-nowrap text-neutral-600 tabular-nums">
              <span className="sr-only">Daily total </span>
              {formatAmount(day.total, 2)} kr
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {day.expenses.map((expense) => (
              <li key={expense.id}>
                <button
                  type="button"
                  aria-label={`View ${expense.title}`}
                  onClick={() => onSelectExpense(expense)}
                  className="flex min-h-16 w-full cursor-pointer items-center gap-4 py-3 text-left hover:bg-neutral-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {expense.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-neutral-400">
                      {categories[expense.category].label}
                    </span>
                  </span>
                  <span className="hidden w-40 shrink-0 truncate text-xs text-neutral-400 md:block">
                    {collectionNames.get(expense.collectionId)}
                  </span>
                  <span className="shrink-0 text-right text-sm whitespace-nowrap tabular-nums md:w-32">
                    {formatAmount(expense.amount, 2)}
                    <span className="ml-1 text-xs text-neutral-400">kr</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
