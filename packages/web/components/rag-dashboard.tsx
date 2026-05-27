"use client";

import { FormEvent, useState } from "react";
import type { RagDocument } from "@rag/core";

export function RagDashboard() {
  const [answer, setAnswer] = useState("");
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [message, setMessage] = useState("准备就绪");

  async function startChat() {
    setAnswer("");
    setIsChatting(true);

    try {
      const response = await fetch("/api/chat", { method: "POST" });
      if (!response.body) {
        throw new Error("SSE response body is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendSseChunk(decoder.decode(value));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "聊天请求失败");
    } finally {
      setIsChatting(false);
    }
  }

  function appendSseChunk(chunk: string) {
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;

      const data = JSON.parse(line.slice(6)) as { token?: string };
      if (data.token) {
        setAnswer((current) => `${current}${data.token}`);
      }
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/documents/upload", { method: "POST", body: form });
    const body = (await response.json()) as { data?: RagDocument; error?: string };

    if (!response.ok || !body.data) {
      setMessage(body.error ?? "上传失败");
      return;
    }

    setDocuments((current) => [body.data!, ...current]);
    setMessage("文档已入队，Worker 会异步处理");
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-signal">LangChain RAG</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            本地优先的 RAG 开发工作台
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Next.js 前端、Fastify API、BullMQ Worker、PostgreSQL、Redis 和 Qdrant 已按 monorepo 基础结构串联。
          </p>

          <button
            type="button"
            onClick={startChat}
            disabled={isChatting}
            className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChatting ? "生成中..." : "测试 SSE 聊天"}
          </button>

          <div className="mt-6 min-h-28 rounded-2xl bg-slate-100 p-5 text-slate-700">
            {answer || "点击按钮后会从 /api/chat 接收模拟 token 流。"}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={uploadDocument} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">文档上传</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">上传文件后 API 会保存到 uploads/ 并推送索引任务。</p>
            <input
              name="file"
              type="file"
              className="mt-5 block w-full rounded-xl border border-dashed border-slate-300 p-4 text-sm"
              required
            />
            <button className="mt-4 w-full rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white hover:bg-orange-600">
              上传并入队
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">文档状态</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{message}</span>
            </div>
            <div className="mt-4 space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500">暂无上传文档。</p>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="truncate text-sm font-semibold">{document.filename}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{document.status}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
