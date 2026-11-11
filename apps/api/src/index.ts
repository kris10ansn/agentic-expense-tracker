import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { configSchema } from "./config";
import { createDatabase } from "./db";
import { appRouter } from "./router";

const config = configSchema.parse(process.env);
const db = createDatabase(config.DATABASE_URL);

const server = Bun.serve({
  port: config.API_PORT,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (pathname === "/trpc" || pathname.startsWith("/trpc/")) {
      return fetchRequestHandler({
        endpoint: "/trpc",
        req,
        router: appRouter,
        createContext: () => ({ db }),
        onError({ error, path }) {
          console.error({
            event: "trpc_error",
            path,
            code: error.code,
            message: error.message,
          });
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.info({ event: "api_started", url: server.url.href });

async function shutdown() {
  await server.stop();
  await db.$client.close();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
