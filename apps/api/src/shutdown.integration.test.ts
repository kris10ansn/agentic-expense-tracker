import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { seedTestUser, testAuthConfig, testUserId } from "./auth/test-context";
import { createDatabase } from "./db";
import { type Capture, capturesTable } from "./db/schema";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(databaseUrl === undefined)(
  "API startup and shutdown with PostgreSQL",
  () => {
    const url = new URL(
      databaseUrl ?? "postgresql://test:test@localhost:1/test",
    );
    const admin = createDatabase(url.href);
    const databaseName = `shutdown_test_${crypto.randomUUID().replaceAll("-", "")}`;
    url.pathname = `/${databaseName}`;
    const db = createDatabase(url.href);
    const statuses: Capture["status"][] = [
      "extracting",
      "saving",
      "complete",
      "failed",
    ];
    const captures = statuses.map((status) => ({
      id: crypto.randomUUID(),
      userId: testUserId,
      status,
      description: "Coffee",
      fileNames: [],
      failures: null,
      errorMessage: null,
      dismissedAt: null,
    }));

    beforeAll(async () => {
      await admin.$client.unsafe(`CREATE DATABASE "${databaseName}"`);
      await migrate(db, {
        migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
      });
      await seedTestUser(db);
      await db.insert(capturesTable).values(captures);
    });

    afterAll(async () => {
      await db.$client.close();
      try {
        await admin.$client.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      } finally {
        await admin.$client.close();
      }
    });

    test("startup fails interrupted captures and Ctrl+C exits the API watcher after cleanup", async () => {
      const reservation = Bun.serve({
        port: 0,
        fetch: () => new Response(),
      });
      const port = reservation.port;
      await reservation.stop(true);

      const child = Bun.spawn(
        [process.execPath, "--watch", join(import.meta.dir, "index.ts")],
        {
          env: {
            ...process.env,
            ...testAuthConfig,
            API_PORT: String(port),
            DATABASE_URL: url.href,
            GOOGLE_GENERATIVE_AI_API_KEY: "test-api-key",
          },
          stdout: "ignore",
          stderr: "inherit",
        },
      );

      try {
        const deadline = performance.now() + 5_000;
        while (true) {
          const response = await fetch(`http://127.0.0.1:${port}/health`, {
            signal: AbortSignal.timeout(200),
          }).catch(() => undefined);
          if (response?.ok) {
            await response.text();
            break;
          }
          if (child.exitCode !== null || performance.now() >= deadline) {
            throw new Error("API did not become ready");
          }
          await Bun.sleep(20);
        }

        expect(await db.select().from(capturesTable)).toEqual(
          expect.arrayContaining(
            captures.map((capture) => ({
              ...capture,
              errorMessage:
                capture.status === "extracting" || capture.status === "saving"
                  ? "Processing was interrupted. Please try again."
                  : null,
              status:
                capture.status === "extracting" || capture.status === "saving"
                  ? "failed"
                  : capture.status,
            })),
          ),
        );

        child.kill("SIGINT");
        const exitCode = await Promise.race([
          child.exited,
          Bun.sleep(2_000).then(() => "still running"),
        ]);
        expect(exitCode).toBe(0);
      } finally {
        if (child.exitCode === null) {
          child.kill("SIGKILL");
        }
        await child.exited;
      }
    }, 10_000);
  },
);
