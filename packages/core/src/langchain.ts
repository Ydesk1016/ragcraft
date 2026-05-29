import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";

const langChainEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(["openai", "ollama"]).default("openai"),
  LLM_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OLLAMA_LLM_MODEL: z.string().min(1).default("llama3"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  EMBEDDING_PROVIDER: z.enum(["openai", "local-ollama"]).default("openai"),
  EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  OLLAMA_EMBEDDING_MODEL: z.string().min(1).default("nomic-embed-text")
});

type LangChainEnv = Record<string, string | undefined>;

export type LangChainConfig = ReturnType<typeof getLangChainConfig>;

export function getLangChainConfig(env: LangChainEnv = process.env) {
  const values = langChainEnvSchema.parse(env);

  return {
    openAIApiKey: values.OPENAI_API_KEY,
    ollamaBaseUrl: values.OLLAMA_BASE_URL,
    llm: {
      provider: values.LLM_PROVIDER,
      model: values.LLM_PROVIDER === "ollama" ? values.OLLAMA_LLM_MODEL : values.LLM_MODEL
    },
    embedding: {
      provider: values.EMBEDDING_PROVIDER,
      model:
        values.EMBEDDING_PROVIDER === "local-ollama"
          ? values.OLLAMA_EMBEDDING_MODEL
          : values.EMBEDDING_MODEL
    }
  } as const;
}

export function createChatModel(config = getLangChainConfig()) {
  if (config.llm.provider === "ollama") {
    return new ChatOllama({
      baseUrl: config.ollamaBaseUrl,
      model: config.llm.model,
      temperature: 0
    });
  }

  return new ChatOpenAI({
    apiKey: requireOpenAIKey(config.openAIApiKey),
    model: config.llm.model,
    temperature: 0,
    streaming: true
  });
}

export function createEmbeddingModel(config = getLangChainConfig()) {
  if (config.embedding.provider === "local-ollama") {
    return new OllamaEmbeddings({
      baseUrl: config.ollamaBaseUrl,
      model: config.embedding.model
    });
  }

  return new OpenAIEmbeddings({
    apiKey: requireOpenAIKey(config.openAIApiKey),
    model: config.embedding.model
  });
}

function requireOpenAIKey(apiKey: string | undefined) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when using OpenAI models or embeddings");
  }

  return apiKey;
}
