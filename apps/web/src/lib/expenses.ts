import type { inferOutput } from "@trpc/tanstack-react-query";
import type { TRPC } from "../trpc";

type ExtractedExpense = inferOutput<TRPC["addExpenses"]>["expenses"][number];

export type Category = NonNullable<ExtractedExpense["category"]>;
export type Expense = Pick<ExtractedExpense, "title" | "amount"> & {
  id: string;
  category: Category;
  date: string;
  collectionId: string;
};
export type Collection = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type ExpenseInput = Omit<Expense, "id">;
export type CollectionInput = Omit<Collection, "id">;

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
  Category,
  {
    label: string;
  }
>;

export function isCategory(value: string): value is Category {
  return Object.hasOwn(categories, value);
}

export const collectionColors = [
  { value: "#458a72", label: "Green" },
  { value: "#7e9fb3", label: "Blue" },
  { value: "#cea46c", label: "Amber" },
  { value: "#9c92b5", label: "Purple" },
  { value: "#c77f7f", label: "Rose" },
];
export function formatAmount(amount: number, fractionDigits = 0) {
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));
}
