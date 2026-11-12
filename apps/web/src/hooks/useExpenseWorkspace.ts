import { useEffect, useState } from "react";
import {
  demoMonth,
  initialCollections,
  initialExpenses,
  months,
} from "../data/demo";
import type { Collection, Expense, WorkspaceView } from "../lib/expenses";

const NOTICE_DURATION_MS = 4500;

type DialogState =
  | { kind: "closed" }
  | { kind: "expense"; expense: Expense | null }
  | { kind: "collection"; collection: Collection | null }
  | { kind: "delete-expense"; expense: Expense }
  | { kind: "delete-collection"; collection: Collection };

export function useExpenseWorkspace(initialView: WorkspaceView = "home") {
  const [view, setView] = useState<WorkspaceView>(initialView);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [collections, setCollections] = useState(initialCollections);
  const [selectedMonth, setSelectedMonth] = useState(demoMonth);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const availableMonths = [
    ...new Set([
      ...months.map((month) => month.value),
      ...expenses.map((expense) => expense.date.slice(0, 7)),
      selectedMonth,
    ]),
  ]
    .sort()
    .reverse();
  const monthlyExpenses = expenses.filter((expense) =>
    expense.date.startsWith(selectedMonth),
  );
  const visibleExpenses = monthlyExpenses
    .filter(
      (expense) =>
        selectedCollection === "all" ||
        expense.collectionId === selectedCollection,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  function changeView(nextView: WorkspaceView) {
    setView(nextView);
    window.scrollTo({ top: 0 });
  }
  function openCollection(id: string) {
    setSelectedCollection(id);
    changeView("expenses");
  }
  function addExpense() {
    setDialog(
      collections.length
        ? { kind: "expense", expense: null }
        : { kind: "collection", collection: null },
    );
  }
  function closeDialog() {
    setDialog({ kind: "closed" });
  }
  function saveExpense(expense: Expense) {
    const exists = expenses.some((item) => item.id === expense.id);
    setExpenses((items) =>
      exists
        ? items.map((item) => (item.id === expense.id ? expense : item))
        : [expense, ...items],
    );
    setSelectedMonth(expense.date.slice(0, 7));
    if (selectedCollection !== "all")
      setSelectedCollection(expense.collectionId);
    setNotice(exists ? "Expense updated." : "Expense added.");
    closeDialog();
  }
  function saveCollection(collection: Collection) {
    const exists = collections.some((item) => item.id === collection.id);
    setCollections((items) =>
      exists
        ? items.map((item) => (item.id === collection.id ? collection : item))
        : [...items, collection],
    );
    setNotice(
      exists
        ? "Collection updated."
        : "Collection created. It's ready for expenses.",
    );
    closeDialog();
  }

  function deleteExpense(expense: Expense) {
    setExpenses((items) => items.filter((item) => item.id !== expense.id));
    closeDialog();
    setNotice("Expense deleted.");
  }

  function deleteCollection(collection: Collection) {
    setExpenses((items) =>
      items.filter((item) => item.collectionId !== collection.id),
    );
    setCollections((items) =>
      items.filter((item) => item.id !== collection.id),
    );
    if (selectedCollection === collection.id) setSelectedCollection("all");
    closeDialog();
    setNotice("Collection and its expenses deleted.");
  }

  return {
    view,
    expenses,
    collections,
    selectedMonth,
    selectedCollection,
    dialog,
    notice,
    availableMonths,
    monthlyExpenses,
    visibleExpenses,
    changeView,
    openCollection,
    addExpense,
    closeDialog,
    saveExpense,
    saveCollection,
    deleteExpense,
    deleteCollection,
    setDialog,
    setSelectedMonth,
    setSelectedCollection,
  };
}

export type ExpenseWorkspace = ReturnType<typeof useExpenseWorkspace>;
