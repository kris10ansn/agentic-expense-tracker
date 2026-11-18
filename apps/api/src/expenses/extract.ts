import { google } from "@ai-sdk/google";
import { type FilePart, generateText, Output } from "ai";
import type z from "zod";
import type { ExpenseInput } from "./input";
import instructions from "./PROMPT.md" with { type: "text" };
import {
  type expenseExtractionResultSchema,
  expenseModelResultSchema,
} from "./schema";

export async function extractExpenses({
  description,
  files,
}: ExpenseInput): Promise<z.infer<typeof expenseExtractionResultSchema>> {
  const attachments = await Promise.all(
    files.map(
      async (image): Promise<FilePart> => ({
        type: "file",
        data: await image.arrayBuffer(),
        mediaType: image.type,
      }),
    ),
  );

  const { output } = await generateText({
    model: google("gemini-3.5-flash-lite"),
    output: Output.object({ schema: expenseModelResultSchema }),
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
          ...attachments,
        ],
      },
    ],
  });

  return output;
}
