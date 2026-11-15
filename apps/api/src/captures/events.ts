import { EventEmitter, on } from "node:events";
import z from "zod";
import {
  type Capture,
  captureSchema,
  captureUpdateSchema,
  expenseSchema,
} from "../db/schema";

const captureEventSchema = z.union([
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["extracting", "saving"]),
    }),
  }),
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["complete"]),
      failures: captureSchema.shape.failures.nonoptional(),
    }),
    createdExpenses: z.array(expenseSchema),
  }),
  z.object({
    capture: captureUpdateSchema.safeExtend({
      status: captureSchema.shape.status.extract(["failed"]),
    }),
    errorMessage: z.string(),
  }),
]);

export type CaptureEvent = z.infer<typeof captureEventSchema>;

const rawCaptureEvents = new EventEmitter<
  Record<string, [event: CaptureEvent]>
>();

export const captureEvents = {
  emit(captureId: string, event: CaptureEvent): boolean {
    return rawCaptureEvents.emit(captureId, event);
  },

  events(
    captureId: string,
    options: { signal?: AbortSignal | undefined } = {},
  ) {
    // Node erases the emitter's event type when creating an async iterator.
    return on(rawCaptureEvents, captureId, options) as AsyncIterableIterator<
      [event: CaptureEvent]
    >;
  },
};

export function initialCaptureEvent(capture: Capture): CaptureEvent {
  const status = capture.status;

  switch (status) {
    case "extracting":
    case "saving":
      return { capture: { ...capture, status } };
    case "complete":
      return { capture: { ...capture, status }, createdExpenses: [] };
    case "failed":
      return {
        capture: { ...capture, status },
        errorMessage: "Extraction failed",
      };
  }
}
