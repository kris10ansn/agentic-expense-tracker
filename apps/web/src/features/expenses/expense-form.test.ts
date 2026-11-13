import { expect, test } from "bun:test";
import type { Expense } from "../../lib/expenses";
import { parseExpenseForm } from "./expense-form";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: " Coffee ",
    amount: "50.25",
    currency: "NOK",
    category: "dining",
    date: "2026-11-13",
    collectionId: "",
    ...overrides,
  })) {
    data.set(key, value);
  }
  return data;
}

test("creates an API input with a Date, currency, and no collection", () => {
  expect(
    parseExpenseForm({ data: form(), expense: null, collections: [] }),
  ).toEqual({
    title: "Coffee",
    amountInCents: 5025,
    currency: "NOK",
    category: "dining",
    purchasedAt: new Date(2026, 10, 13, 12),
    collectionId: null,
    description: "",
    merchant: null,
  });
});

test("preserves purchase time and fields outside the edit form", () => {
  const expense: Expense = {
    id: "expense",
    title: "Coffee",
    amountInCents: 5025,
    currency: "EUR",
    category: "travel",
    purchasedAt: new Date(2026, 10, 13, 8, 45, 30),
    createdAt: new Date(2026, 10, 13),
    updatedAt: new Date(2026, 10, 13),
    collectionId: null,
    description: "Breakfast on the road",
    merchant: "Cafe",
  };
  const input = parseExpenseForm({
    data: form({ currency: "EUR", category: "travel", amount: "-10.50" }),
    expense,
    collections: [],
  });
  expect(input).toMatchObject({
    currency: "EUR",
    category: "travel",
    amountInCents: -1050,
    description: expense.description,
    merchant: expense.merchant,
    collectionId: null,
  });
  expect(input?.purchasedAt).toEqual(expense.purchasedAt);
  expect(input).not.toHaveProperty("id");
  expect(input).not.toHaveProperty("createdAt");
  expect(input).not.toHaveProperty("updatedAt");
  expect(
    parseExpenseForm({
      data: form({ date: "2026-11-14" }),
      expense,
      collections: [],
    })?.purchasedAt,
  ).toEqual(new Date(2026, 10, 14, 12));
});

test("accepts a selected collection and USD", () => {
  const collection = { id: "collection", title: "Travel", color: "#458a72" };
  expect(
    parseExpenseForm({
      data: form({ collectionId: collection.id, currency: "USD" }),
      expense: null,
      collections: [collection],
    }),
  ).toMatchObject({ collectionId: collection.id, currency: "USD" });
});

test.each([
  { title: " " },
  { title: "x".repeat(65) },
  { amount: "" },
  { amount: "invalid" },
  { amount: "21474836.48" },
  { amount: "-21474836.49" },
  { currency: "GBP" },
  { currency: "toString" },
  { category: "x".repeat(256) },
  { date: "2026-02-30" },
  { date: "not-a-date" },
  { collectionId: "missing" },
])("rejects invalid form fields %j", (overrides) => {
  expect(
    parseExpenseForm({ data: form(overrides), expense: null, collections: [] }),
  ).toBeUndefined();
});
