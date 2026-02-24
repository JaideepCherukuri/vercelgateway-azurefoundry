# Vercel AI SDK + Azure AI Foundry — Starter Kit

Connect [Azure AI Foundry](https://ai.azure.com/) models to the [Vercel AI SDK](https://ai-sdk.dev/) in a single TypeScript file.

## What's Inside

| File | Description |
|---|---|
| `index.ts` | Single-file test covering 6 scenarios |
| `.env.example` | Environment variable template |
| `docs/azure-ai-foundry-provider.md` | Scraped reference docs |

### Tests Included (all passing ✅)

1. **Generate Text** — basic prompt → response via Foundry provider
2. **Stream Text** — real-time token streaming
3. **Multi-turn Conversation** — system + user + assistant message chain
4. **Tool Calling** — function calling with Zod schemas + multi-step execution
5. **OpenAI-Compatible Provider** — alternative approach using `@ai-sdk/openai-compatible`
6. **Alternative Model** — test non-OpenAI models (Kimi, DeepSeek, Llama, etc.)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- An Azure AI Foundry resource with deployed models

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/JaideepCherukuri/vercelgateway-azurefoundry.git
cd vercelgateway-azurefoundry

# 2. Install dependencies
bun install
# or: npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Azure details (see below)

# 4. Run
bun run index.ts
# or: npx tsx index.ts
```

### Environment Variables

```bash
# Your Azure AI Foundry endpoint — the full /models URL
AZURE_API_ENDPOINT=https://your-resource.services.ai.azure.com/models

# Your Azure API key (from Azure Portal → your AI resource → Keys)
AZURE_API_KEY=your-api-key-here

# Primary model deployment name
AZURE_MODEL_GPT=gpt-4o

# (Optional) Alternative model name
AZURE_MODEL_ALT=Kimi-K2.5
```

## How It Works

### Azure AI Foundry vs. Azure OpenAI Service

Azure has two AI hosting services with **different API formats**:

| | Azure OpenAI Service (old) | Azure AI Foundry (new) |
|---|---|---|
| Endpoint | `https://{resource}.openai.azure.com/openai/deployments/{model}/` | `https://{resource}.services.ai.azure.com/models` |
| Auth header | `api-key: ...` | `api-key: ...` |
| SDK package | `@ai-sdk/azure` | `@quail-ai/azure-ai-provider` |
| Models | OpenAI models only | OpenAI + open-source (Llama, Kimi, DeepSeek, etc.) |

This starter kit targets **Azure AI Foundry** (the new format).

### Three Provider Approaches

#### 1. `@quail-ai/azure-ai-provider` (Recommended for general use)

Purpose-built for Azure AI Foundry. Handles the `api-key` header and Azure-specific response format automatically.

```typescript
import { createAzure } from "@quail-ai/azure-ai-provider";
import { generateText } from "ai";

const azure = createAzure({
  endpoint: process.env.AZURE_API_ENDPOINT,
  apiKey: process.env.AZURE_API_KEY,
});

const { text } = await generateText({
  model: azure("gpt-4o"),
  prompt: "Hello from Azure AI Foundry!",
});
```

#### 2. `@ai-sdk/openai` (Best for tool calling)

Official OpenAI provider pointed at Azure's endpoint. Best compatibility for tool calling and structured outputs.

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

const azure = createOpenAI({
  baseURL: process.env.AZURE_API_ENDPOINT,
  apiKey: "unused",
  headers: { "api-key": process.env.AZURE_API_KEY },
});

const { text } = await generateText({
  model: azure.chat("gpt-4o"),
  prompt: "What's the weather?",
  tools: {
    getWeather: tool({
      description: "Get weather",
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => `${location}: 22°C`,
    }),
  },
  stopWhen: stepCountIs(5),
});
```

#### 3. `@ai-sdk/openai-compatible` (Alternative)

Generic wrapper — useful as a fallback or if you need more control over headers/URL.

```typescript
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const azure = createOpenAICompatible({
  name: "azure-foundry",
  baseURL: process.env.AZURE_API_ENDPOINT,
  headers: { "api-key": process.env.AZURE_API_KEY },
});

const { text } = await generateText({
  model: azure.chatModel("gpt-4o"),
  prompt: "Hello from OpenAI-compatible provider!",
});
```

## Compatibility Matrix

| Feature | `@quail-ai/azure-ai-provider` | `@ai-sdk/openai` | `@ai-sdk/openai-compatible` |
|---|---|---|---|
| Chat completions | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Tool calling | ✅ | ✅ (recommended) | ⚠️ Schema issues |
| Vision/images | ✅ | ✅ | ✅ |
| Embeddings | ⚠️ Untested | ✅ | ⚠️ Untested |
| Structured outputs | ⚠️ | ✅ | ⚠️ |
| Azure-specific errors | ✅ Parsed | ❌ Raw | ❌ Raw |

> **Tip:** Use `@quail-ai/azure-ai-provider` for general use and `@ai-sdk/openai` when you need tool calling.

## Troubleshooting

### Common errors

**`401 Unauthorized`**
- Check that your `AZURE_API_KEY` is correct
- Verify the key hasn't been rotated in Azure Portal

**`404 Not Found`**
- Ensure your endpoint URL ends with `/models` (not `/openai/deployments/`)
- Verify the model name matches your deployment exactly

**`429 Too Many Requests`**
- You've hit your Azure rate limit — wait and retry
- Consider increasing your TPM (tokens per minute) quota in Azure Portal

**Tool calling doesn't work**
- Not all models support function/tool calling. GPT models do, but some open-source models may not.
- Try the same prompt without tools to confirm the model itself works.

## AI SDK v6 Notes

This starter kit uses **AI SDK v6** which has important changes from v4/v5:

- **`inputSchema`** replaces `parameters` in tool definitions
- **`stopWhen: stepCountIs(n)`** replaces `maxSteps` for multi-step tool execution
- **Zod v4** is required (v3 is incompatible with AI SDK v6)

## Tech Stack

- [Vercel AI SDK](https://ai-sdk.dev/) v6 — unified LLM interface
- [@quail-ai/azure-ai-provider](https://www.npmjs.com/package/@quail-ai/azure-ai-provider) v2 — Azure AI Foundry provider
- [@ai-sdk/openai](https://www.npmjs.com/package/@ai-sdk/openai) — official OpenAI provider (used for tool calling)
- [@ai-sdk/openai-compatible](https://www.npmjs.com/package/@ai-sdk/openai-compatible) — generic OpenAI-compatible provider
- [Bun](https://bun.sh/) — fast TypeScript runtime
- [Zod](https://zod.dev/) v4 — schema validation for tool parameters

## License

MIT
