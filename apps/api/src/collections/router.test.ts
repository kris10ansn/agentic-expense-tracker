import { afterAll, afterEach, expect, mock, spyOn, test } from "bun:test";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createDatabase } from "../db";
import {
  collectionColors,
  collectionCreateSchema,
  expenseCollectionTable,
} from "../db/schema";
import { appRouter } from "../router";

const db = createDatabase("postgresql://test:test@localhost:1/expenses");
const caller = appRouter.createCaller({ db }).collections;
const id = "00000000-0000-4000-8000-000000000001";
const input = { title: "Groceries", color: "#458a72" };

function mutate(operation: "create" | "update", input: unknown) {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: new Request(`http://localhost/trpc/collections.${operation}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: superjson.stringify(input),
    }),
    router: appRouter,
    createContext: () => ({ db }),
  });
}

afterEach(() => mock.restore());
afterAll(async () => {
  await db.$client.close();
});

test.each([
  ["empty title", { title: "" }],
  ["whitespace title", { title: " \n " }],
  ["long title", { title: "x".repeat(65) }],
  ["null title", { title: null }],
  ["empty color", { color: "" }],
  ["missing color prefix", { color: "458a72" }],
  ["short color", { color: "#fff" }],
  ["long color", { color: "#458a72ff" }],
  ["invalid hex color", { color: "#zzzzzz" }],
  ["null color", { color: null }],
])("rejects %s before accessing the database", async (_, fields) => {
  const insert = spyOn(db, "insert");
  const update = spyOn(db, "update");
  const created = await mutate("create", { ...input, ...fields });
  const updated = await mutate("update", { id, ...fields });
  expect(created.status).toBe(400);
  expect(updated.status).toBe(400);
  expect(insert).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test.each([{}, { title: "Groceries" }, { color: "#458a72" }])(
  "requires a title and color when creating a collection: %j",
  async (input) => {
    const insert = spyOn(db, "insert");
    expect((await mutate("create", input)).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  },
);

test("rejects updates without changes before accessing the database", async () => {
  const update = spyOn(db, "update");
  await expect(caller.update({ id })).rejects.toMatchObject({
    code: "BAD_REQUEST",
  });
  expect(update).not.toHaveBeenCalled();
});

test.each(["get", "update", "delete"] as const)(
  "%s rejects an invalid collection ID",
  async (operation) => {
    await expect(
      caller[operation]({ id: "invalid", title: "Groceries" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  },
);

test.each(collectionColors)("accepts the $label palette color", ({ value }) => {
  expect(
    collectionCreateSchema.parse({ title: "  Groceries  ", color: value }),
  ).toEqual({ title: "Groceries", color: value });
});

test("keeps the generated ID out of writable fields", () => {
  expect(collectionCreateSchema.parse({ ...input, id })).toEqual(input);
});

test("delete database failures remain server errors", async () => {
  const statement = db.delete(expenseCollectionTable);
  spyOn(statement, "execute").mockRejectedValue(new Error("Database offline"));
  spyOn(db, "delete").mockReturnValue(statement);

  await expect(caller.delete({ id })).rejects.toMatchObject({
    code: "INTERNAL_SERVER_ERROR",
  });
});
