import net from "node:net";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv();
const apiPort = Number(env.API_PORT ?? 3001);
const webPort = 3000;

const checks = [
  checkPortFree(webPort, "web"),
  checkPortFree(apiPort, "api"),
  checkTcpUrl(env.REDIS_URL ?? "redis://localhost:6379", "Redis"),
  checkTcpUrl(env.DATABASE_URL ?? "postgresql://rag:rag@localhost:5432/rag", "PostgreSQL"),
  checkHttpUrl(env.QDRANT_URL ?? "http://localhost:6333", "Qdrant")
];

const results = await Promise.all(checks);
const failures = results.filter((result) => !result.ok);

if (failures.length > 0) {
  console.error("[dev:check] Startup checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  console.error("");
  console.error("Run `pnpm infra:up` first. If a port is occupied, stop the existing dev process or change the port in .env.");
  process.exit(1);
}

console.info("[dev:check] Startup checks passed.");

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return {};

  const entries = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return index === -1 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)];
    });

  return Object.fromEntries(entries);
}

async function checkPortFree(port, label) {
  return new Promise((resolveCheck) => {
    const server = net.createServer();

    server.once("error", () => {
      resolveCheck({ ok: false, message: `${label} port ${port} is already in use` });
    });

    server.once("listening", () => {
      server.close(() => resolveCheck({ ok: true }));
    });

    server.listen(port, "0.0.0.0");
  });
}

async function checkTcpUrl(value, label) {
  const url = new URL(value);
  const port = Number(url.port || defaultPort(url.protocol));
  return checkTcp(url.hostname, port, label);
}

async function checkHttpUrl(value, label) {
  const url = new URL(value);
  const port = Number(url.port || defaultPort(url.protocol));
  return checkTcp(url.hostname, port, label);
}

async function checkTcp(host, port, label) {
  return new Promise((resolveCheck) => {
    const socket = net.createConnection({ host, port, timeout: 1500 });

    socket.once("connect", () => {
      socket.destroy();
      resolveCheck({ ok: true });
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolveCheck({ ok: false, message: `${label} is not reachable at ${host}:${port}` });
    });

    socket.once("error", () => {
      resolveCheck({ ok: false, message: `${label} is not reachable at ${host}:${port}` });
    });
  });
}

function defaultPort(protocol) {
  if (protocol === "redis:") return 6379;
  if (protocol === "postgresql:" || protocol === "postgres:") return 5432;
  if (protocol === "https:") return 443;
  return 80;
}
