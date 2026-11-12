import { initTRPC, TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import type { Database } from "./db";
import { extractExpenses } from "./expenses/extract";
import { expenseFormSchema } from "./expenses/input";

const t = initTRPC.context<{ db: Database }>().create();

const publicProcedure = t.procedure;

export const appRouter = t.router({
  status: publicProcedure.query(async ({ ctx }) => {
    try {
      await ctx.db.execute(sql`SELECT 1`);
    } catch (cause) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "The database is unavailable.",
        cause,
      });
    }

    return { api: "ok", database: "connected" };
  }),
  addExpenses: publicProcedure
    .input(expenseFormSchema)
    .mutation(({ input }) => extractExpenses(input)),
});

export type AppRouter = typeof appRouter;
