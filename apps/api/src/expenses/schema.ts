import { z } from "zod";
import { expenseCreateSchema } from "../db/schema";

const extractedExpenseSchema = expenseCreateSchema.omit({ captureId: true });

const suggestionSchema = z.object({
  field: extractedExpenseSchema.keyof(),
  candidates: z.array(z.string()),
});

export const expenseExtractionsSchema = z.object({
  expenses: z.array(extractedExpenseSchema),

  failures: z.array(
    z.object({
      partialExpense: extractedExpenseSchema.partial(),
      sourceText: z.string(),
      reason: z.string(),
      suggestions: z.array(suggestionSchema),
    }),
  ),
});

const modelExpenseSchema = extractedExpenseSchema.extend({
  purchasedAt: z.iso
    .datetime({ offset: true })
    .describe("Exact ISO 8601 timestamp with timezone. Omit when unknown.")
    .transform((value) => new Date(value))
    .optional(),
});

export const modelFailuresSchema = z.array(
  expenseExtractionsSchema.shape.failures.element.extend({
    partialExpense: modelExpenseSchema.partial(),
  }),
);

export const expenseModelOutputSchema = expenseExtractionsSchema.extend({
  expenses: z.array(modelExpenseSchema),
  failures: modelFailuresSchema,
});

const notRecognizedSchema = z.strictObject({
  kind: z.literal("not_recognized"),
  reason: z.string().trim().min(1),
});

export const expenseExtractionResultSchema = z.union([
  expenseExtractionsSchema.strict(),
  notRecognizedSchema,
]);

export const expenseModelResultSchema = z.union([
  expenseModelOutputSchema.strict(),
  notRecognizedSchema,
]);
