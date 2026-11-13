import { describe, expect, test } from "bun:test";
import type { CollectionInput, ExpenseInput } from "../lib/expenses";
import { createMockApi } from "./mock-api";

const collection: CollectionInput = {
  name: "Everyday",
  description: "",
  color: "#458a72",
};
const expense: ExpenseInput = {
  title: "Lunch",
  amount: 50.25,
  category: "dining",
  date: "2026-11-12",
  collectionId: "everyday",
};

function seed() {
  return {
    collections: [{ ...collection, id: "everyday" }],
    expenses: [{ ...expense, id: "lunch" }],
  };
}

describe("mock resource operations", () => {
  test("creates server-owned IDs and returns independent read snapshots", async () => {
    const data = seed();
    const api = createMockApi(data);
    const created = await api.expenses.create({ ...expense, title: "Coffee" });
    expect(created.id).not.toBe("lunch");
    expect(created.id).toBeTruthy();
    const firstRead = await api.expenses.list();
    firstRead.splice(0);
    created.title = "Changed by a caller";
    expect(await api.expenses.list()).toHaveLength(2);
    expect(
      (await api.expenses.list()).find((item) => item.id === created.id)?.title,
    ).toBe("Coffee");
    expect(data.expenses).toHaveLength(1);
  });

  test("updates and moves an expense, then deletes it", async () => {
    const api = createMockApi(seed());
    const travel = await api.collections.create({
      ...collection,
      name: "Travel",
    });
    await api.expenses.update("lunch", {
      ...expense,
      collectionId: travel.id,
      amount: 75.1,
      date: "2026-12-02",
    });
    expect(await api.expenses.list()).toEqual([
      {
        ...expense,
        id: "lunch",
        collectionId: travel.id,
        amount: 75.1,
        date: "2026-12-02",
      },
    ]);
    await api.collections.update(travel.id, { ...collection, name: "Holiday" });
    expect(
      (await api.collections.list()).find((item) => item.id === travel.id)
        ?.name,
    ).toBe("Holiday");
    await api.expenses.delete("lunch");
    expect(await api.expenses.list()).toEqual([]);
  });

  test("deleting a collection removes its expenses in every month and its pending captures", async () => {
    const api = createMockApi({
      ...seed(),
      pendingCaptures: [
        {
          id: "pending",
          collectionId: "everyday",
          input: { kind: "text", description: "Coffee" },
        },
      ],
    });
    const travel = await api.collections.create({
      ...collection,
      name: "Travel",
    });
    await api.expenses.create({ ...expense, date: "2026-10-02" });
    const kept = await api.expenses.create({
      ...expense,
      collectionId: travel.id,
    });
    await api.collections.delete("everyday");
    expect(await api.expenses.list()).toEqual([kept]);
    expect(await api.collections.list()).toEqual([travel]);
    expect(await api.captures.listPending()).toEqual([]);
  });

  test("rejects missing collections and records without corrupting saved data", async () => {
    const data = seed();
    const api = createMockApi(data);
    await expect(
      api.expenses.create({ ...expense, collectionId: "missing" }),
    ).rejects.toThrow("collection");
    await expect(
      api.expenses.update("lunch", { ...expense, collectionId: "missing" }),
    ).rejects.toThrow("collection");
    await expect(api.expenses.update("missing", expense)).rejects.toThrow(
      "expense",
    );
    await expect(api.expenses.delete("missing")).rejects.toThrow("expense");
    await expect(api.collections.update("missing", collection)).rejects.toThrow(
      "collection",
    );
    await expect(api.collections.delete("missing")).rejects.toThrow(
      "collection",
    );
    expect(await api.expenses.list()).toEqual(data.expenses);
    expect(await api.collections.list()).toEqual(data.collections);
  });
});
