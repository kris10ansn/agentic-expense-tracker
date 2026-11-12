import { ArrowUpRight, PiggyBank } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { formatAmount } from "../../lib/expenses";
import { Button } from "../inputs";
import { SectionCard, SectionHeading } from "../SectionCard";

export function BudgetCard({
  spent,
  budget,
  onManage,
}: {
  spent: number;
  budget: number;
  onManage: () => void;
}) {
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remaining = budget - spent;
  const status =
    budget === 0
      ? "Give your spending a little structure."
      : remaining < 0
        ? "You've passed your monthly budget."
        : remaining === 0
          ? "You've reached your monthly budget."
          : "You're within your monthly budget.";

  return (
    <SectionCard>
      <SectionHeading
        title="Monthly budget"
        description="A little room to breathe."
      >
        <PiggyBank className="size-6 text-emerald-700" strokeWidth={1.5} />
      </SectionHeading>
      <div className="p-5 sm:p-6">
        <p className="flex flex-wrap items-baseline gap-2">
          <strong className="text-xl font-semibold tracking-tight">
            {formatAmount(spent)} kr
          </strong>
          <span className="text-xs text-slate-400">
            of {formatAmount(budget)} kr
          </span>
        </p>
        <meter
          className="sr-only"
          aria-label="Monthly budget used"
          value={Math.min(percent, 100)}
          min={0}
          max={100}
          aria-valuetext={`${percent}% of budget spent`}
        />
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <div
            className={twMerge(
              "h-full rounded-full bg-emerald-600",
              remaining < 0 && "bg-red-500",
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500">
          <span>{percent}% used</span>
          <span>
            {formatAmount(Math.abs(remaining))} kr{" "}
            {remaining < 0 ? "over budget" : "left"}
          </span>
        </div>
        <div
          className={twMerge(
            "mt-5 rounded-xl bg-emerald-50 p-3 text-emerald-800",
            remaining < 0 && "bg-red-50 text-red-700",
          )}
        >
          <p className="text-xs leading-relaxed">{status}</p>
          <Button
            variant="ghost"
            className="mt-1 min-h-8 justify-start p-0 text-xs font-normal text-inherit hover:bg-transparent"
            onClick={onManage}
          >
            Manage collection budgets
            <ArrowUpRight className="size-3" />
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
