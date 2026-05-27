import type { Job } from "bullmq";
import type { DocumentIndexJob } from "@rag/core";

export async function processDocument(job: Job<DocumentIndexJob>) {
  const filename = job.data.filename ?? "unknown";

  await job.updateProgress(10);
  console.info(`Parsing document ${job.data.documentId} (${filename})`);

  await delay(200);
  await job.updateProgress(50);
  console.info(`Creating chunks and embeddings for ${job.data.documentId}`);

  await delay(200);
  await job.updateProgress(90);
  console.info(`Upserting vectors for ${job.data.documentId}`);

  await delay(200);
  await job.updateProgress(100);

  return { documentId: job.data.documentId, status: "completed" };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
