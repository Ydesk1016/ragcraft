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
  OPENAI_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(["openai", "ollama"]).default("openai"),
  LLM_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OLLAMA_LLM_MODEL: z.string().min(1).default("llama3"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  EMBEDDING_PROVIDER: z.enum(["openai", "local-ollama"]).default("openai"),
  EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  OLLAMA_EMBEDDING_MODEL: z.string().min(1).default("nomic-embed-text"),
  LANGSMITH_TRACING: z.coerce.boolean().default(false),
  LANGSMITH_API_KEY: z.string().optional(),
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
