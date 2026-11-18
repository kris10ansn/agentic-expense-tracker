import { afterAll, expect, test } from "bun:test";
import type { inferRouterOutputs } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";
import { authenticatedContext } from "../auth/test-context";
import { expenseModelOutputSchema } from "../expenses/schema";
import { publicProcedure, t } from "../trpc";
import { createDatabase } from "./index";
import {
  expenseCreateSchema,
  expenseSchema,
  expensesSchema,
  expensesTable,
  expenseUpdateSchema,
} from "./schema";

const db = createDatabase("postgresql://test:test@localhost:1/expenses");
afterAll(async () => {
  await db.$client.close();
});

const id = "00000000-0000-4000-8000-000000000001";
const purchase = {
  title: "Coffee",
  amountInCents: 4500,
  currency: "NOK",
  description: "Coffee",
  category: "dining",
} satisfies z.input<typeof expenseCreateSchema>;

test.each([
  ["empty title", { title: "" }],
  ["whitespace title", { title: " \n " }],
  ["long title", { title: "x".repeat(65) }],
  ["fractional cents", { amountInCents: 1.5 }],
  ["negative fractional cents", { amountInCents: -1.5 }],
  ["integer overflow", { amountInCents: 2_147_483_648 }],
  ["integer underflow", { amountInCents: -2_147_483_649 }],
  ["empty currency", { currency: "" }],
  ["invalid currency", { currency: "x" }],
  ["unsupported currency", { currency: "GBP" }],
])("rejects %s in creation, updates, and extraction", (_, fields) => {
  expect(
    expenseCreateSchema.safeParse({ ...purchase, ...fields }).success,
  ).toBe(false);
  expect(expenseUpdateSchema.safeParse({ id, ...fields }).success).toBe(false);
  expect(
    expenseModelOutputSchema.safeParse({
      expenses: [{ ...purchase, ...fields }],
      failures: [],
    }).success,
  ).toBe(false);
  expect(
    expenseModelOutputSchema.safeParse({
      expenses: [],
      failures: [
        {
          partialExpense: fields,
          sourceText: "Purchase",
          reason: "Missing details",
          suggestions: [],
        },
      ],
    }).success,
  ).toBe(false);
});

test.each(["NOK", "EUR", "USD"])(
  "accepts %s, trims titles, and allows zero cents",
  (currency) => {
    const fields = { title: "  Coffee  ", amountInCents: 0, currency };
    const expected = { title: "Coffee", amountInCents: 0, currency };
    expect(expenseCreateSchema.parse({ ...purchase, ...fields })).toEqual({
      ...purchase,
      ...expected,
    });
    expect(expenseUpdateSchema.parse({ id, ...fields })).toEqual({
      id,
      ...expected,
    });
    expect(
      expenseModelOutputSchema.parse({
        expenses: [{ ...purchase, ...fields }],
        failures: [],
      }).expenses,
    ).toEqual([{ ...purchase, ...expected }]);
  },
);

test.each([-1, -4500, -2_147_483_648])(
  "accepts %i cents in creation, updates, and extraction",
  (amountInCents) => {
    const fields = { ...purchase, amountInCents };
    expect(expenseCreateSchema.parse(fields)).toEqual(fields);
    expect(expenseUpdateSchema.parse({ id, amountInCents })).toEqual({
      id,
      amountInCents,
    });
    expect(
      expenseModelOutputSchema.parse({
        expenses: [fields],
        failures: [
          {
            partialExpense: { amountInCents },
            sourceText: "Refund",
            reason: "Missing details",
            suggestions: [],
          },
        ],
      }),
    ).toMatchObject({
      expenses: [fields],
      failures: [{ partialExpense: { amountInCents } }],
    });
  },
);

test.each(["2026-11-13T12:00:00Z", "2026-11-13T13:00:00+01:00"])(
  "accepts the Date representing %s for creation and updates",
  (timestamp) => {
    const purchasedAt = new Date(timestamp);
    expect(
      expenseCreateSchema.parse({ ...purchase, purchasedAt }).purchasedAt,
    ).toBe(purchasedAt);
    expect(expenseUpdateSchema.parse({ id, purchasedAt }).purchasedAt).toBe(
      purchasedAt,
    );
  },
);

