import { z } from "zod";

const expenseSchema = z.object({
  title: z.string().trim().min(1).max(100),

  amount: z.number().min(0).max(Number.MAX_SAFE_INTEGER),

  currency: z.enum(["NOK", "EUR", "USD"]).nullable(),

  category: z
    .enum(["groceries", "dining", "transport", "housing", "shopping", "other"])
    .nullable(),

  purchasedAt: z
    .string()
    .nullable()
    .describe("Exact ISO 8601 timestamp with timezone, or null"),

  purchasedOn: z.string().nullable().describe("Date-only YYYY-MM-DD, or null"),

  merchant: z.string().nullable(),
});

const suggestionSchema = z.object({
  field: expenseSchema.keyof(),
  candidates: z.array(z.string()),
});

export const expenseExtractionSchema = z.object({
  expenses: z.array(expenseSchema),

  failures: z.array(
    z.object({
      partialExpense: expenseSchema.partial(),
      sourceText: z.string(),
      reason: z.string(),
      suggestions: z.array(suggestionSchema),
    }),
  ),
});
