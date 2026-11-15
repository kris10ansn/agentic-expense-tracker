import { expect, test } from "bun:test";
import type { Expense } from "../../lib/expenses";
import { groupExpenses, sumExpenses } from "./group-expenses";

function expense(id: string, date: string, amountInCents: number): Expense {
  return {
    id,
    captureId: null,
    purchasedAt: new Date(`${date}T12:00:00`),
    createdAt: new Date("2026-11-13T00:00:00Z"),
    updatedAt: new Date("2026-11-13T00:00:00Z"),
    currency: "NOK",
    description: "",
    merchant: null,
    amountInCents,
    title: "Coffee",
    category: "dining",
    collectionId: "everyday",
  };
}

test("groups newest days first, totals cents exactly, and skips empty days", () => {
  const expenses = [
    expense("1", "2026-10-31", 2500),
    expense("2", "2026-11-12", 10),
    expense("3", "2026-11-12", 20),
  ];
  expect(
    groupExpenses(expenses, "day").map(({ date, totals }) => ({
      date,
      totals,
    })),
  ).toEqual([
    { date: "2026-11-12", totals: [{ currency: "NOK", amountInCents: 30 }] },
    { date: "2026-10-31", totals: [{ currency: "NOK", amountInCents: 2500 }] },
  ]);
  expect(expenses[0]?.id).toBe("1");
  expect(groupExpenses([], "day")).toEqual([]);
});

test("month totals equal their day totals across years", () => {
  const expenses = [
    expense("1", "2026-12-31", 1995),
    expense("2", "2027-01-01", 2550),
    expense("3", "2027-01-03", 5025),
  ];
  const months = groupExpenses(expenses, "month");
  expect(months.map(({ date, totals }) => ({ date, totals }))).toEqual([
    { date: "2027-01", totals: [{ currency: "NOK", amountInCents: 7575 }] },
    { date: "2026-12", totals: [{ currency: "NOK", amountInCents: 1995 }] },
  ]);
  expect(sumExpenses(expenses)).toEqual([
    { currency: "NOK", amountInCents: 9570 },
  ]);
});

test("negative amounts reduce daily and monthly totals", () => {
  const expenses = [
    expense("1", "2026-11-12", 4500),
    expense("2", "2026-11-12", -5025),
  ];
  expect(sumExpenses(expenses)).toEqual([
    { currency: "NOK", amountInCents: -525 },
  ]);
  expect(groupExpenses(expenses, "day")[0]?.totals).toEqual([
    { currency: "NOK", amountInCents: -525 },
  ]);
  expect(groupExpenses(expenses, "month")[0]?.totals).toEqual([
    { currency: "NOK", amountInCents: -525 },
  ]);
});

test("keeps daily and monthly totals separate by currency", () => {
  const expenses = [
    expense("nok", "2026-11-12", 4500),
    { ...expense("eur", "2026-11-12", 1500), currency: "EUR" },
    { ...expense("refund", "2026-11-12", -500), currency: "EUR" },
  ];
  const expected = [
    { currency: "EUR", amountInCents: 1000 },
    { currency: "NOK", amountInCents: 4500 },
  ];
  expect(sumExpenses(expenses)).toEqual(expected);
  expect(groupExpenses(expenses, "day")[0]?.totals).toEqual(expected);
  expect(groupExpenses(expenses, "month")[0]?.totals).toEqual(expected);
  expect(sumExpenses([])).toEqual([]);
});

test("groups purchase dates by the local calendar day at month boundaries", () => {
  const first = expense("first", "2026-11-01", 100);
  first.purchasedAt = new Date(2026, 10, 1, 0, 15);
  const last = expense("last", "2026-10-31", 200);
  last.purchasedAt = new Date(2026, 9, 31, 23, 45);
  expect(groupExpenses([last, first], "day").map(({ date }) => date)).toEqual([
    "2026-11-01",
    "2026-10-31",
  ]);
  expect(groupExpenses([last, first], "month").map(({ date }) => date)).toEqual(
    ["2026-11", "2026-10"],
  );
});
