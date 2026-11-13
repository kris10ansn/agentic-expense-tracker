import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  setSystemTime,
  spyOn,
  test,
} from "bun:test";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { createDatabase } from "./db";
import { expensesTable } from "./db/schema";
import { appRouter } from "./router";

const db = createDatabase("postgresql://test:test@localhost:1/expenses");
const caller = appRouter.createCaller({ db });
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
} satisfies Awaited<ReturnType<typeof caller.expenses.addAgentic>>;

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

afterAll(async () => {
  await db.$client.close();
});

describe("expenses.addAgentic", () => {
  test.each([
    ["text", () => expenseForm("Coffee 45 kr")],
    [
      "images",
      () => {
        const form = new FormData();
        form.append("files", image);
        return form;
      },
    ],
    ["text and images", () => expenseForm("Coffee 45 kr", [image])],
  ])("accepts %s", async (_, createForm) => {
    expect(await caller.expenses.addAgentic(createForm())).toEqual(extraction);
  });

  test("preserves the multipart endpoint and sends context and image bytes to Gemini", async () => {
    const googleFetch = spyOn(globalThis, "fetch");
    const instructions = await Bun.file(
      new URL("./expenses/PROMPT.md", import.meta.url),
    ).text();
    const currentTime = "2026-11-12T12:00:00.000Z";
    setSystemTime(new Date(currentTime));
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: new Request("http://localhost/trpc/expenses.addAgentic", {
        method: "POST",
        body: expenseForm("  Coffee 45 kr  ", [image]),
      }),
      router: appRouter,
      createContext: () => ({ db }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: { data: superjson.serialize(extraction) },
    });
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
    spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(googleResponse(datedExtraction))
      .mockResolvedValueOnce(googleResponse(datedExtraction));
    const result = await caller.expenses.addAgentic(
      expenseForm("Coffee and lunch"),
    );
    expect(result.expenses[0]?.purchasedAt).toEqual(new Date(purchasedAt));
    expect(result.failures[0]?.partialExpense.purchasedAt).toEqual(
      new Date(purchasedAt),
    );

    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: new Request("http://localhost/trpc/expenses.addAgentic", {
        method: "POST",
        body: expenseForm("Coffee and lunch", [image]),
      }),
      router: appRouter,
      createContext: () => ({ db }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: { data: superjson.serialize(result) },
    });
  });

  test.each([
    ["empty form", () => new FormData()],
    ["whitespace", () => expenseForm(" \n ")],
    [
      "empty file",
      () =>
        expenseForm("Coffee", [
          new File([], "empty.png", { type: "image/png" }),
        ]),
    ],
    [
      "unsupported file type",
      () =>
        expenseForm("Coffee", [
          new File(["text"], "receipt.txt", { type: "text/plain" }),
        ]),
    ],
    [
      "file over 5 MiB",
      () =>
        expenseForm("Coffee", [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "receipt.png", {
            type: "image/png",
          }),
        ]),
    ],
    [
      "more than five files",
      () =>
        expenseForm(
          "Coffee",
          Array.from({ length: 6 }, () => image),
        ),
    ],
    [
      "text in the files field",
      () => {
        const form = expenseForm("Coffee");
        form.append("files", "receipt.png");
        return form;
      },
    ],
    [
      "file in the description field",
      () => {
        const form = new FormData();
        form.set("description", image);
        return form;
      },
    ],
  ])("rejects %s before calling Gemini", async (_, createForm) => {
    await expect(
      caller.expenses.addAgentic(createForm()),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("rejects model output that does not match the expense schema", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      googleResponse({ expenses: [{ title: "Coffee" }], failures: [] }),
    );
    await expect(
      caller.expenses.addAgentic(expenseForm("Coffee")),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

test("status reports database failures as service unavailable", async () => {
  spyOn(db, "execute").mockRejectedValue(new Error("Database offline"));
  await expect(caller.status()).rejects.toMatchObject({
    code: "SERVICE_UNAVAILABLE",
    message: "The database is unavailable.",
  });
});

test("updating a missing expense returns NOT_FOUND over HTTP", async () => {
  const builder = db.update(expensesTable);
  const statement = builder.set({ title: "Tea" });
  spyOn(statement.returning(), "execute").mockResolvedValue([]);
  spyOn(builder, "set").mockReturnValue(statement);
  spyOn(db, "update").mockReturnValue(builder);

  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req: new Request("http://localhost/trpc/expenses.update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: superjson.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        title: "Tea",
      }),
    }),
    router: appRouter,
    createContext: () => ({ db }),
  });
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({
    error: {
      json: { message: "Expense not found.", data: { code: "NOT_FOUND" } },
    },
  });
});

test("update database failures remain server errors", async () => {
  const builder = db.update(expensesTable);
  const statement = builder.set({ title: "Tea" });
  spyOn(statement.returning(), "execute").mockRejectedValue(
    new Error("Database offline"),
  );
  spyOn(builder, "set").mockReturnValue(statement);
  spyOn(db, "update").mockReturnValue(builder);
  await expect(
    caller.expenses.update({
      id: "00000000-0000-4000-8000-000000000001",
      title: "Tea",
    }),
  ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
});
