import type { FastifyPluginAsync } from "fastify";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/chat", async (_request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });

    for (const token of ["RAG ", "service ", "is ", "ready."]) {
      reply.raw.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    reply.raw.write("event: done\ndata: {}\n\n");
    reply.raw.end();
  });
};
