import type { PendingCapture } from "../features/capture/types";
import type { Collection, Expense } from "../lib/expenses";

const months = [
  { value: "2026-11", label: "November 2026" },
  { value: "2026-10", label: "October 2026" },
  { value: "2026-09", label: "September 2026" },
];
export const initialCollections: Collection[] = [
  {
    id: "everyday",
    name: "Everyday",
    description: "Groceries, shopping, and the little things.",
    color: "#458a72",
  },
  {
    id: "home",
    name: "Home",
    description: "A place for rent and household costs.",
    color: "#7e9fb3",
  },
  {
    id: "out-and-about",
    name: "Out & about",
    description: "Coffee stops, good food, and getting around.",
    color: "#cea46c",
  },
];

const novemberExpenses: Expense[] = [
  {
    id: "1",
    title: "REMA 1000",
    amount: 642.5,
    category: "groceries",
    date: "2026-11-12",
    collectionId: "everyday",
  },
  {
    id: "2",
    title: "Kaffebrenneriet",
    amount: 68,
    category: "dining",
    date: "2026-11-12",
    collectionId: "out-and-about",
  },
  {
    id: "3",
    title: "Ruter",
    amount: 44,
    category: "transport",
    date: "2026-11-11",
    collectionId: "out-and-about",
  },
  {
    id: "4",
    title: "Uniqlo",
    amount: 699,
    category: "shopping",
    date: "2026-11-11",
    collectionId: "everyday",
  },
  {
    id: "5",
    title: "Meny",
    amount: 471.2,
    category: "groceries",
    date: "2026-11-10",
    collectionId: "everyday",
  },
  {
    id: "6",
    title: "Baker Hansen",
    amount: 89,
    category: "dining",
    date: "2026-11-10",
    collectionId: "out-and-about",
  },
  {
    id: "7",
    title: "Netflix",
    amount: 129,
    category: "other",
    date: "2026-11-09",
    collectionId: "everyday",
  },
  {
    id: "8",
    title: "IKEA",
    amount: 349,
    category: "shopping",
    date: "2026-11-08",
    collectionId: "everyday",
  },
  {
    id: "9",
    title: "KIWI",
    amount: 526.8,
    category: "groceries",
    date: "2026-11-07",
    collectionId: "everyday",
  },
  {
    id: "10",
    title: "Wolt",
    amount: 289,
    category: "dining",
    date: "2026-11-06",
    collectionId: "out-and-about",
  },
  {
    id: "11",
    title: "Apotek 1",
    amount: 149,
    category: "other",
    date: "2026-11-05",
    collectionId: "everyday",
  },
  {
    id: "12",
    title: "Coop Mega",
    amount: 384.9,
    category: "groceries",
    date: "2026-11-04",
    collectionId: "everyday",
  },
  {
    id: "13",
    title: "Spotify",
    amount: 119,
    category: "other",
    date: "2026-11-03",
    collectionId: "everyday",
  },
  {
    id: "14",
    title: "Ruter monthly pass",
    amount: 897,
    category: "transport",
    date: "2026-11-02",
    collectionId: "out-and-about",
  },
  {
    id: "15",
    title: "Monthly rent",
    amount: 8500,
    category: "housing",
    date: "2026-11-01",
    collectionId: "home",
  },
];

export const initialExpenses: Expense[] = months.flatMap((month, index) =>
  novemberExpenses.map((expense) => ({
    ...expense,
    id: `${month.value}-${expense.id}`,
    date: `${month.value}${expense.date.slice(7)}`,
    amount: Math.round(expense.amount * (1 + index * 0.08) * 100) / 100,
  })),
);

// Capture requests stay separate from saved expenses, as they will on the backend.
export const pendingCaptures: PendingCapture[] = [
  {
    id: "pending-lunch",
    collectionId: "everyday",
    input: {
      kind: "images",
      images: [
        {
          id: "lunch",
          src: "/demo-receipts/lunch-receipt.svg",
          name: "lunch-receipt.jpg",
          alt: "Sample receipt for lunch at Godt Brød, 185 kr",
        },
      ],
    },
  },
];
