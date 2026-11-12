import {
  categories,
  type Expense,
  formatAmount,
  totalExpenses,
} from "../../lib/expenses";
import { SectionCard, SectionHeading } from "../SectionCard";

export function SpendingByCategory({ expenses }: { expenses: Expense[] }) {
  const total = totalExpenses(expenses);
  const breakdown = Object.entries(categories)
    .map(([key, category]) => ({
      ...category,
      amount: totalExpenses(
        expenses.filter((expense) => expense.category === key),
      ),
    }))
    .sort((a, b) => b.amount - a.amount);
  let offset = 0;
  const segments = breakdown.map(({ amount, color }) => {
    const start = offset;
    offset += total > 0 ? (amount / total) * 100 : 0;
    return `${color} ${start}% ${offset}%`;
  });

  return (
    <SectionCard>
      <SectionHeading
        title="Spending by category"
        description="Where your money goes."
      >
        <span className="rounded border border-slate-100 bg-slate-50 px-1.5 py-1 text-xs text-slate-400">
          NOK
        </span>
      </SectionHeading>
      <div className="my-7 flex justify-center" aria-hidden="true">
        <div
          className="size-44 -rotate-90 rounded-full p-6"
          style={{
            background:
              total > 0 ? `conic-gradient(${segments.join(", ")})` : "#e2e8f0",
          }}
        >
          <div className="flex size-full rotate-90 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-xs text-slate-400">Total spent</span>
            <strong className="mt-1 text-2xl font-semibold tracking-tight">
              {formatAmount(total)}
            </strong>
            <span className="mt-1 text-xs text-slate-400">NOK</span>
          </div>
        </div>
      </div>
      <ul
        className="space-y-4 px-5 pb-6 sm:px-6"
        aria-label="Spending by category"
      >
        {breakdown.map(({ label, color, amount }) => (
          <li
            key={label}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
            <strong className="ml-auto font-medium text-slate-700 tabular-nums">
              {formatAmount(amount)}{" "}
              <span className="font-normal text-slate-400">kr</span>
            </strong>
            <span className="w-8 text-right text-slate-400 tabular-nums">
              {total ? Math.round((amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
