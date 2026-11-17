import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { Auth } from "./auth";
import type { Database } from "./db";
import { appRouter } from "./router";

export function createRequestHandler({
  db,
  auth,
}: {
  db: Database;
  auth: Auth;
}) {
  return async function handleRequest(req: Request) {
    const { pathname } = new URL(req.url);
    if (pathname === "/health") {
      return Response.json({ status: "ok" });
    }
    if (pathname.startsWith("/api/auth/")) {
      const response = await auth.handler(req);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (pathname === "/trpc" || pathname.startsWith("/trpc/")) {
      // Cookie-authenticated mutations must come from the app's origin.
      const origin = req.headers.get("origin");
      if (
        req.method !== "GET" &&
        origin !== new URL(auth.options.baseURL ?? req.url).origin
      ) {
        return new Response("Untrusted origin", { status: 403 });
      }
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req,
        router: appRouter,
        createContext: ({ resHeaders, info }) => ({
          db,
          authenticate: async () => {
            // Streams recheck sessions after headers have already been sent.
            const { response, headers } = await auth.api.getSession({
              headers: req.headers,
              query: { disableRefresh: info.type === "subscription" },
              returnHeaders: true,
            });
            for (const cookie of headers.getSetCookie()) {
              resHeaders.append("Set-Cookie", cookie);
            }
            return response?.user ?? null;
          },
        }),
        onError({ error, path }) {
          if (error.code === "INTERNAL_SERVER_ERROR") {
            console.error({
              event: "trpc_error",
              path,
              code: error.code,
              message: error.message,
            });
          }
        },
      });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    return new Response("Not found", { status: 404 });
  };
}
