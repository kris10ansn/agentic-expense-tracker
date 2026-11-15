import { EventEmitter, on } from "node:events";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";
import type { Database } from "../db";
import {
  type Capture,
  captureSchema,
  capturesTable,
  captureUpdateSchema,
  expenseSchema,
  expensesTable,
} from "../db/schema";
import { extractExpenses } from "../expenses/extract";
import { expenseFormSchema } from "../expenses/input";
import { publicProcedure, t } from "../trpc";

const captureEventSchema = z.union([
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["extracting", "saving"]),
    }),
  }),
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["complete"]),
      failures: captureSchema.shape.failures.nonoptional(),
    }),
    createdExpenses: z.array(expenseSchema),
  }),
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["failed"]),
    }),
    errorMessage: z.string(),
  }),
]);

type CaptureEvent = z.infer<typeof captureEventSchema>;

const rawCaptureEvents = new EventEmitter<{
  update: [captureId: string, event: CaptureEvent];
}>();

export const captureEvents = {
  emit(captureId: string, event: CaptureEvent): boolean {
    return rawCaptureEvents.emit(captureId, event);
  },

  events(
    captureId: string,
    options: { signal?: AbortSignal | undefined } = {},
  ) {
    return on(rawCaptureEvents, captureId, options) as AsyncIterableIterator<
      [event: CaptureEvent]
    >;
  },
};

async function publishCaptureUpdate(
  captureId: string,
  update: CaptureEvent,
  db: Database,
) {
  await db
    .update(capturesTable)
    .set(update.capture)
    .where(eq(capturesTable.id, captureId));

  captureEvents.emit(captureId, update);
}

async function startCapture(
  captureId: string,
  input: z.infer<typeof expenseFormSchema>,
  db: Database,
) {
  try {
    const extract = await extractExpenses(input);
    publishCaptureUpdate(captureId, { capture: { status: "saving" } }, db);

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
        capture: {
          status: "complete",
          failures: extract.failures,
        },
        createdExpenses,
      },
      db,
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Extraction failed";

    publishCaptureUpdate(
      captureId,
      {
        capture: {
          status: "failed",
        },
        errorMessage,
      },
      db,
    );
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

export const capturesRouter = t.router({
  listActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(capturesTable)
      .where(inArray(capturesTable.status, ["extracting", "saving"]));
  }),

  start: publicProcedure
    .input(expenseFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [capture] = await ctx.db
        .insert(capturesTable)
        .values({
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

      publishCaptureUpdate(
        capture.id,
        { capture: { status: "extracting" } },
        ctx.db,
      );
      void startCapture(capture.id, input, ctx.db);

      return capture;
    }),

  watch: publicProcedure.input(z.uuid()).subscription(async function* ({
    input: captureId,
    signal,
    ctx,
  }): AsyncGenerator<CaptureEvent, void, unknown> {
    const events = captureEvents.events(captureId, { signal });

    const isDone = (status: Capture["status"]) =>
      status === "complete" || status === "failed";

    try {
      const initialCapture = await getCapture(captureId, ctx.db);
      yield {
        capture: initialCapture,
        errorMessage: "Extraction failed",
        createdExpenses: [],
      } as CaptureEvent;

      if (isDone(initialCapture.status)) return;

      for await (const [event] of events) {
        yield event;

        if (isDone(event.capture.status)) return;
      }
    } finally {
      await events.return?.();
    }
  }),
});
