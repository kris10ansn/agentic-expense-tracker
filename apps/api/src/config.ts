import { z } from "zod";

export const configSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
});
