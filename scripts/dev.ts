import { parseArgs } from "node:util";
import { z } from "zod";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "web-port": { type: "string" },
    "api-port": { type: "string" },
  },
});

const portSchema = z.coerce.number().int().min(1).max(65535);
const ports = z
  .object({
    "web-port": portSchema.optional(),
    "api-port": portSchema.optional(),
  })
  .safeParse(values);

if (!ports.success) {
  console.error(z.prettifyError(ports.error));
  process.exit(1);
}

const env = { ...process.env };

if (ports.data["web-port"] !== undefined) {
  env.WEB_PORT = String(ports.data["web-port"]);
}

if (ports.data["api-port"] !== undefined) {
  env.API_PORT = String(ports.data["api-port"]);
}

const child = Bun.spawn(
  [process.execPath, "run", "--parallel", "dev:api", "dev:web"],
  { env, stdin: "inherit", stdout: "inherit", stderr: "inherit" },
);

process.once("SIGINT", () => child.kill("SIGINT"));
process.once("SIGTERM", () => child.kill("SIGTERM"));

process.exit(await child.exited);
