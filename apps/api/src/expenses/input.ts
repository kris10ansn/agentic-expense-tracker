import { z } from "zod";

const expenseInputSchema = z
  .object({
    collectionId: z.uuid(),
    description: z.string().trim(),
    files: z
      .array(
        z
          .file()
          .min(1)
          .max(5 * 1024 * 1024)
          .mime(["image/jpeg", "image/png", "image/webp"]),
      )
      .max(5),
  })
  .refine(
    ({ description, files }) => description.length > 0 || files.length > 0,
    { message: "Provide text or an image." },
  );

export const expenseFormSchema = z
  .instanceof(FormData)
  .transform((form) => ({
    description: form.get("description") ?? "",
    files: form.getAll("files"),
    collectionId: form.get("collectionId"),
  }))
  .pipe(expenseInputSchema);

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
