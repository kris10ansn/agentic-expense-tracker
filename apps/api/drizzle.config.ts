import { defineConfig } from "drizzle-kit";
import { configSchema } from "./src/config";

const config = configSchema.pick({ DATABASE_URL: true }).parse(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: config.DATABASE_URL },
});
