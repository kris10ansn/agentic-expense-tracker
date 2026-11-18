import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import type { Expense } from "../../lib/expenses";
import { trpc } from "../../trpc";
import {
  applyCaptureEvent,
  type Capture,
  getCaptureState,
} from "./useCaptureProgress";

const capture: Capture = {
  id: "capture-1",
  status: "extracting",
  description: "Coffee",
  fileNames: [],
  failures: null,
};
const expense: Expense = {
  id: "expense-1",
  captureId: capture.id,
  collectionId: null,
  title: "Coffee",
  description: "Coffee",
  amountInCents: 4500,
  currency: "NOK",
  category: "dining",
  merchant: null,
  purchasedAt: new Date("2026-11-15T12:00:00Z"),
  createdAt: new Date("2026-11-15T12:00:00Z"),
  updatedAt: new Date("2026-11-15T12:00:00Z"),
};
const complete = {
  capture: { status: "complete", failures: [] },
  createdExpenses: [expense],
} satisfies Parameters<typeof applyCaptureEvent>[2];

const connected = {
  sending: false,
  connectionStatus: "pending",
  connectionError: false,
} satisfies Omit<Parameters<typeof getCaptureState>[0], "event">;

test("distinguishes uploading, awaiting progress, and processing", () => {
  expect(
    getCaptureState({ ...connected, sending: true, event: undefined }),
  ).toEqual({ kind: "sending" });
  expect(getCaptureState({ ...connected, event: undefined })).toEqual({
    kind: "connecting",
  });
  for (const status of ["extracting", "saving"] satisfies Capture["status"][]) {
    expect(
      getCaptureState({ ...connected, event: { capture: { status } } }),
    ).toEqual({ kind: status });
  }
  expect(getCaptureState({ ...connected, event: complete })).toEqual({
    kind: "complete",
  });
});

test("connection loss and an unexpectedly ended stream stop processing", () => {
  for (const connectionStatus of [
    "connecting",
    "error",
    "idle",
  ] satisfies Parameters<typeof getCaptureState>[0]["connectionStatus"][]) {
    expect(
      getCaptureState({
        ...connected,
        connectionStatus,
        event: { capture: { status: "extracting" } },
      }),
    ).toEqual({ kind: "disconnected" });
  }
  expect(
    getCaptureState({
      ...connected,
      connectionStatus: "connecting",
      connectionError: true,
      event: undefined,
    }),
  ).toEqual({ kind: "disconnected" });
});

test("terminal outcomes survive subscription shutdown and connection errors", () => {
  const disconnected = {
    ...connected,
    connectionStatus: "idle",
    connectionError: true,
  } satisfies Omit<Parameters<typeof getCaptureState>[0], "event">;
  expect(
    getCaptureState({
      ...disconnected,
      event: { capture: { status: "failed" }, errorMessage: "AI unavailable" },
    }),
  ).toEqual({ kind: "failed", message: "AI unavailable" });
  expect(getCaptureState({ ...disconnected, event: complete })).toEqual({
    kind: "complete",
  });

  const failures = [
    {
      partialExpense: { title: "Coffee" },
      sourceText: "Coffee",
      reason: "Missing amount",
      suggestions: [],
    },
  ];
  expect(
    getCaptureState({
      ...disconnected,
      event: { ...complete, capture: { status: "complete", failures } },
    }),
  ).toEqual({ kind: "needs-review", failures });
});

test("completion merges expenses once, removes only its capture, and refreshes both lists", () => {
  const client = new QueryClient();
  const expensesKey = trpc.expenses.list.queryKey();
  const capturesKey = trpc.captures.listActive.queryKey();
  const otherCapture = { ...capture, id: "capture-2" };
  const existingExpense = {
    ...expense,
    id: "expense-2",
    createdAt: new Date("2026-11-14T12:00:00Z"),
  };
  client.setQueryData(expensesKey, [existingExpense]);
  client.setQueryData(capturesKey, [capture, otherCapture]);

  applyCaptureEvent(client, capture.id, complete);
  applyCaptureEvent(client, capture.id, complete);

  expect(client.getQueryData(expensesKey)).toEqual([expense, existingExpense]);
  expect(client.getQueryData(capturesKey)).toEqual([otherCapture]);
  expect(client.getQueryState(expensesKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(capturesKey)?.isInvalidated).toBe(true);
  client.clear();
});

test("completion sorts all expenses by creation time, including delayed results", () => {
  const client = new QueryClient();
  const key = trpc.expenses.list.queryKey();
  const newest = {
    ...expense,
    id: "newest",
    createdAt: new Date("2026-11-17T12:00:00Z"),
    purchasedAt: new Date("2026-11-01T12:00:00Z"),
  };
  const middle = {
    ...expense,
    id: "middle",
    createdAt: new Date("2026-11-16T12:00:00Z"),
  };
  const oldest = {
    ...expense,
    id: "oldest",
    createdAt: new Date("2026-11-14T12:00:00Z"),
    purchasedAt: new Date("2026-11-18T12:00:00Z"),
  };
  const existingExpenses = [middle, expense];
  const createdExpenses = [oldest, middle, newest];
  client.setQueryData(key, existingExpenses);

  applyCaptureEvent(client, capture.id, { ...complete, createdExpenses });

  expect(client.getQueryData(key)).toEqual([newest, middle, expense, oldest]);
  expect(existingExpenses).toEqual([middle, expense]);
  expect(createdExpenses).toEqual([oldest, middle, newest]);
  client.clear();
});

test("a reconnected completion refreshes existing expenses without clearing them", () => {
  const client = new QueryClient();
  const key = trpc.expenses.list.queryKey();
  client.setQueryData(key, [expense]);
  applyCaptureEvent(client, capture.id, { ...complete, createdExpenses: [] });
  expect(client.getQueryData(key)).toEqual([expense]);
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  client.clear();
});

test("completion does not create an incomplete cache when lists have not loaded", () => {
  const client = new QueryClient();
  applyCaptureEvent(client, capture.id, complete);
  expect(client.getQueryData(trpc.expenses.list.queryKey())).toBeUndefined();
  expect(
    client.getQueryData(trpc.captures.listActive.queryKey()),
  ).toBeUndefined();
  client.clear();
});

test("progress keeps the capture active; failure removes it and refreshes possibly saved expenses", () => {
  const client = new QueryClient();
  const expensesKey = trpc.expenses.list.queryKey();
  const capturesKey = trpc.captures.listActive.queryKey();
  client.setQueryData(expensesKey, [expense]);
  client.setQueryData(capturesKey, [capture]);
  applyCaptureEvent(client, capture.id, { capture: { status: "saving" } });
  expect(client.getQueryData(capturesKey)).toEqual([capture]);
  expect(client.getQueryState(expensesKey)?.isInvalidated).toBe(false);
  applyCaptureEvent(client, capture.id, {
    capture: { status: "failed" },
    errorMessage: "AI unavailable",
  });
  expect(client.getQueryData(expensesKey)).toEqual([expense]);
  expect(client.getQueryData(capturesKey)).toEqual([]);
  expect(client.getQueryState(expensesKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(capturesKey)?.isInvalidated).toBe(true);
  client.clear();
});
