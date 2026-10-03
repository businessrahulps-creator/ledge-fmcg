import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";
import { createOpenAI } from "@ai-sdk/openai";

// Lovable AI Gateway (server-side key, never shipped to the browser).
const lovable = createOpenAI({
  baseURL: "https://ai.gateway.lovable.dev/v1",
  apiKey: process.env.LOVABLE_API_KEY ?? "",
});

const app = { url: process.env.E2E_BASE_URL ?? "http://localhost:8080" };

export default {
  tests: "tests/**/*.e2e.ts",
  agents: { default: { model: lovable.responses("openai/gpt-6-astra") } },
  targets: [
    { name: "computer", engine: web({ viewport: { width: 1280, height: 900 } }), app },
    { name: "phone", engine: web({ viewport: { width: 393, height: 800 } }), app },
  ],
  workers: 1,
} satisfies E2EConfig;
