import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { Database } from "../db";
import {
  capturesTable,
  expenseCollectionTable,
  type expensesTable,
} from "../db/schema";

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

export async function requireOwnedCapture({
  db,
  userId,
  captureId,
}: {
  db: Database;
  userId: string;
  captureId: string;
}) {
  const [capture] = await db
    .select({ id: capturesTable.id })
    .from(capturesTable)
    .where(
      and(eq(capturesTable.id, captureId), eq(capturesTable.userId, userId)),
    );
  if (!capture) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Capture not found." });
  }
}

export async function requireOwnedReferences({
  db,
  userId,
  input,
}: {
  db: Database;
  userId: string;
  input: Pick<typeof expensesTable.$inferInsert, "collectionId" | "captureId">;
}) {
  if (input.collectionId) {
    await requireOwnedCollection({
      db,
      userId,
      collectionId: input.collectionId,
    });
  }
  if (input.captureId) {
    await requireOwnedCapture({
      db,
      userId,
      captureId: input.captureId,
    });
  }
}
