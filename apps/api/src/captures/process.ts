import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { capturesTable, expenseSchema, expensesTable } from "../db/schema";
import { extractExpenses } from "../expenses/extract";
import type { ExpenseInput } from "../expenses/input";
import type {
  ExpenseExtractionResult,
  ExpenseModelOutput,
  NotRecognizedResult,
} from "../expenses/schema";
import { type CaptureEvent, captureEvents } from "./events";

async function updateCapture(
  captureId: string,
  update: CaptureEvent,
  db: Pick<Database, "update">,
) {
  await db
    .update(capturesTable)
    .set(update.capture)
    .where(eq(capturesTable.id, captureId));
}

function emitCaptureUpdate(captureId: string, update: CaptureEvent) {
  try {
    captureEvents.emit(captureId, update);
  } catch (error) {
    console.error("Failed to publish capture update", {
      captureId,
      status: update.capture.status,
      error,
    });
  }
}

async function publishCaptureUpdate(
  captureId: string,
  update: CaptureEvent,
  db: Database,
) {
  await updateCapture(captureId, update, db);

  emitCaptureUpdate(captureId, update);
}

export async function processCapture({
  captureId,
  userId,
  input,
  db,
}: {
  captureId: string;
  userId: string;
  input: ExpenseInput;
  db: Database;
}) {
  const notRecognized = (
    result: ExpenseExtractionResult,
  ): result is NotRecognizedResult => "kind" in result;

  const noData = (output: ExpenseModelOutput) =>
    output.expenses.length === 0 && output.failures.length === 0;

  const reason = (result: ExpenseExtractionResult) =>
    notRecognized(result) ? result.reason : "No expenses could be recognized.";

  try {
    const extraction = await extractExpenses(input);

    if (notRecognized(extraction) || noData(extraction)) {
      const update = {
        capture: { status: "failed", errorMessage: reason(extraction) },
      } satisfies CaptureEvent;

      await publishCaptureUpdate(captureId, update, db);
      return;
    }

    const update = { capture: { status: "saving" } } satisfies CaptureEvent;
    await publishCaptureUpdate(captureId, update, db);

    const expenseInserts = extraction.expenses.map((expense) => ({
      ...expense,
      userId,
      collectionId: input.collectionId,
      captureId,
    }));

    const completion = await db.transaction(async (tx) => {
      const createdExpenses =
        expenseInserts.length > 0
          ? await tx.insert(expensesTable).values(expenseInserts).returning()
          : [];

      const event = {
        capture: { status: "complete", failures: extraction.failures },
        createdExpenses: createdExpenses.map((e) => expenseSchema.parse(e)),
      } satisfies CaptureEvent;

      await updateCapture(captureId, event, tx);

      return event;
    });

    emitCaptureUpdate(captureId, completion);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Extraction failed";

    await publishCaptureUpdate(
      captureId,
      {
        capture: {
          status: "failed",
          errorMessage,
        },
      },
      db,
    );
  }
}
