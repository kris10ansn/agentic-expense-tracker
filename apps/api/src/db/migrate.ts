import { migrate } from "drizzle-orm/bun-sql/migrator";
import { configSchema } from "../config";
import { createDatabase } from "./index";

const config = configSchema.pick({ DATABASE_URL: true }).parse(process.env);
const db = createDatabase(config.DATABASE_URL);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.info({ event: "migrations_applied" });
} finally {
  await db.$client.close();
}
