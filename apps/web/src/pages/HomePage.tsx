import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { QueryError } from "../components/QueryError";
import {
  CaptureCard,
  type CaptureCardData,
} from "../features/capture/CaptureCard";
import {
  CaptureDock,
  type CaptureDockData,
} from "../features/capture/CaptureDock";
import {
  useSendingCaptures,
  useStartCapture,
} from "../features/capture/mutations";
import { ExpenseList } from "../features/expenses/ExpenseList";
import { ExpenseListSkeleton } from "../features/expenses/ExpenseSkeletons";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";
import { trpc } from "../trpc";

export function HomePage() {
  const { addExpense } = useWorkspace();

  const [filesRecord, setFilesRecord] = useState<Record<string, File[]>>({});
  const visibleCaptures = useQuery(trpc.captures.listVisible.queryOptions());
  const sendingCaptures = useSendingCaptures();

  const startCapture = useStartCapture();

  const visible = visibleCaptures.data ?? [];
  const visibleIds = new Set(visible.map((capture) => capture.id));

  const captures: CaptureCardData[] = [
    ...visible.map<CaptureCardData>((capture) => ({
      ...capture,
      kind: "persisted",
    })),
    ...sendingCaptures
      .filter((capture) => capture !== undefined)
      .filter((capture) => !visibleIds.has(capture.id))
      .map<CaptureCardData>(({ id, description, files }) => ({
        id,
        description,
        fileNames: files.map((file) => file.name),
        kind: "sending",
      })),
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
          {visibleCaptures.isError && (
            <QueryError
              message="Unable to load captures."
              onRetry={() => void visibleCaptures.refetch()}
              retrying={visibleCaptures.isFetching}
            />
          )}
          {captures.map((capture) => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              files={filesRecord[capture.id] ?? []}
            />
          ))}
          <RecentExpenses />
        </section>
        <div className="relative z-10 shrink-0 pt-5 lg:pt-0">
          <CaptureDock onManualEntry={addExpense} onSubmit={handleSubmit} />
        </div>
      </div>
    </>
  );
}

function RecentExpenses() {
  const { openDialog } = useWorkspace();
  const expenses = useQuery(trpc.expenses.list.queryOptions());
  const collections = useQuery(trpc.collections.list.queryOptions());
  const error =
    expenses.isError || collections.isError ? (
      <QueryError
        message={
          expenses.data && collections.data
            ? "Unable to refresh recent expenses. Showing previous data."
            : "Unable to load recent expenses."
        }
        onRetry={() => {
          void expenses.refetch();
          void collections.refetch();
        }}
        retrying={expenses.isFetching || collections.isFetching}
      />
    ) : null;

  if (!expenses.data || !collections.data) {
    return error ?? <ExpenseListSkeleton />;
  }

  return (
    <>
      {error}
      <ExpenseList
        expenses={expenses.data}
        collections={collections.data}
        showDate
        onSelectExpense={(expense) => openDialog({ kind: "expense", expense })}
      />
      {expenses.data.length === 0 && (
        <p className="py-5 text-sm text-neutral-500">
          Your expenses will appear here.
        </p>
      )}
    </>
  );
}
