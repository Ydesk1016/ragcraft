import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { DocumentIndexJob } from "@rag/core";
import { env } from "../config/env.js";

export function createRedisConnection() {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export function createDocumentQueue(connection: Redis) {
  return new Queue<DocumentIndexJob>(env.DOCUMENT_QUEUE_NAME, { connection });
}
