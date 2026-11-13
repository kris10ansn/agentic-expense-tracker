import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Database } from "./db";

export const t = initTRPC.context<{ db: Database }>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
