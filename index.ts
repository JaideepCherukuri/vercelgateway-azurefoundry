/**
 * Vercel AI SDK v6 + Azure AI Foundry — Starter Kit
 * ===================================================
 *
 * Single-file test connecting Azure AI Foundry models to the Vercel AI SDK.
 *
 * Three provider approaches demonstrated:
 *   1. @quail-ai/azure-ai-provider  — purpose-built for Azure AI Foundry
 *   2. @ai-sdk/openai               — official OpenAI provider (works via custom headers)
 *   3. @ai-sdk/openai-compatible     — generic OpenAI-compatible wrapper
 *
 * Usage:
 *   cp .env.example .env   # fill in your Azure details
 *   bun run index.ts       # or: npx tsx index.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { createAzure } from "@quail-ai/azure-ai-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

// ─── Config ──────────────────────────────────────────────────────────
const AZURE_ENDPOINT = process.env.AZURE_API_ENDPOINT!;
const AZURE_API_KEY = process.env.AZURE_API_KEY!;
const MODEL_GPT = process.env.AZURE_MODEL_GPT || "gpt-4o";
const MODEL_ALT = process.env.AZURE_MODEL_ALT || "";

if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
  console.error(
    "❌  Missing AZURE_API_ENDPOINT or AZURE_API_KEY — copy .env.example → .env and fill in your values."
  );
  process.exit(1);
}

// ─── Provider 1: @quail-ai/azure-ai-provider (recommended) ──────────
//     Purpose-built for Azure AI Foundry's /models endpoint.
//     Handles api-key header and Azure-specific response format.
const azureFoundry = createAzure({
  endpoint: AZURE_ENDPOINT,
  apiKey: AZURE_API_KEY,
});

// ─── Provider 2: @ai-sdk/openai (best for tool calling) ─────────────
//     Official OpenAI provider with custom headers for Azure auth.
//     Full tool calling + structured output support.
const azureViaOpenAI = createOpenAI({
  baseURL: AZURE_ENDPOINT,
  apiKey: "unused", // overridden by headers
  headers: { "api-key": AZURE_API_KEY },
});

// ─── Provider 3: @ai-sdk/openai-compatible (alternative) ────────────
//     Generic OpenAI-compatible wrapper with custom headers.
const azureOpenAICompat = createOpenAICompatible({
  name: "azure-foundry",
  baseURL: AZURE_ENDPOINT,
  headers: { "api-key": AZURE_API_KEY },
});

// ─── Utilities ───────────────────────────────────────────────────────
function divider(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}\n`);
}

async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<boolean> {
  try {
    divider(name);
    await fn();
    console.log(`\n✅  ${name} — PASSED`);
    return true;
  } catch (err: any) {
    console.error(`\n❌  ${name} — FAILED`);
    console.error(`    ${err.message || err}`);
    if (err.cause) console.error(`    Cause:`, err.cause);
    return false;
  }
}

// ─── Test 1: Basic Text Generation (Foundry Provider) ───────────────
async function testGenerateText() {
  const { text, usage } = await generateText({
    model: azureFoundry(MODEL_GPT),
    prompt: "Explain what Azure AI Foundry is in 2 sentences.",
  });

  console.log("Provider: @quail-ai/azure-ai-provider");
  console.log("Model:", MODEL_GPT);
  console.log("Response:", text);
  if (usage) {
    console.log("Tokens:", JSON.stringify(usage));
  }
}

// ─── Test 2: Streaming (Foundry Provider) ────────────────────────────
async function testStreamText() {
  const result = streamText({
    model: azureFoundry(MODEL_GPT),
    prompt: "Write a haiku about cloud computing.",
  });

  process.stdout.write("Streamed: ");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  console.log(); // newline
}

// ─── Test 3: Multi-turn Conversation ─────────────────────────────────
async function testConversation() {
  const { text } = await generateText({
    model: azureFoundry(MODEL_GPT),
    messages: [
      { role: "system", content: "You are a helpful AI assistant. Be concise." },
      { role: "user", content: "What is the Vercel AI SDK?" },
      {
        role: "assistant",
        content:
          "The Vercel AI SDK is a TypeScript toolkit for building AI-powered apps with React, Next.js, and other frameworks.",
      },
      {
        role: "user",
        content: "How does it connect to Azure AI Foundry? Reply in 2-3 sentences.",
      },
    ],
  });

  console.log("Multi-turn response:", text);
}

// ─── Test 4: Tool Calling (via @ai-sdk/openai) ──────────────────────
//     Uses the OpenAI provider for best tool calling compatibility.
//     AI SDK v6 uses `inputSchema` (not `parameters`) and
//     `stopWhen: stepCountIs(n)` (not `maxSteps`).
async function testToolCalling() {
  const result = await generateText({
    model: azureViaOpenAI.chat(MODEL_GPT),
    prompt: "What's the weather in San Francisco and Tokyo?",
    tools: {
      getWeather: tool({
        description: "Get the current weather for a location.",
        inputSchema: z.object({
          location: z.string().describe("City name"),
          unit: z
            .enum(["celsius", "fahrenheit"])
            .optional()
            .describe("Temperature unit"),
        }),
        execute: async ({ location, unit }) => {
          // Simulated weather API
          const temps: Record<string, number> = {
            "san francisco": 18,
            tokyo: 22,
            london: 12,
          };
          const temp = temps[location.toLowerCase()] ?? 20;
          const displayUnit = unit === "fahrenheit" ? "°F" : "°C";
          const displayTemp =
            unit === "fahrenheit" ? Math.round(temp * 1.8 + 32) : temp;
          return `${location}: ${displayTemp}${displayUnit}, partly cloudy`;
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  console.log("Provider: @ai-sdk/openai (custom headers)");
  console.log("Final text:", result.text);
  console.log(
    "Tool calls made:",
    result.steps.flatMap((s) =>
      s.toolCalls.map(
        (tc) => `${tc.toolName}(${JSON.stringify(tc.args)})`
      )
    )
  );
}

// ─── Test 5: OpenAI-Compatible Provider ──────────────────────────────
async function testOpenAICompatProvider() {
  const { text } = await generateText({
    model: azureOpenAICompat.chatModel(MODEL_GPT),
    prompt: "Say 'hello from OpenAI-compatible provider' and nothing else.",
  });

  console.log("Provider: @ai-sdk/openai-compatible");
  console.log("Response:", text);
}

// ─── Test 6: Alternative Model (e.g. Kimi-K2.5) ─────────────────────
async function testAlternativeModel() {
  if (!MODEL_ALT) {
    console.log("⏭️  Skipped — AZURE_MODEL_ALT not set in .env");
    return;
  }

  const { text } = await generateText({
    model: azureFoundry(MODEL_ALT),
    prompt: "What model are you? Reply in one sentence.",
  });

  console.log(`Model: ${MODEL_ALT}`);
  console.log("Response:", text);
}

// ─── Run All Tests ───────────────────────────────────────────────────
async function main() {
  console.log("🚀 Vercel AI SDK v6 + Azure AI Foundry — Starter Kit\n");
  console.log("Endpoint:", AZURE_ENDPOINT);
  console.log("Primary model:", MODEL_GPT);
  console.log("Alternative model:", MODEL_ALT || "(not set)");

  const results: { name: string; passed: boolean }[] = [];

  const tests = [
    ["1. Generate Text (Foundry Provider)", testGenerateText],
    ["2. Stream Text (Foundry Provider)", testStreamText],
    ["3. Multi-turn Conversation", testConversation],
    ["4. Tool Calling (@ai-sdk/openai)", testToolCalling],
    ["5. OpenAI-Compatible Provider", testOpenAICompatProvider],
    ["6. Alternative Model", testAlternativeModel],
  ] as const;

  for (const [name, fn] of tests) {
    const passed = await runTest(name, fn);
    results.push({ name, passed });
  }

  // ─── Summary ─────────────────────────────────────────────────────
  divider("Summary");
  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"}  ${r.name}`);
  }
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n  ${passed}/${results.length} tests passed`);
}

main().catch(console.error);
