import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { createDatabase } from "../db";
import {
  capturesTable,
  expenseCollectionTable,
  expensesTable,
} from "../db/schema";
import * as extraction from "../expenses/extract";
import { captureEvents } from "./events";
import { processCapture } from "./process";
import { capturesRouter } from "./router";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(databaseUrl === undefined)(
  "capture lifecycle with PostgreSQL",
  () => {
    const url = new URL(
      databaseUrl ?? "postgresql://test:test@localhost:1/test",
    );
    const admin = createDatabase(url.href);
    const databaseName = `captures_test_${crypto.randomUUID().replaceAll("-", "")}`;
    url.pathname = `/${databaseName}`;
    const db = createDatabase(url.href);
    const caller = capturesRouter.createCaller({ db });
    const collectionId = crypto.randomUUID();
    const input = { description: "Coffee", files: [], collectionId };
    const extracted = {
      expenses: [
        {
          title: "Coffee",
          description: "Coffee",
          amountInCents: 4500,
          currency: "NOK",
          category: "dining",
        },
      ],
      failures: [],
    } satisfies Awaited<ReturnType<typeof extraction.extractExpenses>>;

    beforeAll(async () => {
      await admin.$client.unsafe(`CREATE DATABASE "${databaseName}"`);
      await migrate(db, {
        migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
      });
      await db.insert(expenseCollectionTable).values({
        id: collectionId,
        title: "Meals",
        color: "#458a72",
      });
    });

    afterEach(() => mock.restore());
    afterAll(async () => {
      await db.$client.close();
      try {
        await admin.$client.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      } finally {
        await admin.$client.close();
      }
    });

    async function createCapture() {
      const id = crypto.randomUUID();
      await db.insert(capturesTable).values({
        id,
        status: "extracting",
        description: input.description,
        fileNames: [],
      });
      return id;
    }

    test("waits for saving persistence before inserting expenses", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      const events = captureEvents.events(captureId);
      const savingStarted = Promise.withResolvers<void>();
      const allowSaving = Promise.withResolvers<void>();
      const builder = db.update(capturesTable);
      const saving = builder.set({ status: "saving" });
      const executeSaving = saving.execute.bind(saving);
      spyOn(saving, "execute").mockImplementation(async () => {
        savingStarted.resolve();
        await allowSaving.promise;
        return executeSaving();
      });
      spyOn(builder, "set").mockReturnValue(saving);
      spyOn(db, "update").mockReturnValueOnce(builder);
      const insert = spyOn(db, "insert");
      const processing = processCapture({ captureId, input, db });

      try {
        await savingStarted.promise;
        expect(insert).not.toHaveBeenCalled();
      } finally {
        allowSaving.resolve();
        await processing;
        await events.return?.();
      }

      const [capture] = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, captureId));
      expect(capture).toMatchObject({ status: "complete", failures: [] });
      const saved = await db
        .select()
        .from(expensesTable)
        .where(eq(expensesTable.captureId, captureId));
      expect(saved).toMatchObject([
        { ...extracted.expenses[0], collectionId, captureId },
      ]);
    });

    test("starts a capture, streams progress and saved expenses, and removes it from active captures", async () => {
      const result =
        Promise.withResolvers<
          Awaited<ReturnType<typeof extraction.extractExpenses>>
        >();
      spyOn(extraction, "extractExpenses").mockReturnValue(result.promise);
      const form = new FormData();
      form.set("description", input.description);
      form.set("collectionId", collectionId);
      const capture = await caller.start(form);
      expect(await caller.listActive()).toContainEqual(capture);
      const watch = (await caller.watch(capture.id))[Symbol.asyncIterator]();
      expect(await watch.next()).toMatchObject({
        value: { capture: { status: "extracting" } },
      });

      result.resolve(extracted);
      expect(await watch.next()).toMatchObject({
        value: { capture: { status: "saving" } },
      });
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "complete", failures: [] },
          createdExpenses: [
            { ...extracted.expenses[0], captureId: capture.id, collectionId },
          ],
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
      expect(await caller.listActive()).not.toContainEqual(capture);
      expect(
        captureEvents.emit(capture.id, { capture: { status: "saving" } }),
      ).toBe(false);
    });

    test("completes empty extraction results and preserves partial failures", async () => {
      const captureId = await createCapture();
      const failures = [
        {
          partialExpense: { title: "Coffee" },
          sourceText: "Coffee",
          reason: "Missing amount",
          suggestions: [],
        },
      ];
      spyOn(extraction, "extractExpenses").mockResolvedValue({
        expenses: [],
        failures,
      });
      await processCapture({ captureId, input, db });
      const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "complete", failures },
          createdExpenses: [],
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
    });

    test("persists extraction errors, publishes their message, and ends the subscription", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockRejectedValue(
        new Error("AI unavailable"),
      );
      const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
      await watch.next();
      await processCapture({ captureId, input, db });
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "failed" },
          errorMessage: "AI unavailable",
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
      const [capture] = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, captureId));
      expect(capture?.status).toBe("failed");
      const reconnected = (await caller.watch(captureId))[
        Symbol.asyncIterator
      ]();
      expect(await reconnected.next()).toMatchObject({
        value: {
          capture: { status: "failed" },
          errorMessage: "Extraction failed",
        },
      });
      expect(await reconnected.next()).toEqual({
        done: true,
        value: undefined,
      });
    });

    test("reports expense persistence failures as failed captures", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      await processCapture({
        captureId,
        input: { ...input, collectionId: crypto.randomUUID() },
        db,
      });
      const [capture] = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, captureId));
      expect(capture?.status).toBe("failed");
      expect(
        await db
          .select()
          .from(expensesTable)
          .where(eq(expensesTable.captureId, captureId)),
      ).toEqual([]);
    });

    test("rejects missing captures and cleans up their listeners", async () => {
      const id = crypto.randomUUID();
      const watch = (await caller.watch(id))[Symbol.asyncIterator]();
      await expect(watch.next()).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(captureEvents.emit(id, { capture: { status: "saving" } })).toBe(
        false,
      );
    });

    test("cleans up a subscription when its caller disconnects", async () => {
      const captureId = await createCapture();
      const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
      await watch.next();
      await watch.return?.();
      expect(
        captureEvents.emit(captureId, { capture: { status: "saving" } }),
      ).toBe(false);
    });
  },
);
