import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { categories, formatAmount, formatDate } from "../../lib/expenses";
import { CaptureCollection } from "./CaptureControls";
import { type DockVariant, FloatingCaptureDock } from "./FloatingCaptureDock";
import {
  type ManualEntryVariant,
  ManualExpenseAction,
} from "./ManualExpenseAction";
import { PendingExpenseRow } from "./PendingExpenseRow";
import type { PrototypeProps } from "./PrototypeControls";

function RecentExpenses({
  workspace,
  className,
}: PrototypeProps & { className?: string }) {
  const recentExpenses = [...workspace.expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <section
      aria-label="Recent expenses"
      className={twMerge("min-h-0 overflow-y-auto", className)}
    >
      <ul className="divide-y divide-neutral-100">
        <li>
          <PendingExpenseRow />
        </li>
        {recentExpenses.map((expense) => (
          <li key={expense.id} className="flex items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{expense.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {categories[expense.category].label} ·{" "}
                {formatDate(expense.date)}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">
              {formatAmount(expense.amount, 2)}{" "}
              <span className="text-xs text-neutral-400">kr</span>
            </p>
          </li>
        ))}
      </ul>
      {recentExpenses.length === 0 && (
        <p className="py-5 text-sm text-neutral-500">
          Your expenses will appear here.
        </p>
      )}
    </section>
  );
}

// Selected voice-first capture layout inside the inset workspace.
// Only the draft text and collection selection change; capture actions are inert.
export function HomeCapturePrototype({
  workspace,
  variant,
  manualVariant = "dock",
}: PrototypeProps & {
  variant: DockVariant;
  manualVariant?: ManualEntryVariant;
}) {
  const [text, setText] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const selectedCollection =
    workspace.collections.find((collection) => collection.id === collectionId)
      ?.id ??
    workspace.collections[0]?.id ??
    "";
  const captureProps = { text, setText };
  return (
    <>
      <div className="mb-5 shrink-0 lg:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Recent expenses
        </h1>
        {manualVariant === "header" && (
          <ManualExpenseAction
            variant="header"
            onAdd={workspace.addExpense}
            className="mt-5 lg:w-auto"
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-20">
        <RecentExpenses
          workspace={workspace}
          className="flex-1 lg:order-last"
        />
        <section
          aria-label="New expense"
          className="relative z-10 shrink-0 pt-5 lg:pt-0"
        >
          {manualVariant === "floating" && (
            <div className="mb-4 flex justify-end">
              <ManualExpenseAction
                variant="floating"
                onAdd={workspace.addExpense}
              />
            </div>
          )}
          <FloatingCaptureDock
            {...captureProps}
            variant={variant}
            collection={
              <div className="flex flex-wrap items-center justify-between gap-x-2">
                <CaptureCollection
                  collections={workspace.collections}
                  value={selectedCollection}
                  onChange={setCollectionId}
                />
                {manualVariant === "dock" && (
                  <ManualExpenseAction
                    variant="dock"
                    onAdd={workspace.addExpense}
                    className="ml-auto"
                  />
                )}
              </div>
            }
          />
        </section>
      </div>
    </>
  );
}
