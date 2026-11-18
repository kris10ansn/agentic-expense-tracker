import type { CaptureEvent } from "@ai-expenses/api";
import {
  type QueryClient,
  skipToken,
  useQueryClient,
} from "@tanstack/react-query";
import { type inferOutput, useSubscription } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { handleAuthenticationError } from "../../lib/auth";
import { type TRPC, trpc } from "../../trpc";

export type Capture = inferOutput<TRPC["captures"]["listActive"]>[number];

export type CaptureCardState =
  | { kind: "sending" | "connecting" | "extracting" | "saving" | "complete" }
  | { kind: "disconnected" }
  | { kind: "failed"; message: string }
  | { kind: "needs-review"; failures: NonNullable<Capture["failures"]> };

export type CaptureAttentionState = Extract<
  CaptureCardState,
  { kind: "failed" | "needs-review" }
>;

export function getCaptureState({
  event,
  sending,
  connectionStatus,
  connectionError,
}: {
  event: CaptureEvent | undefined;
  sending: boolean;
  connectionStatus: ReturnType<typeof useSubscription>["status"];
  connectionError: boolean;
}): CaptureCardState {
  if (event && "errorMessage" in event) {
    return { kind: "failed", message: event.errorMessage };
  }

  if (event?.capture.status === "complete") {
    const failures = event.capture.failures ?? [];
    if (failures.length > 0) {
      return { kind: "needs-review", failures };
    }
    return { kind: "complete" };
  }

  if (sending) {
    return { kind: "sending" };
  }

  if (
    connectionError ||
    connectionStatus === "error" ||
    connectionStatus === "idle" ||
    (connectionStatus === "connecting" && event !== undefined)
  ) {
    return { kind: "disconnected" };
  }

  if (!event) {
    return { kind: "connecting" };
  }

  return { kind: event.capture.status };
}

export function applyCaptureEvent(
  queryClient: QueryClient,
  captureId: string,
  event: CaptureEvent,
) {
  if (
    event.capture.status !== "complete" &&
    event.capture.status !== "failed"
  ) {
    return;
  }

  const expensesKey = trpc.expenses.list.queryKey();

  if ("createdExpenses" in event) {
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
  }

  void queryClient.invalidateQueries({ queryKey: expensesKey });

  const activeCapturesKey = trpc.captures.listActive.queryKey();
  queryClient.setQueryData(activeCapturesKey, (captures) =>
    captures?.filter((capture) => capture.id !== captureId),
  );
  void queryClient.invalidateQueries({ queryKey: activeCapturesKey });
}

export function useCaptureProgress(
  captureId: string | typeof skipToken,
  onAttention: (state: CaptureAttentionState) => void,
) {
  const queryClient = useQueryClient();
  const [lastEvent, setLastEvent] = useState<CaptureEvent>();
  const subscription = useSubscription(
    trpc.captures.watch.subscriptionOptions(captureId, {
      onError: handleAuthenticationError,
      onData: (event) => {
        if (captureId === skipToken) return;

        setLastEvent(event);

        const state = getCaptureState({
          event,
          sending: false,
          connectionStatus: "pending",
          connectionError: false,
        });

        if (state.kind === "failed" || state.kind === "needs-review") {
          onAttention(state);
        }
        applyCaptureEvent(queryClient, captureId, event);
      },
    }),
  );

  return getCaptureState({
    event: lastEvent,
    sending: captureId === skipToken,
    connectionStatus: subscription.status,
    connectionError: subscription.error !== null,
  });
}
