import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

export function loadRootEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path });
      return;
    }
  }
}

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QDRANT_URL: z.string().url(),
  DOCUMENT_QUEUE_NAME: z.string().min(1).default("documents"),
  UPLOAD_DIR: z.string().min(1).default("uploads")
});

export function parseEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  loadRootEnv();
  return schema.parse(process.env);
}
