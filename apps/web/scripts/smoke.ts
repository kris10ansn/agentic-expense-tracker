import assert from "node:assert/strict";
import process from "node:process";
import type { AppRouter } from "@ai-expenses/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const webUrl = process.env.WEB_URL ?? "http://localhost:5173";
const response = await fetch(webUrl, { signal: AbortSignal.timeout(10_000) });
assert.equal(response.status, 200, "The web app must respond successfully.");
assert.match(await response.text(), /<div id="root"><\/div>/);

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: new URL("/trpc", webUrl).href })],
});

const status = await client.status.query(undefined, {
  signal: AbortSignal.timeout(10_000),
});
assert.deepEqual(status, { api: "ok", database: "connected" });
console.info("Verified web → tRPC API → PostgreSQL.");
