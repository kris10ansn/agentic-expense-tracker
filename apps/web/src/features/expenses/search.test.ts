import { expect, test } from "bun:test";
import { parseExpenseSearch } from "./search";

test("accepts text filters and discards invalid or obsolete URL parameters", () => {
  expect(
    parseExpenseSearch({
      q: "Coffee",
      collection: "everyday",
      variant: "days",
    }),
  ).toEqual({ q: "Coffee", collection: "everyday" });
  expect(parseExpenseSearch({ q: ["Coffee"], collection: 1 })).toEqual({});
  expect(parseExpenseSearch({ q: "", collection: null })).toEqual({});
});
