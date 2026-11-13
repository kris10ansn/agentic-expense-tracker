import { expect, test } from "bun:test";
import { initialExpenses } from "../data/demo";
import { formatAmount } from "./expenses";

test.each([
  [0, "0,00"],
  [1, "0,01"],
  [30, "0,30"],
  [4500, "45,00"],
  [5025, "50,25"],
  [-5025, "−50,25"],
])("formats %i cents as NOK", (amountInCents, expected) => {
  expect(formatAmount(amountInCents, 2)).toBe(expected);
});

test("demo expenses use integer cents across all months", () => {
  expect(
    initialExpenses.every((expense) => Number.isInteger(expense.amountInCents)),
  ).toBe(true);
  expect(
    initialExpenses.find((expense) => expense.id === "2026-11-1")
      ?.amountInCents,
  ).toBe(64250);
  expect(
    initialExpenses.find((expense) => expense.id === "2026-10-1")
      ?.amountInCents,
  ).toBe(69390);
});
