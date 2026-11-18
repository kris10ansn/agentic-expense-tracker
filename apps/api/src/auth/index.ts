import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import type { authConfigSchema } from "../config";
import type { Database } from "../db";
import { isEmailAllowed } from "./access";
import * as schema from "./schema";

export function createAuth(
  db: Database,
  config: z.output<typeof authConfigSchema>,
) {
  function requireAllowed(email: string) {
    if (!isEmailAllowed(email, config.AUTH_ALLOWED_EMAILS)) {
      throw new APIError("UNAUTHORIZED", {
        message: "Account access is unavailable.",
      });
    }
  }

  return betterAuth({
    appName: "AI Expenses",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      autoSignIn: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    // Provisioning is available only through the local account command.
    disabledPaths: [
      "/sign-up/email",
      "/request-password-reset",
      "/reset-password",
      "/update-user",
    ],
    rateLimit: { enabled: true },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            requireAllowed(user.email);
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [user] = await db
              .select()
              .from(schema.user)
              .where(eq(schema.user.id, session.userId));
            if (!user) {
              throw new APIError("UNAUTHORIZED");
            }
            requireAllowed(user.email);
          },
        },
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (
          ctx.path === "/get-session" &&
          ctx.context.session &&
          !isEmailAllowed(
            ctx.context.session.user.email,
            config.AUTH_ALLOWED_EMAILS,
          )
        ) {
          return ctx.json(null);
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
