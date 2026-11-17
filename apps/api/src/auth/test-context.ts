import type { Database } from "../db";
import { user } from "./schema";

export const testUserId = "test-user";
export const testAuthConfig = {
  BETTER_AUTH_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
  AUTH_ALLOWED_EMAILS: "test@example.com",
};

export function authenticatedContext(db: Database) {
  return { db, authenticate: async () => ({ id: testUserId }) };
}

export async function seedTestUser(db: Database) {
  await db
    .insert(user)
    .values({ id: testUserId, name: "Test", email: "test@example.com" });
}
