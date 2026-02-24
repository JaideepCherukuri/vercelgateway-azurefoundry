# Azure AI Foundry Provider — Reference Docs

> Scraped & adapted from [ai-sdk.dev/providers/community-providers/azure-ai](https://ai-sdk.dev/providers/community-providers/azure-ai)
> and [@quail-ai/azure-ai-provider on npm](https://www.npmjs.com/package/@quail-ai/azure-ai-provider)

## Overview

The **@quail-ai/azure-ai-provider** enables integration with Azure-hosted language models
that use Azure's native APIs (Azure AI Foundry) instead of the standard OpenAI API format.

**Important:** This provider is _not_ compatible with Azure OpenAI Service models.
For those, use the official `@ai-sdk/azure` provider.

## Status

| Feature | Status |
|---------|--------|
| Chat Completions | ✅ Working (streaming + non-streaming) |
| Vision/Images | ✅ Working with compatible models |
| Tool Calling | ⚠️ Model-dependent |
| Embeddings | ⚠️ Untested |

## Models Tested

- GPT-4o, GPT-5.2-chat (OpenAI on Azure)
- DeepSeek-R1
- LLama 3.3-70B Instruct
- Cohere-command-r-08-2024
- Kimi-K2.5

## Installation

```bash
npm i @quail-ai/azure-ai-provider
# or
bun add @quail-ai/azure-ai-provider
```

## Environment Variables

```bash
# .env
AZURE_API_ENDPOINT=https://<your-resource>.services.ai.azure.com/models
AZURE_API_KEY=<your-api-key>
```

## Provider Setup

```typescript
import { createAzure } from '@quail-ai/azure-ai-provider';

const azure = createAzure({
  endpoint: process.env.AZURE_API_ENDPOINT,   // Full /models URL
  apiKey: process.env.AZURE_API_KEY,
});
```

### Configuration Options

```typescript
const azure = createAzure({
  endpoint: "https://your-endpoint.services.ai.azure.com/models",
  apiKey: "your-key",
  apiVersion: "2024-02-15-preview",  // Optional — API version override
});
```

## Usage Examples

### Generate Text

```typescript
import { generateText } from 'ai';

const { text } = await generateText({
  model: azure('gpt-4o'),
  prompt: 'Write a story about a robot.',
});
console.log(text);
```

### Stream Text

```typescript
import { streamText } from 'ai';

const result = streamText({
  model: azure('gpt-4o'),
  prompt: 'Write a poem about clouds.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Multi-turn Conversation

```typescript
import { generateText } from 'ai';

const { text } = await generateText({
  model: azure('gpt-4o'),
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is Azure AI Foundry?' },
    { role: 'assistant', content: 'Azure AI Foundry is...' },
    { role: 'user', content: 'How do I deploy a model?' },
  ],
});
```

### Tool Calling

```typescript
import { generateText } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: azure('gpt-4o'),
  messages: [{ role: 'user', content: "What's the weather?" }],
  tools: {
    get_weather: {
      description: 'Get weather for a location',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return `Weather in ${location}: Sunny, 22°C`;
      },
    },
  },
  maxSteps: 3,
});
```

### Streaming with Smooth Output

```typescript
import { streamText, smoothStream } from 'ai';

const result = streamText({
  model: azure('gpt-4o'),
  prompt: 'Tell me about quantum computing.',
  experimental_transform: smoothStream(),
});
```

## Azure AI Foundry Endpoint Format

The new Azure AI Foundry uses a unified `/models` endpoint:

```
https://<resource-name>.services.ai.azure.com/models
```

This is different from the old Azure OpenAI Service format:

```
https://<resource-name>.openai.azure.com/openai/deployments/<model>/
```

### Authentication

Azure AI Foundry uses the `api-key` header (not `Authorization: Bearer`):

```
POST https://<resource>.services.ai.azure.com/models/chat/completions
api-key: <your-key>
Content-Type: application/json

{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "Hello"}]
}
```

## Alternative: @ai-sdk/openai-compatible

If the community provider doesn't support a feature you need, you can use the
generic `@ai-sdk/openai-compatible` package:

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const azure = createOpenAICompatible({
  name: 'azure-foundry',
  baseURL: process.env.AZURE_API_ENDPOINT,
  headers: {
    'api-key': process.env.AZURE_API_KEY,
  },
});

const { text } = await generateText({
  model: azure.chatModel('gpt-4o'),
  prompt: 'Hello!',
});
```

## Useful Links

- [Vercel AI SDK Docs](https://ai-sdk.dev/)
- [Azure AI Foundry Docs](https://learn.microsoft.com/azure/ai-studio/)
- [Community Provider Page](https://ai-sdk.dev/providers/community-providers/azure-ai)
- [npm: @quail-ai/azure-ai-provider](https://www.npmjs.com/package/@quail-ai/azure-ai-provider)
- [GitHub: Quail-AI/azure-ai-provider](https://github.com/Quail-AI/azure-ai-provider)
