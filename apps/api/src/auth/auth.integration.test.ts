import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import superjson from "superjson";
import { z } from "zod";
import { captureEvents } from "../captures/events";
import { authConfigSchema } from "../config";
import { createDatabase } from "../db";
import {
  captureSchema,
  capturesTable,
  collectionSchema,
  expenseSchema,
  expensesTable,
} from "../db/schema";
import * as extraction from "../expenses/extract";
import { createRequestHandler } from "../http";
import { appRouter } from "../router";
import { accountInputSchema, manageAccount } from "./accounts";
import { createAuth } from "./index";
import { session, user } from "./schema";
import { testAuthConfig } from "./test-context";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)(
  "password authentication and user isolation",
  () => {
    const url = new URL(
      databaseUrl ?? "postgresql://test:test@localhost:1/test",
    );
    const admin = createDatabase(url.href);
    const databaseName = `auth_test_${crypto.randomUUID().replaceAll("-", "")}`;
    url.pathname = `/${databaseName}`;
    const db = createDatabase(url.href);
    const config = authConfigSchema.parse({
      ...testAuthConfig,
      AUTH_ALLOWED_EMAILS: "alice@example.com,bob@example.com",
    });
    const auth = createAuth(db, config);
    const handle = createRequestHandler({ db, auth });
    const password = "a-test-password-123";
    let aliceId = "";
    let bobId = "";

    let clientAddress = 1;
    function authRequest(
      path: string,
      body?: object,
      cookie = "",
      ip = `198.51.100.${clientAddress++}`,
    ) {
      return handle(
        new Request(`${config.BETTER_AUTH_URL}/api/auth/${path}`, {
          method: body ? "POST" : "GET",
          headers: {
            origin: config.BETTER_AUTH_URL,
            "content-type": "application/json",
            cookie,
            "x-forwarded-for": ip,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      );
    }

    function cookies(response: Response) {
      return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    }

    async function signIn(email: string, userPassword = password) {
      const response = await authRequest("sign-in/email", {
        email,
        password: userPassword,
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      await response.text();
      return cookies(response);
    }

    function rpc(
      path: string,
      cookie: string,
      input?: unknown,
      mutation = false,
    ) {
      const endpoint = new URL(`/trpc/${path}`, config.BETTER_AUTH_URL);
      if (!mutation && input !== undefined) {
        endpoint.searchParams.set("input", superjson.stringify(input));
      }
      return handle(
        new Request(endpoint.href, {
          method: mutation ? "POST" : "GET",
          headers: {
            cookie,
            origin: config.BETTER_AUTH_URL,
            "content-type": "application/json",
          },
          ...(mutation ? { body: superjson.stringify(input) } : {}),
        }),
      );
    }

    async function data<T>(
      response: Response,
      schema: z.ZodType<T>,
    ): Promise<T> {
      expect(response.status).toBe(200);
      const body = z
        .object({ result: z.object({ data: z.unknown() }) })
        .parse(await response.json());
      return schema.parse(superjson.parse(JSON.stringify(body.result.data)));
    }

    beforeAll(async () => {
      await admin.$client.unsafe(`CREATE DATABASE "${databaseName}"`);
      await migrate(db, {
        migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
      });
      aliceId = await manageAccount({
        db,
        auth,
        allowedEmails: config.AUTH_ALLOWED_EMAILS,
        input: { action: "create", email: "alice@example.com", password },
      });
      bobId = await manageAccount({
        db,
        auth,
        allowedEmails: config.AUTH_ALLOWED_EMAILS,
        input: { action: "create", email: "bob@example.com", password },
      });
    });

    afterEach(() => mock.restore());
    afterAll(async () => {
      await db.$client.close();
      await admin.$client.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.$client.close();
    });

    test("blocks public signup and rejects unauthenticated requests", async () => {
      expect(
        (
          await authRequest("sign-up/email", {
            email: "alice@example.com",
            password,
            name: "Imposter",
          })
        ).status,
      ).toBe(404);
      expect((await rpc("expenses.list", "")).status).toBe(401);
      expect((await rpc("collections.list", "")).status).toBe(401);
      expect((await rpc("captures.listActive", "")).status).toBe(401);
      const wrongPassword = await authRequest("sign-in/email", {
        email: "alice@example.com",
        password: "wrong-password",
      });
      expect(wrongPassword.status).toBe(401);
      expect(wrongPassword.headers.get("set-cookie")).toBeNull();
      await expect(
        manageAccount({
          db,
          auth,
          allowedEmails: config.AUTH_ALLOWED_EMAILS,
          input: { action: "create", email: "outsider@example.com", password },
        }),
      ).rejects.toThrow("AUTH_ALLOWED_EMAILS");
      expect(
        accountInputSchema.safeParse({
          action: "create",
          email: "alice@example.com",
          password: "short",
        }).success,
      ).toBe(false);
    });

    test("the root account command accepts hidden stdin for creation and reset", async () => {
      const email = "operator-test@example.com";
      const passwords = [
        "original-operator-password",
        "replacement-operator-password",
      ];
      let originalId: string | undefined;
      for (const [index, action] of ["create", "reset-password"].entries()) {
        const password = passwords[index];
        const command = Bun.spawn(
          [process.execPath, "run", "account", action, email],
          {
            cwd: new URL("../../../../", import.meta.url).pathname,
            env: {
              ...process.env,
              ...testAuthConfig,
              DATABASE_URL: url.href,
              AUTH_ALLOWED_EMAILS: email,
            },
            stdin: new Blob([`${password}\n`]),
            stdout: "pipe",
            stderr: "pipe",
          },
        );
        const timeout = setTimeout(() => command.kill(), 5000);
        const [output, error, code] = await Promise.all([
          new Response(command.stdout).text(),
          new Response(command.stderr).text(),
          command.exited,
        ]);
        clearTimeout(timeout);
        expect(code).toBe(0);
        expect(output + error).not.toContain(password);
        const [created] = await db
          .select()
          .from(user)
          .where(eq(user.email, email));
        expect(created).toBeDefined();
        if (action === "create") {
          originalId = created?.id;
        }
        expect(created?.id).toBe(originalId);
      }
      await db.delete(user).where(eq(user.email, email));
    }, 15000);

    test("isolates every CRUD operation and rejects foreign collection/capture references", async () => {
      const alice = await signIn("alice@example.com");
      const bob = await signIn("bob@example.com");
      const collection = await data(
        await rpc(
          "collections.create",
          alice,
          { title: "Private", color: "#458a72", userId: bobId },
          true,
        ),
        collectionSchema,
      );
      const expense = await data(
        await rpc(
          "expenses.create",
          alice,
          {
            title: "Coffee",
            amountInCents: 4500,
            currency: "NOK",
            description: "Coffee",
            category: "dining",
            collectionId: collection.id,
            userId: bobId,
          },
          true,
        ),
        expenseSchema,
      );
      expect(
        await data(
          await rpc("collections.list", bob),
          z.array(collectionSchema),
        ),
      ).toEqual([]);
      expect(
        await data(await rpc("expenses.list", bob), z.array(expenseSchema)),
      ).toEqual([]);
      for (const [router, id] of [
        ["collections", collection.id],
        ["expenses", expense.id],
      ]) {
        expect((await rpc(`${router}.get`, bob, { id })).status).toBe(404);
        expect(
          (await rpc(`${router}.update`, bob, { id, title: "Stolen" }, true))
            .status,
        ).toBe(404);
        expect((await rpc(`${router}.delete`, bob, { id }, true)).status).toBe(
          404,
        );
      }
      const purchase = {
        title: "Tea",
        amountInCents: 200,
        currency: "NOK",
        description: "Tea",
        category: "dining",
      };
      expect(
        (
          await rpc(
            "expenses.create",
            bob,
            { ...purchase, collectionId: collection.id },
            true,
          )
        ).status,
      ).toBe(404);
      const ownExpense = await data(
        await rpc("expenses.create", bob, purchase, true),
        expenseSchema,
      );
      expect(
        (
          await rpc(
            "expenses.update",
            bob,
            { id: ownExpense.id, collectionId: collection.id },
            true,
          )
        ).status,
      ).toBe(404);
      const captureId = crypto.randomUUID();
      await db.insert(capturesTable).values({
        id: captureId,
        userId: aliceId,
        status: "extracting",
        description: "Private receipt",
        fileNames: [],
      });
      expect(
        await data(
          await rpc("captures.listActive", bob),
          z.array(captureSchema),
        ),
      ).toEqual([]);
      expect(
        (await rpc("expenses.create", bob, { ...purchase, captureId }, true))
          .status,
      ).toBe(404);
      expect(
        (
          await rpc(
            "expenses.update",
            bob,
            { id: ownExpense.id, captureId },
            true,
          )
        ).status,
      ).toBe(404);
      const form = new FormData();
      form.set("id", crypto.randomUUID());
      form.set("description", "Coffee");
      form.set("collectionId", collection.id);
      const extract = spyOn(extraction, "extractExpenses");
      const response = await handle(
        new Request(`${config.BETTER_AUTH_URL}/trpc/captures.start`, {
          method: "POST",
          headers: { cookie: bob, origin: config.BETTER_AUTH_URL },
          body: form,
        }),
      );
      expect(response.status).toBe(404);
      expect(extract).not.toHaveBeenCalled();
      const caller = appRouter.createCaller({
        db,
        authenticate: async () =>
          (await auth.api.getSession({ headers: new Headers({ cookie: bob }) }))
            ?.user ?? null,
      });
      const watch = (await caller.captures.watch(captureId))[
        Symbol.asyncIterator
      ]();
      await expect(watch.next()).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(
        await data(
          await rpc("expenses.get", alice, { id: expense.id }),
          expenseSchema,
        ),
      ).toEqual(expense);
      expect(
        (
          await db
            .select()
            .from(expensesTable)
            .where(eq(expensesTable.id, expense.id))
        )[0]?.userId,
      ).toBe(aliceId);
    });

    test("rate limits repeated password attempts", async () => {
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 4; attempt++) {
        const response = await authRequest(
          "sign-in/email",
          { email: "alice@example.com", password: "wrong-password" },
          "",
          "203.0.113.1",
        );
        statuses.push(response.status);
        if (response.status === 429) {
          expect(Number(response.headers.get("x-retry-after"))).toBeGreaterThan(
            0,
          );
        }
      }
      expect(statuses).toEqual([401, 401, 401, 429]);
    });

    test("expires and refreshes sessions, blocks removed accounts, and enforces origin checks", async () => {
      const cookie = await signIn("alice@example.com");
      const oldDate = new Date(Date.now() - 2 * 86_400_000);
      await db
        .update(session)
        .set({
          createdAt: oldDate,
          updatedAt: oldDate,
          expiresAt: new Date(oldDate.getTime() + 30 * 86_400_000),
        })
        .where(eq(session.userId, aliceId));
      const refreshed = await rpc("expenses.list", cookie);
      expect(refreshed.status).toBe(200);
      expect(refreshed.headers.get("set-cookie")).toContain("Max-Age=2592000");
      const evil = await handle(
        new Request(`${config.BETTER_AUTH_URL}/trpc/collections.create`, {
          method: "POST",
          headers: {
            cookie,
            origin: "https://evil.example",
            "content-type": "application/json",
          },
          body: superjson.stringify({ title: "Bad", color: "#458a72" }),
        }),
      );
      expect(evil.status).toBe(403);
      config.AUTH_ALLOWED_EMAILS.splice(
        config.AUTH_ALLOWED_EMAILS.indexOf("alice@example.com"),
        1,
      );
      try {
        expect((await rpc("expenses.list", cookie)).status).toBe(401);
        expect(
          await (await authRequest("get-session", undefined, cookie)).json(),
        ).toBeNull();
        expect(
          (
            await authRequest("sign-in/email", {
              email: "alice@example.com",
              password,
            })
          ).status,
        ).toBe(401);
      } finally {
        config.AUTH_ALLOWED_EMAILS.push("alice@example.com");
      }
      await db
        .update(session)
        .set({ expiresAt: new Date(0) })
        .where(eq(session.userId, aliceId));
      expect((await rpc("expenses.list", cookie)).status).toBe(401);
    });

    test("password changes and operator resets revoke sessions and preserve the user ID", async () => {
      const first = await signIn("bob@example.com");
      const second = await signIn("bob@example.com");
      const replacement = "replacement-password-123";
      const changed = await authRequest(
        "change-password",
        {
          currentPassword: password,
          newPassword: replacement,
          revokeOtherSessions: true,
        },
        first,
      );
      expect(changed.status).toBe(200);
      expect((await rpc("expenses.list", second)).status).toBe(401);
      expect(
        (
          await authRequest("sign-in/email", {
            email: "bob@example.com",
            password,
          })
        ).status,
      ).toBe(401);
      const active = await signIn("bob@example.com", replacement);
      const id = await manageAccount({
        db,
        auth,
        allowedEmails: config.AUTH_ALLOWED_EMAILS,
        input: { action: "reset-password", email: "bob@example.com", password },
      });
      expect(id).toBe(bobId);
      expect((await rpc("expenses.list", active)).status).toBe(401);
      const resetSession = await signIn("bob@example.com");
      expect((await authRequest("sign-out", {}, resetSession)).status).toBe(
        200,
      );
      expect((await rpc("expenses.list", resetSession)).status).toBe(401);
    });

    test("logout stops capture delivery while accepted work finishes for its original owner", async () => {
      const cookie = await signIn("alice@example.com");
      const collection = await data(
        await rpc(
          "collections.create",
          cookie,
          { title: "Capture", color: "#458a72" },
          true,
        ),
        collectionSchema,
      );
      const result =
        Promise.withResolvers<
          Awaited<ReturnType<typeof extraction.extractExpenses>>
        >();
      spyOn(extraction, "extractExpenses").mockReturnValue(result.promise);
      const form = new FormData();
      const id = crypto.randomUUID();
      form.set("id", id);
      form.set("collectionId", collection.id);
      form.set("description", "Coffee");
      expect(
        (
          await handle(
            new Request(`${config.BETTER_AUTH_URL}/trpc/captures.start`, {
              method: "POST",
              headers: { cookie, origin: config.BETTER_AUTH_URL },
              body: form,
            }),
          )
        ).status,
      ).toBe(200);
      const caller = appRouter.createCaller({
        db,
        authenticate: async () =>
          (
            await auth.api.getSession({
              headers: new Headers({ cookie }),
              query: { disableRefresh: true },
            })
          )?.user ?? null,
      });
      const watch = (await caller.captures.watch(id))[Symbol.asyncIterator]();
      await watch.next();
      await authRequest("sign-out", {}, cookie);
      result.resolve({
        expenses: [
          {
            title: "Coffee",
            amountInCents: 4500,
            currency: "NOK",
            description: "Coffee",
            category: "dining",
          },
        ],
        failures: [],
      });
      await expect(watch.next()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      for (let attempt = 0; attempt < 100; attempt++) {
        const [capture] = await db
          .select()
          .from(capturesTable)
          .where(eq(capturesTable.id, id));
        if (capture?.status === "complete") {
          break;
        }
        await Bun.sleep(10);
      }
      const saved = await db
        .select()
        .from(expensesTable)
        .where(eq(expensesTable.captureId, id));
      expect(saved).toMatchObject([
        { userId: aliceId, collectionId: collection.id },
      ]);
      expect(captureEvents.emit(id, { capture: { status: "saving" } })).toBe(
        false,
      );
      expect(await db.select({ id: user.id }).from(user)).toHaveLength(2);
    });
  },
);
