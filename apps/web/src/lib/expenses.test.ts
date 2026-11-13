import { expect, test } from "bun:test";
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
