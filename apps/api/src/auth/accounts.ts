import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { isEmailAllowed } from "./access";
import type { Auth } from "./index";
import { account, session, user } from "./schema";

export const accountInputSchema = z.object({
  action: z.enum(["create", "reset-password"]),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(128),
});

export async function manageAccount({
  db,
  auth,
  allowedEmails,
  input,
}: {
  db: Database;
  auth: Auth;
  allowedEmails: readonly string[];
  input: z.output<typeof accountInputSchema>;
}) {
  if (!isEmailAllowed(input.email, allowedEmails)) {
    throw new Error("Add this email to AUTH_ALLOWED_EMAILS first.");
  }
  if (input.action === "create") {
    const result = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.email,
      },
    });
    return result.user.id;
  }

  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, input.email));
  if (!existing) {
    throw new Error("Account not found.");
  }
  const password = await hashPassword(input.password);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(account)
      .set({ password, updatedAt: new Date() })
      .where(
        and(
          eq(account.userId, existing.id),
          eq(account.providerId, "credential"),
        ),
      )
      .returning({ id: account.id });
    if (updated.length !== 1) {
      throw new Error("Password account not found.");
    }
    await tx.delete(session).where(eq(session.userId, existing.id));
  });
  return existing.id;
}
