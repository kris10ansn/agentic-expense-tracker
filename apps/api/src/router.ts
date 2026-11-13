import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { collectionsRouter } from "./collections/router";
import { expensesRouter } from "./expenses/router";
import { publicProcedure, t } from "./trpc";

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
  expenses: expensesRouter,
  collections: collectionsRouter,
});

export type AppRouter = typeof appRouter;
