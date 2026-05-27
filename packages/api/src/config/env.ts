import { baseEnvSchema, parseEnv } from "@rag/core";
import { z } from "zod";

const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});

export const env = parseEnv(apiEnvSchema);
