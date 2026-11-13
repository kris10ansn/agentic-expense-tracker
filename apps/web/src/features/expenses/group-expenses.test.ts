import { expect, test } from "bun:test";
import type { Expense } from "../../lib/expenses";
import { groupExpenses, sumExpenses } from "./group-expenses";

function expense(id: string, date: string, amountInCents: number): Expense {
  return {
    id,
    date,
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
    groupExpenses(expenses, "day").map(({ date, totalInCents }) => ({
      date,
      totalInCents,
    })),
  ).toEqual([
    { date: "2026-11-12", totalInCents: 30 },
    { date: "2026-10-31", totalInCents: 2500 },
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
  expect(
    months.map(({ date, totalInCents }) => ({ date, totalInCents })),
  ).toEqual([
    { date: "2027-01", totalInCents: 7575 },
    { date: "2026-12", totalInCents: 1995 },
  ]);
  expect(sumExpenses(expenses)).toBe(9570);
});

test("negative amounts reduce daily and monthly totals", () => {
  const expenses = [
    expense("1", "2026-11-12", 4500),
    expense("2", "2026-11-12", -5025),
  ];
  expect(sumExpenses(expenses)).toBe(-525);
  expect(groupExpenses(expenses, "day")[0]?.totalInCents).toBe(-525);
  expect(groupExpenses(expenses, "month")[0]?.totalInCents).toBe(-525);
});
