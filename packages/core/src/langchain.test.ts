import assert from "node:assert/strict";
import { test } from "node:test";
import { getLangChainConfig } from "./langchain.js";

test("uses OpenAI defaults when providers are not configured", () => {
  const config = getLangChainConfig({});

  assert.equal(config.llm.provider, "openai");
  assert.equal(config.llm.model, "gpt-4o-mini");
  assert.equal(config.embedding.provider, "openai");
  assert.equal(config.embedding.model, "text-embedding-3-small");
});

test("uses Ollama defaults when local providers are selected", () => {
  const config = getLangChainConfig({
    LLM_PROVIDER: "ollama",
    EMBEDDING_PROVIDER: "local-ollama"
  });

  assert.equal(config.llm.provider, "ollama");
  assert.equal(config.llm.model, "llama3");
  assert.equal(config.embedding.provider, "local-ollama");
  assert.equal(config.embedding.model, "nomic-embed-text");
  assert.equal(config.ollamaBaseUrl, "http://localhost:11434");
});

test("rejects unsupported providers", () => {
  assert.throws(
    () => getLangChainConfig({ LLM_PROVIDER: "bad-provider" }),
    /Invalid enum value/
  );
});
