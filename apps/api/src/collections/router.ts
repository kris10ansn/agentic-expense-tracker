import { TRPCError } from "@trpc/server";
import { SQL } from "bun";
import { DrizzleQueryError, eq } from "drizzle-orm";
import {
  collectionCreateSchema,
  collectionIdSchema,
  collectionSchema,
  collectionsSchema,
  collectionUpdateSchema,
  expenseCollectionTable,
} from "../db/schema";
import { publicProcedure, t } from "../trpc";

export const collectionsRouter = t.router({
  list: publicProcedure.output(collectionsSchema).query(({ ctx }) => {
    return ctx.db.select().from(expenseCollectionTable);
  }),

  get: publicProcedure
    .input(collectionIdSchema)
    .output(collectionSchema)
    .query(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .select()
        .from(expenseCollectionTable)
        .where(eq(expenseCollectionTable.id, input.id))
        .limit(1);

      if (collection === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found.",
        });
      }

      return collection;
    }),

  create: publicProcedure
    .input(collectionCreateSchema)
    .output(collectionSchema)
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .insert(expenseCollectionTable)
        .values(input)
        .returning();

      if (collection === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating collection.",
        });
      }

      return collection;
    }),

  update: publicProcedure
    .input(collectionUpdateSchema)
    .output(collectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      const [collection] = await ctx.db
        .update(expenseCollectionTable)
        .set(changes)
        .where(eq(expenseCollectionTable.id, id))
        .returning();

      if (collection === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found.",
        });
      }

      return collection;
    }),

  delete: publicProcedure
    .input(collectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [collection] = await ctx.db
          .delete(expenseCollectionTable)
          .where(eq(expenseCollectionTable.id, input.id))
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