test.each([
  "not-a-date",
  "2026-02-30T12:00:00Z",
  "2026-11-13",
  "2026-11-13T12:00:00",
  "2026-11-13T12:00:00Z",
  new Date(Number.NaN),
  null,
  123,
])("rejects invalid purchase timestamp %s", (purchasedAt) => {
  expect(
    expenseCreateSchema.safeParse({ ...purchase, purchasedAt }).success,
  ).toBe(false);
  expect(expenseUpdateSchema.safeParse({ id, purchasedAt }).success).toBe(
    false,
  );
});

test("allows the purchase timestamp to default on creation or stay unchanged on update", () => {
  expect(expenseCreateSchema.parse(purchase)).toEqual(purchase);
  expect(expenseUpdateSchema.parse({ id, title: "Tea" })).toEqual({
    id,
    title: "Tea",
  });
  expect(expenseUpdateSchema.safeParse({ title: "Tea" }).success).toBe(false);
});

test("keeps generated IDs and audit timestamps out of writable fields", () => {
  const audit = {
    createdAt: "2000-01-01T00:00:00Z",
    updatedAt: "2000-01-01T00:00:00Z",
  };
  expect(expenseCreateSchema.parse({ ...purchase, id, ...audit })).toEqual(
    purchase,
  );
  expect(expenseUpdateSchema.parse({ id, title: "Tea", ...audit })).toEqual({
    id,
    title: "Tea",
  });
});

test.each(["2026-11-13T12:00:00.000Z", "2026-07-13T12:00:00.000Z"])(
  "preserves Date objects for %s in responses and subsequent updates",
  async (timestamp) => {
    const driverDate = new Date(timestamp);
    const row = expenseSchema.parse({
      ...purchase,
      id,
      merchant: null,
      collectionId: null,
      captureId: null,
      purchasedAt: expensesTable.purchasedAt.mapFromDriverValue(driverDate),
      createdAt: expensesTable.createdAt.mapFromDriverValue(driverDate),
      updatedAt: expensesTable.updatedAt.mapFromDriverValue(driverDate),
    });
    const router = t.router({
      get: publicProcedure.output(expenseSchema).query(() => row),
      list: publicProcedure.output(expensesSchema).query(() => [row]),
      update: publicProcedure
        .input(expenseUpdateSchema)
        .mutation(({ input }) => input),
    });

    const expected = {
      ...purchase,
      id,
      merchant: null,
      collectionId: null,
      captureId: null,
      purchasedAt: driverDate,
      createdAt: driverDate,
      updatedAt: driverDate,
    } satisfies inferRouterOutputs<typeof router>["get"];

    for (const path of ["get", "list"]) {
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: new Request(`http://localhost/trpc/${path}`),
        router,
        createContext: () => authenticatedContext(db),
      });
      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toEqual({
        result: {
          data: superjson.serialize(path === "get" ? expected : [expected]),
        },
      });
      if (path === "get") {
        const envelope = z
          .object({
            result: z.object({ data: z.unknown() }),
          })
          .parse(body);
        const received = expenseSchema.parse(
          superjson.parse(JSON.stringify(envelope.result.data)),
        );
        expect(received.purchasedAt).toBeInstanceOf(Date);
        expect(received.purchasedAt.toISOString()).toBe(timestamp);

        const updateInput = { ...received, title: "Tea" };
        const updated = await fetchRequestHandler({
          endpoint: "/trpc",
          req: new Request("http://localhost/trpc/update", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: superjson.stringify(updateInput),
          }),
          router,
          createContext: () => authenticatedContext(db),
        });
        expect(updated.status).toBe(200);
        expect(await updated.json()).toEqual({
          result: {
            data: superjson.serialize(expenseUpdateSchema.parse(updateInput)),
          },
        });
      }
    }
  },
);

test("keeps the model input schema JSON-compatible", () => {
  expect(() =>
    z.toJSONSchema(expenseModelOutputSchema, { io: "input" }),
  ).not.toThrow();
  expect(
    expenseModelOutputSchema.parse({ expenses: [purchase], failures: [] }),
  ).toEqual({ expenses: [purchase], failures: [] });
});

test.each([
  "not-a-date",
  "2026-02-30T12:00:00Z",
  "2026-11-13",
  "2026-11-13T12:00:00",
])("rejects invalid model purchase timestamp %s", (purchasedAt) => {
  expect(
    expenseModelOutputSchema.safeParse({
      expenses: [{ ...purchase, purchasedAt }],
      failures: [],
    }).success,
  ).toBe(false);
});
