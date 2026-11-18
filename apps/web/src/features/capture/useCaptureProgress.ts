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

export type Capture = inferOutput<TRPC["captures"]["listVisible"]>[number];

export type CaptureCardState =
  | { kind: "sending" | "connecting" | "extracting" | "saving" | "complete" }
  | { kind: "disconnected" }
  | { kind: "failed"; message: string }
  | { kind: "needs-review"; failures: NonNullable<Capture["failures"]> };

export function getCaptureState({
  capture,
  sending,
  connectionStatus,
  connectionError,
}: {
  capture: CaptureEvent["capture"] | undefined;
  sending: boolean;
  connectionStatus: ReturnType<typeof useSubscription>["status"];
  connectionError: boolean;
}): CaptureCardState {
  if (capture?.status === "failed") {
    return {
      kind: "failed",
      message: capture.errorMessage ?? "Extraction failed",
    };
  }

  if (capture?.status === "complete") {
    const failures = capture.failures ?? [];
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
    (connectionStatus === "connecting" && capture !== undefined)
  ) {
    return { kind: "disconnected" };
  }

  if (!capture) {
    return { kind: "connecting" };
  }

  return { kind: capture.status };
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

  const capturesKey = trpc.captures.listVisible.queryKey();
  const cleanSuccess =
    event.capture.status === "complete" && !event.capture.failures?.length;
  queryClient.setQueryData(capturesKey, (captures) =>
    captures?.flatMap((capture) => {
      if (capture.id !== captureId) {
        return [capture];
      }

      if (cleanSuccess) {
        return [];
      }

      return [
        {
          ...capture,
          status: event.capture.status,
          failures: event.capture.failures ?? capture.failures,
          errorMessage: event.capture.errorMessage ?? capture.errorMessage,
        },
      ];
    }),
  );
  void queryClient.invalidateQueries({ queryKey: capturesKey });
}

export function useCaptureProgress(capture: Capture | undefined) {
  const queryClient = useQueryClient();
  const [lastEvent, setLastEvent] = useState<CaptureEvent>();
  const terminal =
    capture?.status === "complete" || capture?.status === "failed";
  const captureId = capture && !terminal ? capture.id : skipToken;
  const subscription = useSubscription(
    trpc.captures.watch.subscriptionOptions(captureId, {
      onError: handleAuthenticationError,
      onData: (event) => {
        if (captureId === skipToken) return;

        setLastEvent(event);

        applyCaptureEvent(queryClient, captureId, event);
      },
    }),
  );

  return getCaptureState({
    capture: terminal ? capture : lastEvent?.capture,
    sending: capture === undefined,
    connectionStatus: subscription.status,
    connectionError: subscription.error !== null,
  });
}
