import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { capturesTable, expensesTable } from "../db/schema";
import { extractExpenses } from "../expenses/extract";
import type { ExpenseInput } from "../expenses/input";
import { type CaptureEvent, captureEvents } from "./events";

async function publishCaptureUpdate(
  captureId: string,
  update: CaptureEvent,
  db: Database,
) {
  await db
    .update(capturesTable)
    .set(update.capture)
    .where(eq(capturesTable.id, captureId));

  captureEvents.emit(captureId, update);
}

export async function processCapture({
  captureId,
  input,
  db,
}: {
  captureId: string;
  input: ExpenseInput;
  db: Database;
}) {
  try {
    const extraction = await extractExpenses(input);
    await publishCaptureUpdate(
      captureId,
      { capture: { status: "saving" } },
      db,
    );

    const inserts = extraction.expenses.map((expense) => ({
      ...expense,
      collectionId: input.collectionId,
      captureId,
    }));

    const createdExpenses =
      inserts.length > 0
        ? await db.insert(expensesTable).values(inserts).returning()
        : [];

    await publishCaptureUpdate(
      captureId,
      {
        capture: {
          status: "complete",
          failures: extraction.failures,
        },
        createdExpenses,
      },
      db,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Extraction failed";

    await publishCaptureUpdate(
      captureId,
      {
        capture: {
          status: "failed",
        },
        errorMessage,
      },
      db,
    );
  }
}
