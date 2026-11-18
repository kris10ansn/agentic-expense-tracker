import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Database } from "./db";

export const t = initTRPC
  .context<{
    db: Database;
    authenticate: () => Promise<{ id: string } | null>;
  }>()
  .create({
    transformer: superjson,
  });

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = await ctx.authenticate();
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in." });
  }
  return next({ ctx: { user } });
});
