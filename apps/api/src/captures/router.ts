import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";
import type { Database } from "../db";
import { type Capture, capturesTable } from "../db/schema";
import { expenseFormSchema } from "../expenses/input";
import { publicProcedure, t } from "../trpc";
import {
  type CaptureEvent,
  captureEvents,
  initialCaptureEvent,
} from "./events";
import { processCapture } from "./process";

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
          id: input.id,
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

      void processCapture({ captureId: capture.id, input, db: ctx.db }).catch(
        (error: unknown) => {
          console.error("Failed to persist capture outcome", {
            captureId: capture.id,
            error,
          });
        },
      );

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
      yield initialCaptureEvent(initialCapture);

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
