import { categories, formatAmount, formatDate } from "../../lib/expenses";
import { PendingExpenseRow, type PendingVariant } from "./PendingExpenseRow";
import type { PrototypeWorkspace } from "./PrototypeControls";

// Three pending expense treatments, selected with ?variant=quiet|progress|receipt.
export function PendingExpenseStudy({
  workspace,
  variant,
}: {
  workspace: PrototypeWorkspace;
  variant: PendingVariant;
}) {
  const savedExpenses = workspace.visibleExpenses.slice(0, 4);
  const collectionNames = new Map(
    workspace.collections.map((collection) => [collection.id, collection.name]),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="mb-3 text-xs font-medium text-neutral-400">
          Pending expense study
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-500">
          A mock entry waiting for an AI response. It stays above your saved
          expenses.
        </p>
      </header>

      <section aria-label="Expense list">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3 text-xs text-neutral-500">
          <span>Recent expenses</span>
          <span>{savedExpenses.length} saved · 1 pending</span>
        </div>
        <PendingExpenseRow variant={variant} />
        <ul className="divide-y divide-neutral-200">
          {savedExpenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-4 py-5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {expense.title}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(expense.date)} ·{" "}
                  {categories[expense.category].label}
                </p>
              </div>
              <span className="hidden text-xs text-neutral-500 sm:block">
                {collectionNames.get(expense.collectionId)}
              </span>
              <p className="shrink-0 text-sm font-medium text-neutral-900 tabular-nums">
                {formatAmount(expense.amount, 2)}
                <span className="ml-1 text-xs font-normal text-neutral-400">
                  kr
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
