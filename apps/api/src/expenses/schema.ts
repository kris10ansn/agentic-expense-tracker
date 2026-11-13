import { z } from "zod";
import { expenseCreateSchema } from "../db/schema";

const suggestionSchema = z.object({
  field: expenseCreateSchema.keyof(),
  candidates: z.array(z.string()),
});

export const expenseExtractionsSchema = z.object({
  expenses: z.array(expenseCreateSchema),

  failures: z.array(
    z.object({
      partialExpense: expenseCreateSchema.partial(),
      sourceText: z.string(),
      reason: z.string(),
      suggestions: z.array(suggestionSchema),
    }),
  ),
});

const modelExpenseSchema = expenseCreateSchema.extend({
  purchasedAt: z.iso
    .datetime({ offset: true })
    .describe("Exact ISO 8601 timestamp with timezone. Omit when unknown.")
    .transform((value) => new Date(value))
    .optional(),
});

// Gemini emits JSON strings; parse dates once before returning application data.
export const expenseModelOutputSchema = expenseExtractionsSchema.extend({
  expenses: z.array(modelExpenseSchema),
  failures: z.array(
    expenseExtractionsSchema.shape.failures.element.extend({
      partialExpense: modelExpenseSchema.partial(),
    }),
  ),
});
