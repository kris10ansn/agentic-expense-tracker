import { inArray } from "drizzle-orm";
import { createAuth } from "./auth";
import { configSchema } from "./config";
import { createDatabase } from "./db";
import { capturesTable } from "./db/schema";
import { createRequestHandler } from "./http";

const config = configSchema.parse(process.env);
const db = createDatabase(config.DATABASE_URL);

const interruptedCaptures = await db
  .update(capturesTable)
  .set({
    status: "failed",
    errorMessage: "Processing was interrupted. Please try again.",
  })
  .where(inArray(capturesTable.status, ["extracting", "saving"]))
  .returning({ id: capturesTable.id });

if (interruptedCaptures.length > 0) {
  console.info({
    event: "interrupted_captures_failed",
    captureIds: interruptedCaptures.map((capture) => capture.id),
  });
}

const server = Bun.serve({
  port: config.API_PORT,
  fetch: createRequestHandler({ db, auth: createAuth(db, config) }),
});

console.info({ event: "api_started", url: server.url.href });

async function shutdown() {
  await server.stop();
  await db.$client.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
