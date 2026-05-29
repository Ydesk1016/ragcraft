import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: process.env.LLM_MODEL || "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0.9,
  maxTokens: 5000,
  timeout: 60_000,
});

async function test() {
  const response = await model.invoke([
    {
      role: "user",
      content: "介绍下电影《罗小黑战记2》，以JSON格式返回，包含字段：title(电影名称)、year(上映年份)、director(导演)、rating(豆瓣评分)",
    },
  ]);
  console.log(typeof response.content);
  console.log(response.content);
}

test();