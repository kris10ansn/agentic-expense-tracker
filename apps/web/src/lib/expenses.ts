import type { inferOutput } from "@trpc/tanstack-react-query";
import {
  BusFront,
  House,
  MoreHorizontal,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
} from "lucide-react";
import type { TRPC } from "../trpc";

type ExtractedExpense = inferOutput<TRPC["addExpenses"]>["expenses"][number];
export type WorkspaceView =
  | "overview"
  | "expenses"
  | "collections"
  | "settings";

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
  budget: number;
};

export const categories = {
  groceries: {
    label: "Groceries",
    icon: ShoppingBasket,
    color: "#458a72",
    textColor: "#2d6b51",
    tint: "#edf5f0",
  },
  dining: {
    label: "Food & drink",
    icon: Utensils,
    color: "#cea46c",
    textColor: "#94642d",
    tint: "#faf3e8",
  },
  transport: {
    label: "Transport",
    icon: BusFront,
    color: "#7e9fb3",
    textColor: "#416479",
    tint: "#eef3f7",
  },
  housing: {
    label: "Housing",
    icon: House,
    color: "#263e35",
    textColor: "#263e35",
    tint: "#eaf0ec",
  },
  shopping: {
    label: "Shopping",
    icon: ShoppingBag,
    color: "#9c92b5",
    textColor: "#71608e",
    tint: "#f3f0f8",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    color: "#a7b0b5",
    textColor: "#53616c",
    tint: "#f0f2f4",
  },
} satisfies Record<
  Category,
  {
    label: string;
    icon: typeof House;
    color: string;
    textColor: string;
    tint: string;
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
export function totalExpenses(expenses: Expense[]) {
  return (
    expenses.reduce(
      (total, expense) => total + Math.round(expense.amount * 100),
      0,
    ) / 100
  );
}

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
