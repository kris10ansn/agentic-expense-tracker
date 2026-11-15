import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import type { Expense } from "../../lib/expenses";
import { trpc } from "../../trpc";
import {
  applyCaptureEvent,
  type Capture,
  getCaptureMessage,
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

test("shows progress and extraction errors", () => {
  expect(getCaptureMessage(undefined)).toBe("Sending data...");
  expect(getCaptureMessage({ capture: { status: "extracting" } })).toBe(
    "Running AI analysis...",
  );
  expect(getCaptureMessage({ capture: { status: "saving" } })).toBe(
    "Saving new expenses...",
  );
  expect(getCaptureMessage(complete)).toBe("Complete!");
  expect(
    getCaptureMessage({
      capture: { status: "failed" },
      errorMessage: "AI unavailable",
    }),
  ).toBe("AI unavailable");
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

test("progress and failure keep the capture visible without invalidating expenses", () => {
  const client = new QueryClient();
  const expensesKey = trpc.expenses.list.queryKey();
  const capturesKey = trpc.captures.listActive.queryKey();
  client.setQueryData(expensesKey, [expense]);
  client.setQueryData(capturesKey, [capture]);
  applyCaptureEvent(client, capture.id, { capture: { status: "saving" } });
  applyCaptureEvent(client, capture.id, {
    capture: { status: "failed" },
    errorMessage: "AI unavailable",
  });
  expect(client.getQueryData(expensesKey)).toEqual([expense]);
  expect(client.getQueryData(capturesKey)).toEqual([capture]);
  expect(client.getQueryState(expensesKey)?.isInvalidated).toBe(false);
  client.clear();
});
