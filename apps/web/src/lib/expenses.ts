import type { inferInput, inferOutput } from "@trpc/tanstack-react-query";
import type { TRPC } from "../trpc";

export type Expense = inferOutput<TRPC["expenses"]["list"]>[number];
export type Collection = inferOutput<TRPC["collections"]["list"]>[number];
export type ExpenseInput = inferInput<TRPC["expenses"]["create"]>;
export type CollectionInput = inferInput<TRPC["collections"]["create"]>;

export const currencies = {
  NOK: "NOK",
  EUR: "EUR",
  USD: "USD",
} satisfies Record<ExpenseInput["currency"], string>;

export function isCurrency(value: string): value is ExpenseInput["currency"] {
  return Object.hasOwn(currencies, value);
}

export const categories = {
  groceries: {
    label: "Groceries",
  },
  dining: {
    label: "Food & drink",
  },
  transport: {
    label: "Transport",
  },
  housing: {
    label: "Housing",
  },
  shopping: {
    label: "Shopping",
  },
  other: {
    label: "Other",
  },
} satisfies Record<
  Expense["category"],
  {
    label: string;
  }
>;

export function isKnownCategory(
  value: string,
): value is keyof typeof categories {
  return Object.hasOwn(categories, value);
}

export const collectionColors = [
  { value: "#458a72", label: "Green" },
  { value: "#7e9fb3", label: "Blue" },
  { value: "#cea46c", label: "Amber" },
  { value: "#9c92b5", label: "Purple" },
  { value: "#c77f7f", label: "Rose" },
];
export function formatAmount(amountInCents: number, fractionDigits = 0) {
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountInCents / 100);
}

export function toDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));
}
