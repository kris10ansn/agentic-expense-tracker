import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  CaptureDock,
  type CaptureDockData,
} from "../features/capture/CaptureDock";
import {
  useSendingCaptures,
  useStartCapture,
} from "../features/capture/mutations";
import { PendingCapture } from "../features/capture/PendingCapture";
import { ExpenseList } from "../features/expenses/ExpenseList";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";
import { trpc } from "../trpc";

export function HomePage() {
  const { expenses, collections, addExpense, openDialog } = useWorkspace();

  const [filesRecord, setFilesRecord] = useState<Record<string, File[]>>({});

  const pendingCaptures = useQuery(trpc.captures.listActive.queryOptions());
  const sendingCaptures = useSendingCaptures();

  const startCapture = useStartCapture();

  const pending = pendingCaptures.data ?? [];
  const pendingIds = new Set(pending.map((capture) => capture.id));

  const captures = [
    ...pending.map((c) => ({ ...c, captureId: c.id })),
    ...sendingCaptures
      .filter((capture) => capture !== undefined)
      .filter((capture) => !pendingIds.has(capture.id))
      .map((capture) => ({ ...capture, captureId: null })),
  ];

  const handleSubmit = useCallback(
    async ({ description, files, collectionId }: CaptureDockData) => {
      const capture = {
        id: crypto.randomUUID(),
        description,
        files,
        collectionId,
      };

      setFilesRecord({ ...filesRecord, [capture.id]: files });
      void startCapture.mutate(capture);
    },
    [filesRecord, startCapture.mutate],
  );

  return (
    <>
      <PageHeader title="Recent expenses" className="mb-5 lg:mb-10" />
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-20">
        <section
          aria-label="Recent expenses"
          className="min-h-0 flex-1 overflow-y-auto lg:order-last"
        >
          {captures.map((capture) => (
            <PendingCapture
              key={capture.id}
              captureId={capture.captureId}
              description={capture.description}
              files={filesRecord[capture.id] ?? []}
            />
          ))}
          <ExpenseList
            expenses={expenses}
            collections={collections}
            showDate
            onSelectExpense={(expense) =>
              openDialog({ kind: "expense", expense })
            }
          />
          {expenses.length === 0 && (
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
