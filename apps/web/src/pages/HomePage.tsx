import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { QueryError } from "../components/QueryError";
import {
  CaptureCard,
  type CaptureCardData,
  type CaptureNotice,
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
  const [notices, setNotices] = useState<Record<string, CaptureNotice>>({});

  const handleAttention = useCallback((notice: CaptureNotice) => {
    setNotices((current) => ({ ...current, [notice.id]: notice }));
  }, []);

  const dismissNotice = useCallback((id: string) => {
    setNotices((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
  }, []);

  const pendingCaptures = useQuery(trpc.captures.listActive.queryOptions());
  const sendingCaptures = useSendingCaptures();

  const startCapture = useStartCapture();

  const pending = pendingCaptures.data ?? [];
  const pendingIds = new Set(pending.map((capture) => capture.id));

  const captures: CaptureCardData[] = [
    ...Object.values(notices),
    ...pending
      .filter((capture) => notices[capture.id] === undefined)
      .map<CaptureCardData>(({ id, description }) => ({
        id,
        description,
        kind: "processing",
      })),
    ...sendingCaptures
      .filter((capture) => capture !== undefined)
      .filter(
        (capture) =>
          !pendingIds.has(capture.id) && notices[capture.id] === undefined,
      )
      .map<CaptureCardData>(({ id, description }) => ({
        id,
        description,
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
          {captures.map((capture) => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              files={filesRecord[capture.id] ?? []}
              onAttention={handleAttention}
              onDismiss={dismissNotice}
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
