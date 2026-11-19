import { google } from "@ai-sdk/google";
import { type FilePart, generateText, Output, type TextPart } from "ai";
import type { ExpenseInput } from "./input";
import instructions from "./PROMPT.md" with { type: "text" };
import {
  type ExpenseExtractionResult,
  expenseModelResultSchema,
} from "./schema";

export async function extractExpenses({
  description,
  files,
}: ExpenseInput): Promise<ExpenseExtractionResult> {
  const images = files.map((file, index) => ({
    id: `image-${index + 1}`,
    file,
  }));
  const sourceImageIds = new Set(images.map((image) => image.id));
  const attachments = await Promise.all(
    images.map(
      async ({ id, file }): Promise<(TextPart | FilePart)[]> => [
        { type: "text", text: JSON.stringify({ sourceImageId: id }) },
        {
          type: "file",
          data: await file.arrayBuffer(),
          mediaType: file.type,
        },
      ],
    ),
  );

  const { output } = await generateText({
    model: google("gemini-3.5-flash-lite"),
    output: Output.object({
      schema: expenseModelResultSchema.refine(
        (result) =>
          "kind" in result ||
          result.failures.every((failure) =>
            failure.sourceImageIds.every((id) => sourceImageIds.has(id)),
          ),
        { message: "Extraction referenced an unknown source image." },
      ),
    }),
    instructions,
    prompt: [
      {
        role: "user",

        content: [
          {
            type: "text",
            text: JSON.stringify({
              currentTime: new Date().toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              defaultCurrency: "NOK",
              input: description,
            }),
          },
          ...attachments.flat(),
        ],
      },
    ],
  });

  return output;
}
