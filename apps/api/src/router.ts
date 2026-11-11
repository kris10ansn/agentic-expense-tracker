import { initTRPC, TRPCError, type inferRouterOutputs } from "@trpc/server";
import { sql } from "drizzle-orm";
import type { Database } from "./db";

const t = initTRPC.context<{ db: Database }>().create();

export const appRouter = t.router({
  status: t.procedure.query(async ({ ctx }) => {
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
});

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
