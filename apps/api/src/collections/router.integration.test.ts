import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import superjson from "superjson";
import { createDatabase } from "../db";
import { appRouter } from "../router";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(databaseUrl === undefined)(
  "collections with PostgreSQL",
  () => {
    const url = new URL(
      databaseUrl ?? "postgresql://test:test@localhost:1/test",
    );
    const admin = createDatabase(url.href);
    const databaseName = `collections_test_${crypto.randomUUID().replaceAll("-", "")}`;
    url.pathname = `/${databaseName}`;
    const db = createDatabase(url.href);
    const caller = appRouter.createCaller({ db });

    beforeAll(async () => {
      await admin.$client.unsafe(`CREATE DATABASE "${databaseName}"`);
      await migrate(db, {
        migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
      });
    });

    afterAll(async () => {
      await db.$client.close();
      try {
        await admin.$client.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      } finally {
        await admin.$client.close();
      }
    });

    test("creates, lists, reads, partially updates, and deletes persisted collections", async () => {
      const first = await caller.collections.create({
        title: "  Groceries  ",
        color: "#458a72",
      });
      const second = await caller.collections.create({
        title: "Travel",
        color: "#7e9fb3",
      });
      expect(first).toEqual({
        id: expect.any(String),
        title: "Groceries",
        color: "#458a72",
      });
      expect(first.id).not.toBe(second.id);
      expect(await caller.collections.list()).toEqual(
        expect.arrayContaining([first, second]),
      );
      expect(await caller.collections.get({ id: first.id })).toEqual(first);

      expect(
        await caller.collections.update({ id: first.id, title: "  Food  " }),
      ).toEqual({ ...first, title: "Food" });
      const updated = await caller.collections.update({
        id: first.id,
        color: "#ABCDEF",
      });
      expect(updated).toEqual({ ...first, title: "Food", color: "#ABCDEF" });
      expect(await caller.collections.get({ id: first.id })).toEqual(updated);
      expect(await caller.collections.get({ id: second.id })).toEqual(second);

      await caller.collections.delete({ id: first.id });
      await expect(
        caller.collections.get({ id: first.id }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(await caller.collections.list()).not.toContainEqual(updated);
      expect(await caller.collections.get({ id: second.id })).toEqual(second);
    });

    test("returns NOT_FOUND for missing collections", async () => {
      const id = crypto.randomUUID();
      await expect(caller.collections.get({ id })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await expect(
        caller.collections.update({ id, title: "Missing" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(caller.collections.delete({ id })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    test("returns a conflict for nonempty collections and preserves their expenses", async () => {
      const collection = await caller.collections.create({
        title: "Meals",
        color: "#458a72",
      });
      const expense = await caller.expenses.create({
        collectionId: collection.id,
        title: "Lunch",
        amountInCents: 4500,
        currency: "NOK",
        description: "Lunch",
        category: "dining",
      });

      await expect(
        caller.collections.delete({ id: collection.id }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Remove or move the collection's expenses before deleting it.",
      });
      expect(await caller.collections.get({ id: collection.id })).toEqual(
        collection,
      );
      expect(await caller.expenses.get({ id: expense.id })).toEqual(expense);

      await caller.expenses.update({ id: expense.id, collectionId: null });
      await caller.collections.delete({ id: collection.id });
      expect(await caller.expenses.get({ id: expense.id })).toEqual({
        ...expense,
        collectionId: null,
        updatedAt: expect.any(Date),
      });
    });

    test("exposes the collections router over HTTP with SuperJSON", async () => {
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: new Request("http://localhost/trpc/collections.create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: superjson.stringify({
            title: "HTTP collection",
            color: "#cea46c",
          }),
        }),
        router: appRouter,
        createContext: () => ({ db }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        result: {
          data: {
            json: {
              id: expect.any(String),
              title: "HTTP collection",
              color: "#cea46c",
            },
          },
        },
      });

      const missing = await fetchRequestHandler({
        endpoint: "/trpc",
        req: new Request(
          `http://localhost/trpc/collections.get?input=${encodeURIComponent(superjson.stringify({ id: crypto.randomUUID() }))}`,
        ),
        router: appRouter,
        createContext: () => ({ db }),
      });
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({
        error: {
          json: {
            message: "Collection not found.",
            data: { code: "NOT_FOUND" },
          },
        },
      });
    });
  },
);
