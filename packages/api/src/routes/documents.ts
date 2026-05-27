import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyPluginAsync } from "fastify";
import type { Queue } from "bullmq";
import type { DocumentIndexJob, RagDocument } from "@rag/core";
import { env } from "../config/env.js";

interface DocumentsOptions {
  queue: Queue<DocumentIndexJob>;
}

const documents = new Map<string, RagDocument>();

export const documentRoutes: FastifyPluginAsync<DocumentsOptions> = async (app, options) => {
  app.get("/api/documents", async () => ({ data: Array.from(documents.values()) }));

  app.get<{ Params: { id: string } }>("/api/documents/:id", async (request, reply) => {
    const document = documents.get(request.params.id);
    if (!document) {
      return reply.code(404).send({ error: "Document not found" });
    }

    return { data: document };
  });

  app.post("/api/documents/upload", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "Missing file" });
    }

    await mkdir(env.UPLOAD_DIR, { recursive: true });
    const id = randomUUID();
    const filename = `${id}-${file.filename}`;
    await pipeline(file.file, createWriteStream(join(env.UPLOAD_DIR, filename)));

    const document: RagDocument = {
      id,
      filename,
      status: "queued",
      createdAt: new Date().toISOString()
    };
    documents.set(id, document);
    await options.queue.add("index-document", { documentId: id, filename });

    return reply.code(201).send({ data: document });
  });

  app.post<{ Params: { id: string } }>("/api/documents/:id/index", async (request, reply) => {
    const document = documents.get(request.params.id);
    if (!document) {
      return reply.code(404).send({ error: "Document not found" });
    }

    document.status = "queued";
    await options.queue.add("index-document", {
      documentId: document.id,
      filename: document.filename
    });

    return { data: document };
  });

  app.delete<{ Params: { id: string } }>("/api/documents/:id", async (request, reply) => {
    const deleted = documents.delete(request.params.id);
    return reply.code(deleted ? 204 : 404).send(deleted ? undefined : { error: "Document not found" });
  });
};
