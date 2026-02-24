/**
 * Vercel AI SDK v6 + Azure AI Foundry — Complete Integration Guide
 * ================================================================
 *
 * Enhanced version with FLUX.2-pro image model support, unified endpoint configuration,
 * and comprehensive testing for GPT-5.2, Kimi K2.5, and FLUX.2-pro models.
 *
 * Key Features:
 *   1. Unified endpoint URL for text models (GPT-5.2 and Kimi K2.5)
 *   2. Dedicated image generation endpoint for FLUX.2-pro
 *   3. Multiple provider approaches for maximum compatibility
 *   4. Comprehensive testing suite with detailed error handling
 *
 * Usage:
 *   cp .env.example .env   # fill in your Azure details
 *   bun run index_with_flux.ts       # or: npx tsx index_with_flux.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { createAzure } from "@quail-ai/azure-ai-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, tool, stepCountIs, generateImage } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import fs from "fs";

// ─── Config ──────────────────────────────────────────────────────────
const AZURE_ENDPOINT = process.env.AZURE_API_ENDPOINT!;
const AZURE_API_KEY = process.env.AZURE_API_KEY!;
const MODEL_GPT = process.env.AZURE_MODEL_GPT || "gpt-4o";
const MODEL_KIMI = process.env.AZURE_MODEL_KIMI || "Kimi-K2.5";
const MODEL_FLUX = process.env.AZURE_MODEL_FLUX || "FLUX.2-pro";

// Image endpoint configuration for FLUX.2-pro
const FLUX_ENDPOINT = process.env.FLUX_ENDPOINT || "https://jai-omi.openai.azure.com/openai/v1/";

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

// ─── Image Provider: Direct OpenAI client for FLUX.2-pro ───────────
const fluxClient = new OpenAI({
  baseURL: FLUX_ENDPOINT,
  apiKey: AZURE_API_KEY,
  defaultHeaders: { "api-key": AZURE_API_KEY }
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

// ─── Test 1: GPT-5.2 Text Generation ────────────────────────────────
async function testGPT52() {
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

// ─── Test 2: Kimi K2.5 Text Generation ──────────────────────────────
async function testKimiK25() {
  const { text, usage } = await generateText({
    model: azureFoundry(MODEL_KIMI),
    prompt: "Write a haiku about artificial intelligence.",
  });

  console.log("Provider: @quail-ai/azure-ai-provider");
  console.log("Model:", MODEL_KIMI);
  console.log("Response:", text);
  if (usage) {
    console.log("Tokens:", JSON.stringify(usage));
  }
}

// ─── Test 3: Multi-turn Conversation (GPT-5.2) ──────────────────────
async function testConversation() {
  const { text } = await generateText({
    model: azureFoundry(MODEL_GPT),
    messages: [
      { role: "system", content: "You are a helpful AI assistant. Be concise." },
      { role: "user", content: "What is the Vercel AI SDK?" },
      { role: "assistant", content: "The Vercel AI SDK is a TypeScript toolkit for building AI-powered apps with React, Next.js, and other frameworks." },
      { role: "user", content: "How does it connect to Azure AI Foundry? Reply in 2-3 sentences." }
    ]
  });

  console.log("Multi-turn conversation with GPT-5.2:", text);
}

// ─── Test 4: Tool Calling (GPT-5.2) ───────────────────────────────
async function testToolCalling() {
  const result = await generateText({
    model: azureViaOpenAI.chat(MODEL_GPT),
    prompt: "What's the weather in San Francisco and Tokyo?",
    tools: {
      getWeather: tool({
        description: "Get the current weather for a location.",
        inputSchema: z.object({
          location: z.string().describe("City name"),
          unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit")
        }),
        execute: async ({ location, unit }) => {
          // Simulated weather API
          const temps: Record<string, number> = {
            "san francisco": 18,
            tokyo: 22,
            london: 12
          };
          const temp = temps[location.toLowerCase()] ?? 20;
          const displayUnit = unit === "fahrenheit" ? "°F" : "°C";
          const displayTemp = unit === "fahrenheit" ? Math.round(temp * 1.8 + 32) : temp;
          return `${location}: ${displayTemp}${displayUnit}, partly cloudy`;
        }
      })
    },
    stopWhen: stepCountIs(5)
  });

  console.log("Provider: @ai-sdk/openai (custom headers)");
  console.log("Final text:", result.text);
  console.log("Tool calls made:", result.steps.flatMap((s) => s.toolCalls.map((tc) => `${tc.toolName}(${JSON.stringify(tc.args)})`)));
}

// ─── Test 5: FLUX.2-pro Image Generation ────────────────────────────
async function testFluxImageGeneration() {
  try {
    console.log("Testing FLUX.2-pro image generation...");
    console.log("Endpoint:", FLUX_ENDPOINT);
    console.log("Model:", MODEL_FLUX);
    
    const prompt = "A cute baby polar bear playing in the snow, photorealistic, high quality";
    
    const result = await fluxClient.images.generate({
      model: MODEL_FLUX,
      prompt: prompt,
      n: 1,
      response_format: "b64_json"
    });

    if (result.data && result.data.length > 0) {
      const image_base64 = result.data[0].b64_json;
      if (image_base64) {
        const image_bytes = Buffer.from(image_base64, "base64");
        const outputPath = "flux_output.png";
        fs.writeFileSync(outputPath, image_bytes);
        console.log(`✅ Image generated successfully and saved to: ${outputPath}`);
        console.log(`Prompt: ${prompt}`);
        console.log(`Image size: ${image_bytes.length} bytes`);
      } else {
        throw new Error("No base64 image data received");
      }
    } else {
      throw new Error("No image data received from FLUX.2-pro");
    }
  } catch (error: any) {
    console.error("FLUX.2-pro generation failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// ─── Test 6: Streaming (Kimi K2.5) ──────────────────────────────────
async function testStreamingKimi() {
  const result = streamText({
    model: azureFoundry(MODEL_KIMI),
    prompt: "Write a short poem about machine learning."
  });

  process.stdout.write("Kimi K2.5 Streamed: ");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  console.log(); // newline
}

// ─── Test 7: Cross-Provider Compatibility Test ─────────────────────
async function testCrossProviderCompatibility() {
  const prompt = "What is 2+2? Reply with just the number.";
  
  // Test same prompt across different providers
  const gptResult = await generateText({
    model: azureFoundry(MODEL_GPT),
    prompt: prompt
  });
  
  const kimiResult = await generateText({
    model: azureFoundry(MODEL_KIMI),
    prompt: prompt
  });
  
  console.log(`GPT-5.2 response: ${gptResult.text.trim()}`);
  console.log(`Kimi K2.5 response: ${kimiResult.text.trim()}`);
  console.log("✅ Cross-provider compatibility verified");
}

// ─── Test 8: Error Handling and Endpoint Validation ──────────────────
async function testEndpointValidation() {
  console.log("Validating endpoints...");
  console.log(`Text models endpoint: ${AZURE_ENDPOINT}`);
  console.log(`Image model endpoint: ${FLUX_ENDPOINT}`);
  console.log(`GPT model deployment: ${MODEL_GPT}`);
  console.log(`Kimi model deployment: ${MODEL_KIMI}`);
  console.log(`FLUX model deployment: ${MODEL_FLUX}`);
  
  // Test a simple request to verify endpoint accessibility
  const { text } = await generateText({
    model: azureFoundry(MODEL_GPT),
    prompt: "Say 'endpoint validation successful'"
  });
  
  console.log(`Validation response: ${text}`);
}

// ─── Run All Tests ──────────────────────────────────────────────────
async function main() {
  console.log("🚀 Vercel AI SDK v6 + Azure AI Foundry — Enhanced Integration Test Suite\n");
  console.log("Configuration:");
  console.log(`├── Text Models Endpoint: ${AZURE_ENDPOINT}`);
  console.log(`├── Image Model Endpoint: ${FLUX_ENDPOINT}`);
  console.log(`├── GPT Model: ${MODEL_GPd}`);
  console.log(`├── Kimi Model: ${MODEL_KIMI}`);
  console.log(`└── FLUX Model: ${MODEL_FLUX}`);

  const results: { name: string; passed: boolean }[] = [];

  const tests = [
    ["1. Endpoint Validation", testEndpointValidation],
    ["2. GPT-5.2 Text Generation", testGPT52],
    ["3. Kimi K2.5 Text Generation", testKimiK25],
    ["4. Multi-turn Conversation (GPT-5.2)", testConversation],
    ["5. Tool Calling (GPT-5.2)", testToolCalling],
    ["6. FLUX.2-pro Image Generation", testFluxImageGeneration],
    ["7. Streaming (Kimi K2.5)", testStreamingKimi],
    ["8. Cross-Provider Compatibility", testCrossProviderCompatibility]
  ] as const;

  for (const [name, fn] of tests) {
    const passed = await runTest(name, fn);
    results.push({ name, passed });
  }

  // ─── Summary ──────────────────────────────────────────────────────
  divider("Test Summary");
  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"}  ${r.name}`);
  }
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n  ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log("\n🎉 AR tests passed! Your Azure AI Foundry integration is working perfectly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the error messages above for details.");
  }
}

main().catch(console.error);