import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { Database } from "../db";
import { expenseCollectionTable } from "../db/schema";

export async function requireOwnedCollection({
  db,
  userId,
  collectionId,
}: {
  db: Database;
  userId: string;
  collectionId: string;
}) {
  const [collection] = await db
    .select({ id: expenseCollectionTable.id })
    .from(expenseCollectionTable)
    .where(
      and(
        eq(expenseCollectionTable.id, collectionId),
        eq(expenseCollectionTable.userId, userId),
      ),
    );
  if (!collection) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Collection not found.",
    });
  }
}
