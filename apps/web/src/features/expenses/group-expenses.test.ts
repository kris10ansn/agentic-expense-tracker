import { expect, test } from "bun:test";
import type { Expense } from "../../lib/expenses";
import { groupExpenses, sumExpenses } from "./group-expenses";

function expense(id: string, date: string, amount: number): Expense {
  return {
    id,
    date,
    amount,
    title: "Coffee",
    category: "dining",
    collectionId: "everyday",
  };
}

test("groups newest days first, totals cents exactly, and skips empty days", () => {
  const expenses = [
    expense("1", "2026-10-31", 25),
    expense("2", "2026-11-12", 0.1),
    expense("3", "2026-11-12", 0.2),
  ];
  expect(
    groupExpenses(expenses, "day").map(({ date, total }) => ({ date, total })),
  ).toEqual([
    { date: "2026-11-12", total: 0.3 },
    { date: "2026-10-31", total: 25 },
  ]);
  expect(expenses[0]?.id).toBe("1");
  expect(groupExpenses([], "day")).toEqual([]);
});

test("month totals equal their day totals across years", () => {
  const expenses = [
    expense("1", "2026-12-31", 19.95),
    expense("2", "2027-01-01", 25.5),
    expense("3", "2027-01-03", 50.25),
  ];
  const months = groupExpenses(expenses, "month");
  expect(months.map(({ date, total }) => ({ date, total }))).toEqual([
    { date: "2027-01", total: 75.75 },
    { date: "2026-12", total: 19.95 },
  ]);
  expect(sumExpenses(expenses)).toBe(95.7);
});
