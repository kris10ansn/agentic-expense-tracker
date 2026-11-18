import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { NoObjectGeneratedError } from "ai";
import { extractExpenses } from "./extract";
import { expenseFormSchema } from "./input";

const originalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const extraction = {
  expenses: [
    {
      title: "Coffee",
      amountInCents: 4500,
      currency: "NOK",
      category: "dining",
      description: "Coffee",
      merchant: null,
    },
  ],
  failures: [],
} satisfies Awaited<ReturnType<typeof extractExpenses>>;

function googleResponse(output: unknown) {
  return Response.json({
    candidates: [
      {
        content: { role: "model", parts: [{ text: JSON.stringify(output) }] },
        finishReason: "STOP",
      },
    ],
  });
}

function expenseForm(description = "", files: File[] = []) {
  const form = new FormData();
  form.set("id", "00000000-0000-4000-8000-000000000001");
  form.set("collectionId", "00000000-0000-4000-8000-000000000002");
  form.set("description", description);
  for (const file of files) {
    form.append("files", file);
  }
  return form;
}

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const image = new File([imageBytes], "receipt.png", { type: "image/png" });

beforeEach(() => {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-api-key";
  spyOn(globalThis, "fetch").mockResolvedValue(googleResponse(extraction));
});

afterEach(() => {
  mock.restore();
  setSystemTime();
  if (originalApiKey === undefined) {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  } else {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalApiKey;
  }
});

describe("extractExpenses", () => {
  test("accepts an explicit not-recognized result with a useful reason", async () => {
    const result = {
      kind: "not_recognized",
      reason: "No purchase details found.",
    } satisfies Awaited<ReturnType<typeof extractExpenses>>;
    spyOn(globalThis, "fetch").mockResolvedValue(googleResponse(result));
    expect(
      await extractExpenses(expenseFormSchema.parse(expenseForm("Hello"))),
    ).toEqual(result);
  });

  test.each([
    { kind: "not_recognized" },
    { kind: "not_recognized", reason: "   " },
    {
      kind: "not_recognized",
      reason: "Nothing found",
      expenses: extraction.expenses,
      failures: [],
    },
  ])("rejects invalid or contradictory rejection output %j", async (result) => {
    spyOn(globalThis, "fetch").mockResolvedValue(googleResponse(result));
    await expect(
      extractExpenses(expenseFormSchema.parse(expenseForm("Hello"))),
    ).rejects.toBeInstanceOf(NoObjectGeneratedError);
  });

  test.each([
    ["text", () => expenseForm("Coffee 45 kr")],
    [
      "images",
      () => {
        const form = expenseForm();
        form.delete("description");
        form.append("files", image);
        return form;
      },
    ],
    ["text and images", () => expenseForm("Coffee 45 kr", [image])],
  ])("accepts %s", async (_, createForm) => {
    expect(
      await extractExpenses(expenseFormSchema.parse(createForm())),
    ).toEqual(extraction);
  });

  test("sends context and image bytes to Gemini", async () => {
    const googleFetch = spyOn(globalThis, "fetch");
    const instructions = await Bun.file(
      new URL("./PROMPT.md", import.meta.url),
    ).text();
    const currentTime = "2026-11-12T12:00:00.000Z";
    setSystemTime(new Date(currentTime));
    expect(
      await extractExpenses(
        expenseFormSchema.parse(expenseForm("  Coffee 45 kr  ", [image])),
      ),
    ).toEqual(extraction);
    expect(googleFetch).toHaveBeenCalledTimes(1);
    const [url, options] = googleFetch.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    );
    if (typeof options?.body !== "string")
      throw new Error("Expected a JSON request body");
    const body: unknown = JSON.parse(options.body);
    expect(body).toMatchObject({
      systemInstruction: {
        parts: [{ text: instructions }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                currentTime,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                defaultCurrency: "NOK",
                input: "Coffee 45 kr",
              }),
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: imageBytes.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: expect.any(Object),
      },
    });
  });

  test("parses model timestamps into Dates for purchases and partial failures", async () => {
    const purchasedAt = "2026-11-13T13:00:00+01:00";
    const datedExtraction = {
      expenses: extraction.expenses.map((expense) => ({
        ...expense,
        purchasedAt,
      })),
      failures: [
        {
          partialExpense: { title: "Lunch", purchasedAt },
          sourceText: "Lunch at 13:00",
          reason: "Amount missing",
          suggestions: [],
        },
      ],
    };
    spyOn(globalThis, "fetch").mockResolvedValue(
      googleResponse(datedExtraction),
    );
    const result = await extractExpenses(
      expenseFormSchema.parse(expenseForm("Coffee and lunch")),
    );
    if (!("expenses" in result)) {
      throw new Error("Expected recognized expenses");
    }
    expect(result.expenses[0]?.purchasedAt).toEqual(new Date(purchasedAt));
    expect(result.failures[0]?.partialExpense.purchasedAt).toEqual(
      new Date(purchasedAt),
    );
  });

  test("rejects model output that does not match the expense schema", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      googleResponse({ expenses: [{ title: "Coffee" }], failures: [] }),
    );
    await expect(
      extractExpenses(expenseFormSchema.parse(expenseForm("Coffee"))),
    ).rejects.toBeInstanceOf(NoObjectGeneratedError);
  });
});
