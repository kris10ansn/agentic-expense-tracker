import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { ExpenseFormData } from "../../../api/src/expenses/input";
import { PageHeader } from "../components/PageHeader";
import {
  CaptureDock,
  type CaptureDockData,
} from "../features/capture/CaptureDock";
import { PendingCapture } from "../features/capture/PendingCapture";
import { ExpenseList } from "../features/expenses/ExpenseList";
import { useWorkspace } from "../features/workspace/WorkspaceProvider";
import { client, trpc } from "../trpc";

function createFormData(input: ExpenseFormData): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const file of value) form.append(key, file);
    } else {
      form.set(key, value);
    }
  }

  return form;
}

export function HomePage() {
  const queryClient = useQueryClient();
  const pendingCaptures = useQuery(trpc.captures.listActive.queryOptions());

  const startCapture = useMutation({
    mutationKey: trpc.captures.start.mutationKey(),
    mutationFn: (input: ExpenseFormData) => {
      const formData = createFormData(input);
      return client.captures.start.mutate(formData);
    },
    onSuccess: (capture) => {
      const activeCapturesKey = trpc.captures.listActive.queryKey();

      queryClient.setQueryData(activeCapturesKey, (captures) =>
        captures !== undefined ? [...captures, capture] : undefined,
      );

      queryClient.invalidateQueries({ queryKey: activeCapturesKey });
    },
  });

  const [filesRecord, setFilesRecord] = useState<Record<string, File[]>>({});

  const { expenses, collections, addExpense, openDialog } = useWorkspace();
  const recentExpenses = [...expenses].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const handleSubmit = useCallback(
    async ({ description, files, collectionId }: CaptureDockData) => {
      const capture = await startCapture.mutateAsync({
        description,
        files,
        collectionId,
      });

      setFilesRecord({ ...filesRecord, [capture.id]: files });
    },
    [startCapture.mutateAsync, filesRecord],
  );

  return (
    <>
      <PageHeader title="Recent expenses" className="mb-5 lg:mb-10" />
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-20">
        <section
          aria-label="Recent expenses"
          className="min-h-0 flex-1 overflow-y-auto lg:order-last"
        >
          {pendingCaptures.data?.map((capture) => (
            <PendingCapture
              key={capture.id}
              capture={capture}
              files={filesRecord[capture.id] ?? []}
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
