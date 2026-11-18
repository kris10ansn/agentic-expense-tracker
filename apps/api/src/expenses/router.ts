import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { requireOwnedReferences } from "../collections/access";
import {
  expenseCreateSchema,
  expenseIdSchema,
  expenseSchema,
  expensesSchema,
  expensesTable,
  expenseUpdateSchema,
} from "../db/schema";
import { protectedProcedure, t } from "../trpc";

export const expensesRouter = t.router({
  list: protectedProcedure.output(expensesSchema).query(({ ctx }) => {
    return ctx.db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.userId, ctx.user.id))
      .orderBy(desc(expensesTable.createdAt));
  }),

  get: protectedProcedure
    .input(expenseIdSchema)
    .output(expenseSchema)
    .query(async ({ ctx, input }) => {
      const [expense] = await ctx.db
        .select()
        .from(expensesTable)
        .where(
          and(
            eq(expensesTable.id, input.id),
            eq(expensesTable.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (expense === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found.",
        });
      }

      return expense;
    }),

  create: protectedProcedure
    .input(expenseCreateSchema)
    .output(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwnedReferences({ db: ctx.db, userId: ctx.user.id, input });
      const [expense] = await ctx.db
        .insert(expensesTable)
        .values({ ...input, userId: ctx.user.id })
        .returning();

      if (expense === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating expense",
        });
      }

      return expense;
    }),

  update: protectedProcedure
    .input(expenseUpdateSchema)
    .output(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOwnedReferences({ db: ctx.db, userId: ctx.user.id, input });
      const { id, ...changes } = input;
      const [expense] = await ctx.db
        .update(expensesTable)
        .set({
          ...changes,
          updatedAt: new Date(),
        })
        .where(
          and(eq(expensesTable.id, id), eq(expensesTable.userId, ctx.user.id)),
        )
        .returning();

      if (expense === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found.",
        });
      }

      return expense;
    }),

  delete: protectedProcedure
    .input(expenseIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [expense] = await ctx.db
        .delete(expensesTable)
        .where(
          and(
            eq(expensesTable.id, input.id),
            eq(expensesTable.userId, ctx.user.id),
          ),
        )
        .returning({ id: expensesTable.id });

      if (expense === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found.",
        });
      }

      return expense;
    }),
});
