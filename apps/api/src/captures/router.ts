import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import z from "zod";
import { requireOwnedCollection } from "../collections/access";
import type { Database } from "../db";
import { type Capture, captureSchema, capturesTable } from "../db/schema";
import { expenseFormSchema } from "../expenses/input";
import { protectedProcedure, t } from "../trpc";
import {
  type CaptureEvent,
  captureEvents,
  initialCaptureEvent,
} from "./events";
import { processCapture } from "./process";

async function getCapture(
  id: Capture["id"],
  db: Database,
  userId: string,
): Promise<Capture> {
  const [capture] = await db
    .select()
    .from(capturesTable)
    .where(and(eq(capturesTable.id, id), eq(capturesTable.userId, userId)))
    .limit(1);

  if (capture === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Capture with id [${id}] not found!`,
    });
  }

  return capture;
}

const needsAttention = or(
  eq(capturesTable.status, "failed"),
  and(
    eq(capturesTable.status, "complete"),
    // Bun SQL can encode the array as a JSON string. Decode either storage form.
    sql`jsonb_array_length((${capturesTable.failures} #>> '{}')::jsonb) > 0`,
  ),
);

export const capturesRouter = t.router({
  listVisible: protectedProcedure
    .output(z.array(captureSchema))
    .query(async ({ ctx }) => {
      return ctx.db
        .select()
        .from(capturesTable)
        .where(
          and(
            eq(capturesTable.userId, ctx.user.id),
            isNull(capturesTable.dismissedAt),
            or(
              inArray(capturesTable.status, ["extracting", "saving"]),
              needsAttention,
            ),
          ),
        );
    }),

  dismiss: protectedProcedure
    .input(z.uuid())
    .mutation(async ({ ctx, input }) => {
      const [dismissed] = await ctx.db
        .update(capturesTable)
        .set({
          dismissedAt: sql`coalesce(${capturesTable.dismissedAt}, now())`,
        })
        .where(
          and(
            eq(capturesTable.id, input),
            eq(capturesTable.userId, ctx.user.id),
            needsAttention,
          ),
        )
        .returning({ id: capturesTable.id });

      if (dismissed === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No dismissible capture found.",
        });
      }

      return dismissed;
    }),

  start: protectedProcedure
    .input(expenseFormSchema)
    .output(captureSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwnedCollection({
        db: ctx.db,
        userId: ctx.user.id,
        collectionId: input.collectionId,
      });
      const [capture] = await ctx.db
        .insert(capturesTable)
        .values({
          id: input.id,
          userId: ctx.user.id,
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

      void processCapture({
        captureId: capture.id,
        userId: ctx.user.id,
        input,
        db: ctx.db,
      }).catch((error: unknown) => {
        console.error("Failed to persist capture outcome", {
          captureId: capture.id,
          error,
        });
      });

      return capture;
    }),

  watch: protectedProcedure.input(z.uuid()).subscription(async function* ({
    input: captureId,
    signal,
    ctx,
  }): AsyncGenerator<CaptureEvent, void, unknown> {
    const events = captureEvents.events(captureId, { signal });

    const isDone = (status: Capture["status"]) =>
      status === "complete" || status === "failed";

    try {
      const initialCapture = await getCapture(captureId, ctx.db, ctx.user.id);
      yield initialCaptureEvent(captureSchema.parse(initialCapture));

      if (isDone(initialCapture.status)) return;

      for await (const [event] of events) {
        if (!(await ctx.authenticate())) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Please sign in.",
          });
        }
        yield event;

        if (isDone(event.capture.status)) return;
      }
    } finally {
      await events.return?.();
    }
  }),
});
