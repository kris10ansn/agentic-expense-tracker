import { ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  type Collection,
  type Expense,
  formatAmount,
  formatMonth,
} from "../../lib/expenses";
import { ExpenseList } from "./ExpenseList";
import { groupExpenses } from "./group-expenses";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
type HistoryProps = {
  expenses: Expense[];
  collections: Collection[];
  onSelectExpense: (expense: Expense) => void;
};

function MonthSection({
  month,
  initiallyOpen,
  collections,
  onSelectExpense,
}: Omit<HistoryProps, "expenses"> & {
  month: ReturnType<typeof groupExpenses>[number];
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 py-3 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-neutral-400 group-open:rotate-90" />
        <h2 className="min-w-0 flex-1 text-sm font-medium">
          {formatMonth(month.date)}
        </h2>
        <span className="shrink-0 text-xs whitespace-nowrap text-neutral-500 tabular-nums">
          <span className="sr-only">Monthly total </span>
          {month.totals.map(({ currency, amountInCents }) => (
            <span key={currency} className="block">
              {formatAmount(amountInCents, 2)} {currency}
            </span>
          ))}
        </span>
      </summary>
      <DaySections
        expenses={month.expenses}
        collections={collections}
        onSelectExpense={onSelectExpense}
      />
    </details>
  );
}

export function ExpenseHistory({
  expenses,
  collections,
  onSelectExpense,
  filtered = false,
}: HistoryProps & { filtered?: boolean }) {
  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {groupExpenses(expenses, "month").map((month, index) => (
        <MonthSection
          key={month.date}
          month={month}
          initiallyOpen={index === 0 || filtered}
          collections={collections}
          onSelectExpense={onSelectExpense}
        />
      ))}
    </div>
  );
}

function DaySections({ expenses, collections, onSelectExpense }: HistoryProps) {
  return (
    <div className="space-y-5 pt-1 pb-6">
      {groupExpenses(expenses, "day").map((day) => (
        <section key={day.date} aria-label={`Expenses for ${day.date}`}>
          <div className="flex min-h-9 items-center justify-between gap-3 border-b border-neutral-200">
            <h3 className="text-xs font-medium text-neutral-500">
              <time dateTime={day.date}>
                {dayFormatter.format(new Date(`${day.date}T12:00:00`))}
              </time>
            </h3>
            <p className="shrink-0 text-xs font-medium whitespace-nowrap text-neutral-600 tabular-nums">
              <span className="sr-only">Daily total </span>
              {day.totals.map(({ currency, amountInCents }) => (
                <span key={currency} className="block">
                  {formatAmount(amountInCents, 2)} {currency}
                </span>
              ))}
            </p>
          </div>
          <ExpenseList
            expenses={day.expenses}
            collections={collections}
            onSelectExpense={onSelectExpense}
          />
        </section>
      ))}
    </div>
  );
}
