import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  expenseCreateSchema,
  expenseIdSchema,
  expenseSchema,
  expensesSchema,
  expensesTable,
  expenseUpdateSchema,
} from "../db/schema";
import { publicProcedure, t } from "../trpc";

export const expensesRouter = t.router({
  list: publicProcedure.output(expensesSchema).query(({ ctx }) => {
    return ctx.db.select().from(expensesTable);
  }),

  get: publicProcedure
    .input(expenseIdSchema)
    .output(expenseSchema)
    .query(async ({ ctx, input }) => {
      const [expense] = await ctx.db
        .select()
        .from(expensesTable)
        .where(eq(expensesTable.id, input.id))
        .limit(1);

      if (expense === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found.",
        });
      }

      return expense;
    }),

  create: publicProcedure
    .input(expenseCreateSchema)
    .output(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      const [expense] = await ctx.db
        .insert(expensesTable)
        .values(input)
        .returning();

      if (expense === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating expense",
        });
      }

      return expense;
    }),

  update: publicProcedure
    .input(expenseUpdateSchema)
    .output(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      const [expense] = await ctx.db
        .update(expensesTable)
        .set({
          ...changes,
          updatedAt: new Date(),
        })
        .where(eq(expensesTable.id, id))
        .returning();

      if (expense === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found.",
        });
      }

      return expense;
    }),

  delete: publicProcedure
    .input(expenseIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [expense] = await ctx.db
        .delete(expensesTable)
        .where(eq(expensesTable.id, input.id))
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
