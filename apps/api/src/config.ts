import { z } from "zod";

export const authConfigSchema = z.object({
  BETTER_AUTH_URL: z
    .url({ protocol: /^https?$/ })
    .default("http://localhost:5173"),
  BETTER_AUTH_SECRET: z.string().min(32),
  AUTH_ALLOWED_EMAILS: z
    .string()
    .transform((value) =>
      value.split(",").map((email) => email.trim().toLowerCase()),
    )
    .pipe(z.array(z.email()).min(1)),
});

export const configSchema = authConfigSchema.extend({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
});
