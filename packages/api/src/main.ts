import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

const shutdown = async () => {
  app.log.info("Shutting down API service");
  await app.close();
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
