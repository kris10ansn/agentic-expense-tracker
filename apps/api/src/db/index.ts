import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as authSchema from "../auth/schema";
import * as schema from "./schema";

export function createDatabase(url: string) {
  const client = new SQL(url, { connectionTimeout: 5 });
  return drizzle({ client, schema: { ...schema, ...authSchema } });
}

export type Database = ReturnType<typeof createDatabase>;
