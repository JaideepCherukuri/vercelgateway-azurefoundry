# Azure AI Foundry Gateway

Lightweight gateway for Azure AI Foundry models via OpenAI-compatible APIs.

## Working Models

| Model | Type | Status | API |
|-------|------|--------|-----|
| GPT-5.2-chat | Chat | ✅ Working | Chat Completions |
| Kimi-K2.5 | Chat | ✅ Working | Chat Completions |
| GPT-5.3-codex | Code | ✅ Working | Responses API |
| Sora-2 | Video | ✅ Working | Videos API |

## Known Issues

**FLUX.2-pro** (Image generation) returns 500 errors via REST API. This is an Azure infrastructure limitation — the model is deployed but the endpoint is not accessible programmatically.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API key
```

## Usage

```bash
python3 test_working_models.py
```

## License

MIT
