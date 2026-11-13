import { useCallback, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  CaptureDock,
  type CaptureDockData,
} from "../features/capture/CaptureDock";
import { PendingExpense } from "../features/capture/PendingExpense";
import type { PendingCapture } from "../features/capture/types";
import { ExpenseList } from "../features/expenses/ExpenseList";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";

const RECENT_EXPENSE_LIMIT = 4;

export function HomePage() {
  const [pendingCaptures, setPendingCaptures] = useState(
    [] as PendingCapture[],
  );

  const { expenses, collections, addExpense, openDialog } = useWorkspace();
  const recentExpenses = [...expenses]
    .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
    .slice(0, RECENT_EXPENSE_LIMIT);

  const handleSubmit = useCallback(
    ({ description, files }: CaptureDockData) => {
      console.log({ description, files });

      setPendingCaptures([
        {
          id: Math.random().toString(),
          collectionId: "COLLECTION_ID",
          description,
          images: files,
        },
        ...pendingCaptures,
      ]);
    },
    [pendingCaptures],
  );

  return (
    <>
      <PageHeader title="Recent expenses" className="mb-5 lg:mb-10" />
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-20">
        <section
          aria-label="Recent expenses"
          className="min-h-0 flex-1 overflow-y-auto lg:order-last"
        >
          {pendingCaptures.map((capture) => (
            <PendingExpense key={capture.id} capture={capture} />
          ))}
          <ExpenseList
            expenses={recentExpenses}
            collections={collections}
            showDate
            onSelectExpense={(expense) =>
              openDialog({ kind: "expense", expense })
            }
          />
          {recentExpenses.length === 0 && (
            <p className="py-5 text-sm text-neutral-500">
              Your expenses will appear here.
            </p>
          )}
        </section>
        <div className="relative z-10 shrink-0 pt-5 lg:pt-0">
          <CaptureDock
            collections={collections}
            onManualEntry={addExpense}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}
