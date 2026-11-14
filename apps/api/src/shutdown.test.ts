import { expect, test } from "bun:test";
import { join } from "node:path";

test("Ctrl+C exits the API watcher after cleanup", async () => {
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
        API_PORT: String(port),
        DATABASE_URL: "postgresql://test:test@localhost:1/expenses",
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
