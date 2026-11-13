import { twMerge } from "tailwind-merge";
import {
  type Collection,
  categories,
  type Expense,
  formatAmount,
  formatDate,
} from "../../lib/expenses";

export function ExpenseList({
  expenses,
  collections,
  onSelectExpense,
  showDate = false,
  className,
}: {
  expenses: Expense[];
  collections: Collection[];
  onSelectExpense: (expense: Expense) => void;
  showDate?: boolean;
  className?: string;
}) {
  const collectionNames = new Map(
    collections.map((collection) => [collection.id, collection.name]),
  );
  return (
    <ul className={twMerge("divide-y divide-neutral-100", className)}>
      {expenses.map((expense) => (
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
                {showDate && <> · {formatDate(expense.date)}</>}
              </span>
            </span>
            {!showDate && (
              <span className="hidden w-40 shrink-0 truncate text-xs text-neutral-400 md:block">
                {collectionNames.get(expense.collectionId)}
              </span>
            )}
            <span className="shrink-0 text-right text-sm whitespace-nowrap tabular-nums">
              {formatAmount(expense.amountInCents, 2)}
              <span className="ml-1 text-xs text-neutral-400">kr</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
