import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { createDatabase } from "../db";
import { expensesTable } from "../db/schema";
import { appRouter } from "../router";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(databaseUrl === undefined)("expenses with PostgreSQL", () => {
  const url = new URL(databaseUrl ?? "postgresql://test:test@localhost:1/test");
  const admin = createDatabase(url.href);
  const databaseName = `expenses_test_${crypto.randomUUID().replaceAll("-", "")}`;
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

  test("lists expenses newest first by creation time, regardless of purchase or update time", async () => {
    const purchase = {
      title: "Coffee",
      description: "Coffee",
      amountInCents: 4500,
      currency: "NOK",
      category: "dining",
    };
    const oldest = {
      ...purchase,
      id: crypto.randomUUID(),
      createdAt: new Date("2026-11-13T12:00:00Z"),
      purchasedAt: new Date("2026-11-15T12:00:00Z"),
      updatedAt: new Date("2026-11-15T12:00:00Z"),
    };
    const middle = {
      ...purchase,
      id: crypto.randomUUID(),
      createdAt: new Date("2026-11-14T12:00:00Z"),
      purchasedAt: new Date("2026-11-14T12:00:00Z"),
      updatedAt: new Date("2026-11-14T12:00:00Z"),
    };
    const newest = {
      ...purchase,
      id: crypto.randomUUID(),
      createdAt: new Date("2026-11-15T12:00:00Z"),
      purchasedAt: new Date("2026-11-13T12:00:00Z"),
      updatedAt: new Date("2026-11-13T12:00:00Z"),
    };
    await db.insert(expensesTable).values([middle, oldest, newest]);

    expect(await caller.expenses.list()).toEqual(
      [newest, middle, oldest].map((expense) => ({
        ...expense,
        merchant: null,
        collectionId: null,
        captureId: null,
      })),
    );
  });
});
