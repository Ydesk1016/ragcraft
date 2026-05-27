import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { Pool } from "pg";
import { env } from "./config/env.js";
import { createDocumentQueue, createRedisConnection } from "./queue/documents.js";
import { chatRoutes } from "./routes/chat.js";
import { documentRoutes } from "./routes/documents.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined
    }
  });
  const db = new Pool({ connectionString: env.DATABASE_URL });
  const redis = createRedisConnection();
  const documentQueue = createDocumentQueue(redis);

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  await app.register(healthRoutes, { db, redis });
  await app.register(chatRoutes);
  await app.register(documentRoutes, { queue: documentQueue });

  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath("/admin/queues");
  createBullBoard({
    queues: [new BullMQAdapter(documentQueue)],
    serverAdapter
  });
  await app.register(serverAdapter.registerPlugin(), { prefix: "/admin/queues" });

  app.addHook("onClose", async () => {
    await documentQueue.close();
    await redis.quit();
    await db.end();
  });

  return app;
}
