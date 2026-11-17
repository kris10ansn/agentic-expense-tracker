import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { authConfigSchema, configSchema } from "../config";
import { createDatabase } from "../db";
import { accountInputSchema, manageAccount } from "./accounts";
import { createAuth } from "./index";

async function readPassword() {
  const output = new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });
  const reader = createInterface({
    input: process.stdin,
    output,
    terminal: Boolean(process.stdin.isTTY),
  });
  process.stdout.write("Password (12–128 characters, hidden): ");
  try {
    return await reader.question("");
  } finally {
    reader.close();
    process.stdout.write("\n");
  }
}

async function main() {
  const [action, email, ...extra] = process.argv.slice(2);
  if (
    !email ||
    extra.length ||
    (action !== "create" && action !== "reset-password")
  ) {
    throw new Error("Usage: bun run account <create|reset-password> <email>");
  }
  const config = authConfigSchema
    .extend(configSchema.pick({ DATABASE_URL: true }).shape)
    .parse(process.env);
  const input = accountInputSchema.parse({
    action,
    email,
    password: await readPassword(),
  });
  const db = createDatabase(config.DATABASE_URL);
  try {
    const userId = await manageAccount({
      db,
      auth: createAuth(db, config),
      allowedEmails: config.AUTH_ALLOWED_EMAILS,
      input,
    });
    console.info({
      event: "account_updated",
      action,
      email: input.email,
      userId,
    });
  } finally {
    await db.$client.close();
  }
}

await main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Account command failed.",
  );
  process.exitCode = 1;
});
