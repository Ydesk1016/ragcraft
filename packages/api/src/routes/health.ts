import type { FastifyPluginAsync } from "fastify";
import type { Redis } from "ioredis";
import type { Pool } from "pg";
import { env } from "../config/env.js";

interface HealthOptions {
  db: Pool;
  redis: Redis;
}

export const healthRoutes: FastifyPluginAsync<HealthOptions> = async (app, options) => {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async (_request, reply) => {
    const checks = {
      postgres: await checkPostgres(options.db),
      redis: await checkRedis(options.redis),
      qdrant: await checkQdrant()
    };
    const isReady = Object.values(checks).every((check) => check === "ok");

    return reply.code(isReady ? 200 : 503).send({
      status: isReady ? "ok" : "degraded",
      checks
    });
  });
};

async function checkPostgres(db: Pool) {
  try {
    await db.query("select 1");
    return "ok" as const;
  } catch {
    return "error" as const;
  }
}

async function checkRedis(redis: Redis) {
  try {
    await redis.ping();
    return "ok" as const;
  } catch {
    return "error" as const;
  }
}

async function checkQdrant() {
  try {
    const response = await fetch(`${env.QDRANT_URL}/readyz`);
    return response.ok ? "ok" as const : "error" as const;
  } catch {
    return "error" as const;
  }
}
