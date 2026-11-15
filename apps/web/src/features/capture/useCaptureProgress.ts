import type { CaptureEvent } from "@ai-expenses/api";
import {
  type QueryClient,
  skipToken,
  useQueryClient,
} from "@tanstack/react-query";
import { type inferOutput, useSubscription } from "@trpc/tanstack-react-query";
import { type TRPC, trpc } from "../../trpc";

export type Capture = inferOutput<TRPC["captures"]["listActive"]>[number];

const progressMessages = {
  extracting: "Running AI analysis...",
  saving: "Saving new expenses...",
  complete: "Complete!",
  failed: "Failed generating expenses",
} satisfies Record<Capture["status"], string>;

export function getCaptureMessage(event: CaptureEvent | undefined): string {
  if (!event) return "Sending data...";
  if ("errorMessage" in event) return event.errorMessage;
  return progressMessages[event.capture.status];
}

export function applyCaptureEvent(
  queryClient: QueryClient,
  captureId: string,
  event: CaptureEvent,
) {
  if (event.capture.status !== "complete") return;

  if ("createdExpenses" in event) {
    const expensesKey = trpc.expenses.list.queryKey();

    queryClient.setQueryData(expensesKey, (expenses) => {
      if (!expenses) return expenses;

      const existingIds = new Set(expenses.map((expense) => expense.id));
      return [
        ...event.createdExpenses.filter(
          (expense) => !existingIds.has(expense.id),
        ),
        ...expenses,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });

    void queryClient.invalidateQueries({ queryKey: expensesKey });
  }

  const activeCapturesKey = trpc.captures.listActive.queryKey();
  queryClient.setQueryData(activeCapturesKey, (captures) =>
    captures?.filter((capture) => capture.id !== captureId),
  );
  void queryClient.invalidateQueries({ queryKey: activeCapturesKey });
}

export function useCaptureProgress(captureId: string | typeof skipToken) {
  const queryClient = useQueryClient();
  const { data } = useSubscription(
    trpc.captures.watch.subscriptionOptions(captureId, {
      onData: (event) => {
        if (captureId === skipToken) return;
        applyCaptureEvent(queryClient, captureId, event);
      },
    }),
  );

  return getCaptureMessage(data);
}
