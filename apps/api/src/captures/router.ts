import { EventEmitter, on } from "node:events";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";
import type { Database } from "../db";
import {
  type Capture,
  capturesTable,
  expenseSchema,
  expensesTable,
} from "../db/schema";
import { extractExpenses } from "../expenses/extract";
import { expenseFormSchema } from "../expenses/input";
import { modelFailuresSchema } from "../expenses/schema";
import { publicProcedure, t } from "../trpc";

const captureEvents = new EventEmitter();

async function publishCaptureUpdate(
  captureId: string,
  update: CaptureUpdate,
  db: Database,
) {
  const active = !(update.status === "complete" || update.status === "failed");

  await db
    .update(capturesTable)
    .set({ status: update.status, active })
    .where(eq(capturesTable.id, captureId));

  captureEvents.emit(captureId);
}

async function processCapture(
  captureId: string,
  input: z.infer<typeof expenseFormSchema>,
  db: Database,
) {
  try {
    const extract = await extractExpenses(input);
    publishCaptureUpdate(captureId, { status: "saving" }, db);

    const inserts = extract.expenses.map((e) => ({
      ...e,
      collectionId: input.collectionId,
      captureId,
    }));

    const createdExpenses =
      inserts.length > 0
        ? await db.insert(expensesTable).values(inserts).returning()
        : [];

    publishCaptureUpdate(
      captureId,
      {
        status: "complete",
        createdExpenses,
        failures: extract.failures,
      },
      db,
    );
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Extraction failed";
    publishCaptureUpdate(captureId, { status: "failed", error }, db);
  }
}

async function getCapture(id: Capture["id"], db: Database): Promise<Capture> {
  const [capture] = await db
    .select()
    .from(capturesTable)
    .where(eq(capturesTable.id, id))
    .limit(1);

  if (capture === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Capture with id [${id}] not found!`,
    });
  }

  return capture;
}

export const captureUpdateStatus = z.enum([
  "extracting",
  "saving",
  "complete",
  "failed",
]);

export type CaptureUpdateStatus = z.infer<typeof captureUpdateStatus>;

const captureUpdateSchema = z.discriminatedUnion("status", [
  z.object({ status: captureUpdateStatus.extract(["extracting", "saving"]) }),
  z.object({
    status: captureUpdateStatus.extract(["complete"]),
    createdExpenses: z.array(expenseSchema),
    failures: modelFailuresSchema,
  }),
  z.object({
    status: captureUpdateStatus.extract(["failed"]),
    error: z.string(),
  }),
]);

type CaptureUpdate = z.infer<typeof captureUpdateSchema>;

export const capturesRouter = t.router({
  listActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(capturesTable)
      .where(eq(capturesTable.active, true));
  }),

  start: publicProcedure
    .input(expenseFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [capture] = await ctx.db
        .insert(capturesTable)
        .values({
          active: true,
          status: "extracting",
          description: input.description,
          fileNames: input.files.map((file) => file.name),
        })
        .returning();

      if (capture === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating capture.",
        });
      }

      publishCaptureUpdate(capture.id, { status: "extracting" }, ctx.db);
      void processCapture(capture.id, input, ctx.db);

      return capture;
    }),

  watch: publicProcedure.input(z.uuid()).subscription(async function* ({
    input: captureId,
    signal,
    ctx,
  }) {
    const changes = on(captureEvents, captureId, { signal });

    const isComplete = (update: Capture) =>
      update.status === "complete" || update.status === "failed";

    try {
      const initialUpdate = await getCapture(captureId, ctx.db);
      yield initialUpdate;
      if (isComplete(initialUpdate)) return;

      for await (const _ of changes) {
        const update = await getCapture(captureId, ctx.db);
        yield update;

        if (isComplete(update)) return;
      }
    } finally {
      await changes.return?.();
    }
  }),
});
