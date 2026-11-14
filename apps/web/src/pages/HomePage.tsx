import { useMutation } from "@tanstack/react-query";
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
import { trpc } from "../trpc";

const createFormData = (capture: Omit<PendingCapture, "id">) => {
  const formData = new FormData();

  formData.set("description", capture.description);
  formData.set("collectionId", capture.collectionId);

  for (const file of capture.files) {
    formData.append("files", file);
  }

  return formData;
};

export function HomePage() {
  const startCapture = useMutation(trpc.captures.start.mutationOptions());

  const [pendingCaptures, setPendingCaptures] = useState<PendingCapture[]>([]);

  const { expenses, collections, addExpense, openDialog } = useWorkspace();
  const recentExpenses = [...expenses].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const handleSubmit = useCallback(
    async ({ description, files, collectionId }: CaptureDockData) => {
      const data = { description, files, collectionId };
      const formData = createFormData(data);
      const { captureId } = await startCapture.mutateAsync(formData);

      setPendingCaptures([...pendingCaptures, { id: captureId, ...data }]);
    },
    [pendingCaptures, startCapture.mutateAsync],
  );

  const handleCaptureComplete = useCallback(
    (capture: PendingCapture) => {
      setPendingCaptures(pendingCaptures.filter((c) => c.id !== capture.id));
    },
    [pendingCaptures.filter],
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
            <PendingExpense
              key={capture.id}
              capture={capture}
              onComplete={handleCaptureComplete.bind(null, capture)}
            />
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
