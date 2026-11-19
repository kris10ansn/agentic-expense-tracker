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
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import superjson from "superjson";
import {
  authenticatedContext,
  seedTestUser,
  testUserId,
} from "../auth/test-context";
import { createDatabase } from "../db";
import {
  type Capture,
  capturesTable,
  expenseCollectionTable,
  expensesTable,
} from "../db/schema";
import * as extraction from "../expenses/extract";
import { appRouter } from "../router";
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
    const caller = capturesRouter.createCaller(authenticatedContext(db));
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
      await seedTestUser(db);
      await db.insert(expenseCollectionTable).values({
        userId: testUserId,
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
        userId: testUserId,
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
      const transaction = spyOn(db, "transaction");
      const processing = processCapture({
        userId: testUserId,
        captureId,
        input: { ...input, id: captureId },
        db,
      });

      try {
        await savingStarted.promise;
        expect(transaction).not.toHaveBeenCalled();
        expect(
          await db
            .select()
            .from(expensesTable)
            .where(eq(expensesTable.captureId, captureId)),
        ).toEqual([]);
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

    test("starts a capture, streams progress and saved expenses, and removes it from visible captures", async () => {
      const result =
        Promise.withResolvers<
          Awaited<ReturnType<typeof extraction.extractExpenses>>
        >();
      spyOn(extraction, "extractExpenses").mockReturnValue(result.promise);
      const id = crypto.randomUUID();
      const form = new FormData();
      form.set("id", id);
      form.set("description", input.description);
      form.set("collectionId", collectionId);
      const capture = await caller.start(form);
      expect(capture.id).toBe(id);
      expect(await caller.listVisible()).toContainEqual(capture);
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
      expect(await caller.listVisible()).not.toContainEqual(capture);
      expect(
        captureEvents.emit(capture.id, { capture: { status: "saving" } }),
      ).toBe(false);
    });

    test.each([
      {
        result: {
          kind: "not_recognized",
          reason: "No purchase details found.",
        },
        errorMessage: "No purchase details found.",
      },
      {
        result: { expenses: [], failures: [] },
        errorMessage: "No expenses could be recognized.",
      },
    ] satisfies {
      result: Awaited<ReturnType<typeof extraction.extractExpenses>>;
      errorMessage: string;
    }[])(
      "fails captures without complete or partial expenses: $errorMessage",
      async ({ result, errorMessage }) => {
        const captureId = await createCapture();
        spyOn(extraction, "extractExpenses").mockResolvedValue(result);
        const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
        await watch.next();

        await processCapture({
          userId: testUserId,
          captureId,
          input: { ...input, id: captureId },
          db,
        });

        expect(await watch.next()).toMatchObject({
          value: { capture: { status: "failed", errorMessage } },
        });
        expect(await watch.next()).toEqual({ done: true, value: undefined });
        const [capture] = await db
          .select()
          .from(capturesTable)
          .where(eq(capturesTable.id, captureId));
        expect(capture).toMatchObject({
          status: "failed",
          errorMessage: expect.any(String),
        });
        expect(
          await db
            .select()
            .from(expensesTable)
            .where(eq(expensesTable.captureId, captureId)),
        ).toEqual([]);
        expect(await caller.listVisible()).toContainEqual(
          expect.objectContaining({ id: captureId, errorMessage }),
        );
      },
    );

    test("completes partial-only extraction results and preserves partial failures", async () => {
      const captureId = await createCapture();
      const failures = [
        {
          partialExpense: { title: "Coffee" },
          sourceText: "Coffee",
          sourceImageIds: [],
          reason: "Missing amount",
          suggestions: [],
        },
      ];
      spyOn(extraction, "extractExpenses").mockResolvedValue({
        expenses: [],
        failures,
      });
      await processCapture({
        userId: testUserId,
        captureId,
        input: { ...input, id: captureId },
        db,
      });
      const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "complete", failures },
          createdExpenses: [],
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
    });

    test("preserves image references through live updates, storage, and reconnects", async () => {
      const result =
        Promise.withResolvers<
          Awaited<ReturnType<typeof extraction.extractExpenses>>
        >();
      spyOn(extraction, "extractExpenses").mockReturnValue(result.promise);
      const failures = [
        {
          partialExpense: { title: "Lunch" },
          sourceText: "Lunch 120 / Lunch 150",
          sourceImageIds: ["image-1", "image-2"],
          reason: "Conflicting totals",
          suggestions: [],
        },
        {
          partialExpense: { title: "Tea" },
          sourceText: "Tea",
          sourceImageIds: ["image-2"],
          reason: "Missing amount",
          suggestions: [],
        },
      ];
      const form = new FormData();
      form.set("id", crypto.randomUUID());
      form.set("description", "Lunch and tea receipts");
      form.set("collectionId", collectionId);
      form.append(
        "files",
        new File(["first"], "receipt.png", { type: "image/png" }),
      );
      form.append(
        "files",
        new File(["second"], "receipt.png", { type: "image/png" }),
      );
      const capture = await caller.start(form);
      const watch = (await caller.watch(capture.id))[Symbol.asyncIterator]();
      expect(await watch.next()).toMatchObject({
        value: { capture: { status: "extracting" } },
      });
      const saving = watch.next();
      result.resolve({ ...extracted, failures });
      expect(await saving).toMatchObject({
        value: { capture: { status: "saving" } },
      });
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "complete", failures },
          createdExpenses: [{ title: "Coffee" }],
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });

      const reconnectedDb = createDatabase(url.href);
      try {
        const reconnected = capturesRouter.createCaller(
          authenticatedContext(reconnectedDb),
        );
        expect(await reconnected.listVisible()).toContainEqual(
          expect.objectContaining({
            id: capture.id,
            fileNames: ["receipt.png", "receipt.png"],
            failures,
          }),
        );
        const restored = (await reconnected.watch(capture.id))[
          Symbol.asyncIterator
        ]();
        expect(await restored.next()).toMatchObject({
          value: { capture: { failures } },
        });
        expect(await restored.next()).toEqual({ done: true, value: undefined });
      } finally {
        await reconnectedDb.$client.close();
      }
    });

    test("accepts multipart captures over HTTP and persists their expenses", async () => {
      const result =
        Promise.withResolvers<
          Awaited<ReturnType<typeof extraction.extractExpenses>>
        >();
      const extract = spyOn(extraction, "extractExpenses").mockReturnValue(
        result.promise,
      );
      const id = crypto.randomUUID();
      const image = new File(["receipt"], "receipt.png", { type: "image/png" });
      const form = new FormData();
      form.set("id", id);
      form.set("collectionId", collectionId);
      form.set("description", "  Coffee  ");
      form.append("files", image);
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: new Request("http://localhost/trpc/captures.start", {
          method: "POST",
          body: form,
        }),
        router: appRouter,
        createContext: () => authenticatedContext(db),
      });
      const capture: Capture = {
        id,
        status: "extracting",
        description: "Coffee",
        fileNames: [image.name],
        failures: null,
        errorMessage: null,
        dismissedAt: null,
      };

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        result: { data: superjson.serialize(capture) },
      });
      expect(await caller.listVisible()).toContainEqual(capture);
      expect(extract).toHaveBeenCalledWith({
        id,
        collectionId,
        description: "Coffee",
        files: [
          expect.objectContaining({
            name: image.name,
            type: image.type,
            size: image.size,
          }),
        ],
      });

      const watch = (await caller.watch(id))[Symbol.asyncIterator]();
      await watch.next();
      const purchasedAt = new Date("2026-11-13T12:00:00Z");
      const expenses = extracted.expenses.map((expense) => ({
        ...expense,
        purchasedAt,
      }));
      result.resolve({ expenses, failures: [] });
      expect(await watch.next()).toMatchObject({
        value: { capture: { status: "saving" } },
      });
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "complete" },
          createdExpenses: [{ ...expenses[0], captureId: id, collectionId }],
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
      expect(
        await db
          .select()
          .from(expensesTable)
          .where(eq(expensesTable.captureId, id)),
      ).toMatchObject([{ ...expenses[0], captureId: id, collectionId }]);
    });

    test.each(["failed", "review"])(
      "keeps %s captures across connections until an idempotent dismissal",
      async (outcome) => {
        const captureId = await createCapture();
        const failures = [
          {
            partialExpense: { title: "Tea" },
            sourceText: "Tea",
            sourceImageIds: [],
            reason: "Missing amount",
            suggestions: [],
          },
        ];
        const extract = spyOn(extraction, "extractExpenses");
        if (outcome === "failed") {
          extract.mockRejectedValue(new Error("AI unavailable"));
        } else {
          extract.mockResolvedValue({ ...extracted, failures });
        }

        await processCapture({
          userId: testUserId,
          captureId,
          input: { ...input, id: captureId },
          db,
        });
        const reconnectedDb = createDatabase(url.href);
        try {
          const reconnected = capturesRouter.createCaller(
            authenticatedContext(reconnectedDb),
          );
          const notice = (await reconnected.listVisible()).find(
            (capture) => capture.id === captureId,
          );
          expect(notice).toMatchObject({
            id: captureId,
            description: "Coffee",
            dismissedAt: null,
            ...(outcome === "failed"
              ? { status: "failed", errorMessage: "AI unavailable" }
              : { status: "complete", failures }),
          });
          const expensesBefore = await db
            .select()
            .from(expensesTable)
            .where(eq(expensesTable.captureId, captureId));

          expect(await reconnected.dismiss(captureId)).toEqual({
            id: captureId,
          });
          const dismissed = await db
            .select()
            .from(capturesTable)
            .where(eq(capturesTable.id, captureId));
          expect(dismissed[0]?.dismissedAt).toBeInstanceOf(Date);
          expect(await caller.dismiss(captureId)).toEqual({ id: captureId });
          expect(await caller.listVisible()).not.toContainEqual(
            expect.objectContaining({ id: captureId }),
          );
          expect(await reconnected.listVisible()).not.toContainEqual(
            expect.objectContaining({ id: captureId }),
          );
          expect(
            await db
              .select()
              .from(capturesTable)
              .where(eq(capturesTable.id, captureId)),
          ).toEqual(dismissed);
          expect(
            await db
              .select()
              .from(expensesTable)
              .where(eq(expensesTable.captureId, captureId)),
          ).toEqual(expensesBefore);
        } finally {
          await reconnectedDb.$client.close();
        }
      },
    );

    test("keeps legacy failures, hides clean successes, and rejects dismissing active or missing captures", async () => {
      const id = await createCapture();
      await expect(caller.dismiss(id)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await expect(caller.dismiss(crypto.randomUUID())).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await db
        .update(capturesTable)
        .set({ status: "saving" })
        .where(eq(capturesTable.id, id));
      await expect(caller.dismiss(id)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(await caller.listVisible()).toContainEqual(
        expect.objectContaining({ id, status: "saving", dismissedAt: null }),
      );

      for (const failures of [null, []]) {
        await db
          .update(capturesTable)
          .set({ status: "complete", failures })
          .where(eq(capturesTable.id, id));
        expect(await caller.listVisible()).not.toContainEqual(
          expect.objectContaining({ id }),
        );
        await expect(caller.dismiss(id)).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      }

      await db
        .update(capturesTable)
        .set({ status: "failed" })
        .where(eq(capturesTable.id, id));
      expect(await caller.listVisible()).toContainEqual(
        expect.objectContaining({ id, errorMessage: null }),
      );
      await caller.dismiss(id);
    });

    test("persists extraction errors, publishes their message, and ends the subscription", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockRejectedValue(
        new Error("AI unavailable"),
      );
      const watch = (await caller.watch(captureId))[Symbol.asyncIterator]();
      await watch.next();
      await processCapture({
        userId: testUserId,
        captureId,
        input: { ...input, id: captureId },
        db,
      });
      expect(await watch.next()).toMatchObject({
        value: {
          capture: { status: "failed", errorMessage: "AI unavailable" },
        },
      });
      expect(await watch.next()).toEqual({ done: true, value: undefined });
      const [capture] = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, captureId));
      expect(capture).toMatchObject({
        status: "failed",
        errorMessage: expect.any(String),
      });
      const reconnected = (await caller.watch(captureId))[
        Symbol.asyncIterator
      ]();
      expect(await reconnected.next()).toMatchObject({
        value: {
          capture: { status: "failed", errorMessage: "AI unavailable" },
        },
      });
      expect(await reconnected.next()).toEqual({
        done: true,
        value: undefined,
      });
    });

    test("visibility also handles failures stored as native JSON arrays", async () => {
      const id = await createCapture();
      const failures = [
        {
          partialExpense: { title: "Coffee" },
          sourceText: "Coffee",
          reason: "Missing amount",
          suggestions: [],
        },
      ];
      for (const entries of [[], failures]) {
        await db
          .update(capturesTable)
          .set({
            status: "complete",
            failures: sql`${JSON.stringify(entries)}::text::jsonb`,
          })
          .where(eq(capturesTable.id, id));
        const visible = (await caller.listVisible()).some(
          (capture) => capture.id === id,
        );
        expect(visible).toBe(entries.length > 0);
      }
      await caller.dismiss(id);
      expect(await caller.listVisible()).not.toContainEqual(
        expect.objectContaining({ id }),
      );
    });

    test("the migration preserves outcomes when its columns already exist", async () => {
      const id = await createCapture();
      await db
        .update(capturesTable)
        .set({ status: "failed", errorMessage: "Saved failure" })
        .where(eq(capturesTable.id, id));
      await caller.dismiss(id);
      const before = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, id));
      const migration = await Bun.file(
        new URL(
          "../../drizzle/0005_perpetual_king_bedlam.sql",
          import.meta.url,
        ),
      ).text();
      for (const statement of migration.split("--> statement-breakpoint")) {
        await db.$client.unsafe(statement);
      }
      expect(
        await db.select().from(capturesTable).where(eq(capturesTable.id, id)),
      ).toEqual(before);
    });

    test("reports expense persistence failures as failed captures", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      await processCapture({
        userId: testUserId,
        captureId,
        input: { ...input, id: captureId, collectionId: crypto.randomUUID() },
        db,
      });
      const [capture] = await db
        .select()
        .from(capturesTable)
        .where(eq(capturesTable.id, captureId));
      expect(capture).toMatchObject({
        status: "failed",
        errorMessage: expect.any(String),
      });
      expect(
        await db
          .select()
          .from(expensesTable)
          .where(eq(expensesTable.captureId, captureId)),
      ).toEqual([]);
    });

    test("publishes completion only after the save transaction commits", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      const emit = spyOn(captureEvents, "emit");
      const transaction = db.transaction.bind(db);
      spyOn(db, "transaction").mockImplementation(async (work, config) => {
        const result = await transaction(work, config);
        expect(emit).not.toHaveBeenCalledWith(
          captureId,
          expect.objectContaining({
            capture: expect.objectContaining({ status: "complete" }),
          }),
        );
        return result;
      });

      await processCapture({
        userId: testUserId,
        captureId,
        input: { ...input, id: captureId },
        db,
      });

      expect(emit).toHaveBeenCalledWith(
        captureId,
        expect.objectContaining({
          capture: expect.objectContaining({ status: "complete" }),
          createdExpenses: [expect.objectContaining({ captureId })],
        }),
      );
    });

    test("a completion notification failure does not overwrite the committed outcome", async () => {
      const captureId = await createCapture();
      const notificationError = new Error("Notification failed");
      const logError = spyOn(console, "error").mockImplementation(() => {});
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      spyOn(captureEvents, "emit").mockImplementation((_id, event) => {
        if (event.capture.status === "complete") {
          throw notificationError;
        }
        return false;
      });

      await expect(
        processCapture({
          userId: testUserId,
          captureId,
          input: { ...input, id: captureId },
          db,
        }),
      ).resolves.toBeUndefined();
      expect(logError).toHaveBeenCalledWith(
        "Failed to publish capture update",
        {
          captureId,
          status: "complete",
          error: notificationError,
        },
      );
      expect(
        await db
          .select()
          .from(capturesTable)
          .where(eq(capturesTable.id, captureId)),
      ).toMatchObject([{ status: "complete" }]);
      expect(
        await db
          .select()
          .from(expensesTable)
          .where(eq(expensesTable.captureId, captureId)),
      ).toMatchObject([{ captureId }]);
    });

    test("rolls back expenses when recording completion fails", async () => {
      const captureId = await createCapture();
      spyOn(extraction, "extractExpenses").mockResolvedValue(extracted);
      const emit = spyOn(captureEvents, "emit");
      // Inject a real PostgreSQL write failure after the expense insert.
      await db.execute(
        sql`ALTER TABLE captures ADD CONSTRAINT reject_completion
        CHECK (id <> ${captureId}::uuid OR status <> 'complete')`.inlineParams(),
      );
      try {
        await processCapture({
          userId: testUserId,
          captureId,
          input: { ...input, id: captureId },
          db,
        });
        const [capture] = await db
          .select()
          .from(capturesTable)
          .where(eq(capturesTable.id, captureId));
        expect(capture).toMatchObject({
          status: "failed",
          errorMessage: expect.any(String),
        });
        expect(
          await db
            .select()
            .from(expensesTable)
            .where(eq(expensesTable.captureId, captureId)),
        ).toEqual([]);
        expect(emit).not.toHaveBeenCalledWith(
          captureId,
          expect.objectContaining({
            capture: expect.objectContaining({ status: "complete" }),
          }),
        );
        expect(emit).toHaveBeenCalledWith(
          captureId,
          expect.objectContaining({
            capture: expect.objectContaining({ status: "failed" }),
          }),
        );
      } finally {
        await db.execute(
          sql`ALTER TABLE captures DROP CONSTRAINT reject_completion`,
        );
      }
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
