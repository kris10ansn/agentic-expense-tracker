import { afterAll, afterEach, expect, mock, spyOn, test } from "bun:test";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { authenticatedContext } from "./auth/test-context";
import { createDatabase } from "./db";
import { expensesTable } from "./db/schema";
import { appRouter } from "./router";

const db = createDatabase("postgresql://test:test@localhost:1/expenses");
const caller = appRouter.createCaller(authenticatedContext(db));

afterEach(() => mock.restore());
afterAll(async () => {
  await db.$client.close();
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
    createContext: () => authenticatedContext(db),
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
