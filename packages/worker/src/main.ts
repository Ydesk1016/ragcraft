import { Worker } from "bullmq";
import { env } from "./config/env.js";
import { createRedisConnection } from "./lib/redis.js";
import { processDocument } from "./processors/documents.js";

const connection = createRedisConnection();
const worker = new Worker(env.DOCUMENT_QUEUE_NAME, processDocument, { connection });

worker.on("completed", (job) => {
  console.info(`Document job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Document job ${job?.id ?? "unknown"} failed`, error);
});

const shutdown = async () => {
  console.info("Shutting down worker");
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
