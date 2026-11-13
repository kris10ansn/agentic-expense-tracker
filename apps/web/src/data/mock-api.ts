import type { PendingCapture } from "../features/capture/types";
import type {
  Collection,
  CollectionInput,
  Expense,
  ExpenseInput,
} from "../lib/expenses";
import { initialCollections, initialExpenses, pendingCaptures } from "./demo";

// Promise-based resource operations are the replacement point for future tRPC
// query/mutation functions. IDs and collection deletion belong to this layer.
// The in-memory store survives navigation and resets on a full page reload.
export function createMockApi(seed: {
  collections: Collection[];
  expenses: Expense[];
  pendingCaptures?: PendingCapture[];
}) {
  let collections = structuredClone(seed.collections);
  let expenses = structuredClone(seed.expenses);
  let captures = structuredClone(seed.pendingCaptures ?? []);

  function requireCollection(id: string) {
    if (!collections.some((collection) => collection.id === id)) {
      throw new Error("This collection no longer exists.");
    }
  }

  function requireExpense(id: string) {
    if (!expenses.some((expense) => expense.id === id)) {
      throw new Error("This expense no longer exists.");
    }
  }

  return {
    collections: {
      async list() {
        return structuredClone(collections);
      },
      async create(input: CollectionInput) {
        const collection = { ...input, id: crypto.randomUUID() };
        collections = [...collections, collection];
        return { ...collection };
      },
      async update(id: string, input: CollectionInput) {
        requireCollection(id);
        const collection = { ...input, id };
        collections = collections.map((item) =>
          item.id === id ? collection : item,
        );
        return { ...collection };
      },
      async delete(id: string) {
        requireCollection(id);
        collections = collections.filter((collection) => collection.id !== id);
        expenses = expenses.filter((expense) => expense.collectionId !== id);
        captures = captures.filter((capture) => capture.collectionId !== id);
      },
    },
    expenses: {
      async list() {
        return structuredClone(expenses);
      },
      async create(input: ExpenseInput) {
        requireCollection(input.collectionId);
        const expense = { ...input, id: crypto.randomUUID() };
        expenses = [expense, ...expenses];
        return { ...expense };
      },
      async update(id: string, input: ExpenseInput) {
        requireExpense(id);
        requireCollection(input.collectionId);
        const expense = { ...input, id };
        expenses = expenses.map((item) => (item.id === id ? expense : item));
        return { ...expense };
      },
      async delete(id: string) {
        requireExpense(id);
        expenses = expenses.filter((expense) => expense.id !== id);
      },
    },
    captures: {
      async listPending(): Promise<PendingCapture[]> {
        return structuredClone(captures);
      },
    },
  };
}

export const mockApi = createMockApi({
  collections: initialCollections,
  expenses: initialExpenses,
  pendingCaptures,
});
