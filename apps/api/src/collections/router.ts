import { TRPCError } from "@trpc/server";
import { SQL } from "bun";
import { and, DrizzleQueryError, eq } from "drizzle-orm";
import {
  collectionCreateSchema,
  collectionIdSchema,
  collectionSchema,
  collectionsSchema,
  collectionUpdateSchema,
  expenseCollectionTable,
} from "../db/schema";
import { protectedProcedure, t } from "../trpc";

export const collectionsRouter = t.router({
  list: protectedProcedure.output(collectionsSchema).query(({ ctx }) => {
    return ctx.db
      .select()
      .from(expenseCollectionTable)
      .where(eq(expenseCollectionTable.userId, ctx.user.id));
  }),

  get: protectedProcedure
    .input(collectionIdSchema)
    .output(collectionSchema)
    .query(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .select()
        .from(expenseCollectionTable)
        .where(
          and(
            eq(expenseCollectionTable.id, input.id),
            eq(expenseCollectionTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (collection === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found.",
        });
      }

      return collection;
    }),

  create: protectedProcedure
    .input(collectionCreateSchema)
    .output(collectionSchema)
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .insert(expenseCollectionTable)
        .values({ ...input, userId: ctx.user.id })
        .returning();

      if (collection === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating collection.",
        });
      }

      return collection;
    }),

  update: protectedProcedure
    .input(collectionUpdateSchema)
    .output(collectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      const [collection] = await ctx.db
        .update(expenseCollectionTable)
        .set(changes)
        .where(
          and(
            eq(expenseCollectionTable.id, id),
            eq(expenseCollectionTable.userId, ctx.user.id),
          ),
        )
        .returning();

      if (collection === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found.",
        });
      }

      return collection;
    }),

  delete: protectedProcedure
    .input(collectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [collection] = await ctx.db
          .delete(expenseCollectionTable)
          .where(
            and(
              eq(expenseCollectionTable.id, input.id),
              eq(expenseCollectionTable.userId, ctx.user.id),
            ),
          )
          .returning({ id: expenseCollectionTable.id });

        if (collection === undefined) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Collection not found.",
          });
        }

        return collection;
      } catch (cause) {
        if (
          cause instanceof DrizzleQueryError &&
          cause.cause instanceof SQL.PostgresError &&
          cause.cause.errno === "23503"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Remove or move the collection's expenses before deleting it.",
            cause,
          });
        }

        throw cause;
      }
    }),
});
