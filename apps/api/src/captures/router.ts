import { EventEmitter, on } from "node:events";
import z from "zod";
import type { Database } from "../db";
import { expenseSchema, expensesTable } from "../db/schema";
import { extractExpenses } from "../expenses/extract";
import { expenseFormSchema } from "../expenses/input";
import { modelFailuresSchema } from "../expenses/schema";
import { publicProcedure, t } from "../trpc";

const captures = new Map<string, CaptureUpdate>();
const captureEvents = new EventEmitter();

function publishCaptureUpdate(captureId: string, update: CaptureUpdate) {
  captures.set(captureId, update);
  captureEvents.emit(captureId);
}

async function processCapture(
  captureId: string,
  input: z.infer<typeof expenseFormSchema>,
  db: Database,
) {
  try {
    const extract = await extractExpenses(input);
    publishCaptureUpdate(captureId, { status: "saving" });

    const inserts = extract.expenses.map((e) => ({
      ...e,
      collectionId: input.collectionId,
    }));

    const createdExpenses =
      inserts.length > 0
        ? await db.insert(expensesTable).values(inserts).returning()
        : [];

    publishCaptureUpdate(captureId, {
      status: "complete",
      createdExpenses,
      failures: extract.failures,
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Extraction failed";
    publishCaptureUpdate(captureId, { status: "failed", error });
  }
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
  start: publicProcedure
    .input(expenseFormSchema)
    .output(z.object({ captureId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const captureId = crypto.randomUUID();

      publishCaptureUpdate(captureId, { status: "extracting" });
      void processCapture(captureId, input, ctx.db);

      return { captureId };
    }),

  watch: publicProcedure.input(z.uuid()).subscription(async function* ({
    input: captureId,
    signal,
  }) {
    const changes = on(captureEvents, captureId, { signal });

    const isComplete = (update: CaptureUpdate | undefined) =>
      update?.status === "complete" || update?.status === "failed";

    try {
      const initialUpdate = captures.get(captureId);
      yield initialUpdate;
      if (isComplete(initialUpdate)) return;

      for await (const _ of changes) {
        const update = captures.get(captureId);
        yield update;

        if (isComplete(update)) return;
      }
    } finally {
      await changes.return?.();
    }
  }),
});
