# Vercel AI SDK + Azure AI Foundry — Complete Integration Guide

Connect [Azure AI Foundry](https://ai.azure.com/) models to the [Vercel AI SDK](https://ai-sdk.dev/) with unified endpoint configuration supporting **GPT-5.2**, **Kimi K2.5**, and **FLUX.2-pro** models.

## 🚀 What's Inside

This starter kit provides comprehensive testing and integration for all three models:

| **Model** | **Type** | **Capabilities** |
|-----------|----------|------------------|
| **GPT-5.2** | Text | Advanced text generation, conversation, tool calling |
| **Kimi K2.5** | Text | High-quality text generation, streaming support |
| **FLUX.2-pro** | Image | High-quality image generation |

### ✅ Tests Included (all passing)

1. **Endpoint Validation** — verify configuration and connectivity
2. **GPT-5.2 Text Generation** — basic prompt → response
3. **Kimi K2.5 Text Generation** — alternative text model testing
4. **Multi-turn Conversation** — system + user + assistant message chain
5. **Tool Calling** — function calling with Zod schemas (GPT-5.2)
6. **FLUX.2-pro Image Generation** — text-to-image with base64 output
7. **Streaming** — real-time token streaming (Kimi K2.5)
8. **Cross-Provider Compatibility** — verify unified endpoint works across models

## ⚡ Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Azure AI Foundry resource with **GPT-5.2**, **Kimi K2.5**, and **FLUX.2-pro** deployed

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
# Edit .env with your Azure details (see configuration below)

# 4. Run comprehensive test suite
bun run index.ts
# or: npx tsx index.ts
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Unified endpoint URL for all models (text and image)
AZURE_API_ENDPOINT=https://jai-omi.openai.azure.com/openai/v1/
AZURE_API_KEY=your-azure-api-key-here

# Model deployment names (must match your Azure AI Foundry deployments exactly)
AZURE_MODEL_GPT=gpt-5.2
AZURE_MODEL_KIMI=Kimi-K2.5
AZURE_MODEL_FLUX=FLUX.2-pro

# Image generation endpoint (same as text endpoint)
FLUX_ENDPOINT=https://jai-omi.openai.azure.com/openai/v1/

# Optional: Alternative model for testing
AZURE_MODEL_ALT=
```

### 🔑 Key Configuration Notes

- **✅ Unified Endpoint**: All three models use the same base URL
- **✅ Single API Key**: Works across all model deployments
- **✅ Model Names**: Must match Azure AI Foundry deployment names exactly
- **✅ Authentication**: Uses `api-key` header format

## 🏗️ Architecture Overview

### Provider Approaches

This starter kit demonstrates **3 different provider approaches** for maximum compatibility:

#### 1. `@quail-ai/azure-ai-provider` (Recommended)
Purpose-built for Azure AI Foundry. Handles the `api-key` header and Azure-specific response format automatically.

```typescript
import { createAzure } from "@quail-ai/azure-ai-provider";

const azure = createAzure({
  endpoint: process.env.AZURE_API_ENDPOINT,
  apiKey: process.env.AZURE_API_KEY,
});

const { text } = await generateText({
  model: azure("gpt-5.2"),
  prompt: "Hello from Azure AI Foundry!",
});
```

#### 2. `@ai-sdk/openai` (Best for tool calling)
Official OpenAI provider pointed at Azure's endpoint. Best compatibility for tool calling and structured outputs.

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const azure = createOpenAI({
  baseURL: process.env.AZURE_API_ENDPOINT,
  apiKey: "unused",
  headers: { "api-key": process.env.AZURE_API_KEY },
});

const { text } = await generateText({
  model: azure.chat("gpt-5.2"),
  prompt: "What's the weather?",
  tools: { /* tool definitions */ },
});
```

#### 3. `@ai-sdk/openai-compatible` (Alternative)
Generic wrapper — useful as a fallback or for custom configurations.

### Image Generation with FLUX.2-pro

FLUX.2-pro uses the same endpoint but requires direct OpenAI client configuration:

```typescript
import OpenAI from "openai";

const fluxClient = new OpenAI({
  baseURL: process.env.FLUX_ENDPOINT,
  apiKey: process.env.AZURE_API_KEY,
  defaultHeaders: { "api-key": process.env.AZURE_API_KEY }
});

const result = await fluxClient.images.generate({
  model: "FLUX.2-pro",
  prompt: "A cute baby polar bear in the snow",
  response_format: "b64_json"
});
```

## 📊 Compatibility Matrix

| **Feature** | **GPT-5.2** | **Kimi K2.5** | **FLUX.2-pro** |
|------------|------------|---------------|----------------|
| Text generation | ✅ | ✅ | ❌ |
| Streaming | ✅ | ✅ | ❌ |
| Tool calling | ✅ | ⚠️ Limited | ❌ |
| Multi-turn conversation | ✅ | ✅ | ❌ |
| Image generation | ❌ | ❌ | ✅ |
| Unified endpoint | ✅ | ✅ | ✅ |

## 🛠️ Troubleshooting

### Common Issues

**`401 Unauthorized`**
- Verify your `AZURE_API_KEY` is correct
- Check the key hasn't been rotated in Azure Portal

**`404 Not Found`**
- Ensure endpoint URL is `https://jai-omi.openai.azure.com/openai/v1/`
- Verify model deployment names match exactly:
  - `gpt-5.2` (not `GPT-5.2`)
  - `Kimi-K2.5` (exact case)
  - `FLUX.2-pro` (exact case with dot)

**`429 Too Many Requests`**
- Hit Azure rate limit — wait and retry
- Consider increasing TPM (tokens per minute) quota in Azure Portal

**Tool calling doesn't work**
- Use GPT-5.2 for tool calling (Kimi K2.5 has limited support)
- Try the same prompt without tools to confirm the model works

**FLUX.2-pro image generation fails**
- Verify the model deployment name is exactly `FLUX.2-pro`
- Check your endpoint allows image generation requests
- Ensure you have sufficient quota for image generation

## 📦 Tech Stack

- **[Vercel AI SDK](https://ai-sdk.dev/) v6** — unified LLM interface
- **[@quail-ai/azure-ai-provider](https://www.npmjs.com/package/@quail-ai/azure-ai-provider)** — Azure AI Foundry provider
- **[@ai-sdk/openai](https://www.npmjs.com/package/@ai-sdk/openai)** — official OpenAI provider (for tool calling)
- **[@ai-sdk/openai-compatible](https://www.npmjs.com/package/@ai-sdk/openai-compatible)** — generic OpenAI-compatible provider
- **[OpenAI](https://www.npmjs.com/package/openai)** — direct client for FLUX.2-pro image generation
- **[Bun](https://bun.sh/)** — fast TypeScript runtime
- **[Zod](https://zod.dev/) v4** — schema validation for tool parameters

## 🎯 Example Usage

### Text Generation (GPT-5.2)
```typescript
const { text } = await generateText({
  model: azure("gpt-5.2"),
  prompt: "Explain quantum computing in simple terms"
});
```

### Alternative Model (Kimi K2.5)
```typescript
const { text } = await generateText({
  model: azure("Kimi-K2.5"),
  prompt: "Write a creative story about AI"
});
```

### Image Generation (FLUX.2-pro)
```typescript
const result = await fluxClient.images.generate({
  model: "FLUX.2-pro",
  prompt: "A futuristic city at sunset, digital art",
  response_format: "b64_json"
});

const imageBuffer = Buffer.from(result.data[0].b64_json, "base64");
fs.writeFileSync("output.png", imageBuffer);
```

## 📝 License

MIT

---

## 💡 Next Steps

- Explore tool calling with GPT-5.2
- Test streaming capabilities with Kimi K2.5  
- Generate creative images with FLUX.2-pro
- Build multi-modal applications combining all three models