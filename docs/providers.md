# Providers

All model providers implement the shared `ModelProvider` interface.

```ts
interface ModelProvider {
  id: string
  name: string
  generate(input: GenerateInput): Promise<GenerateOutput>
}
```

## Supported Presets

- `mock`: deterministic local responses for demos and tests.
- `openai-compatible`: `/v1/chat/completions` compatible services.
- `custom-openai-compatible`: recommended relay preset.
- `openai`: OpenAI-compatible OpenAI endpoint.
- `anthropic`: Anthropic Messages API.
- `google`: Google Generative Language API.
- `ollama`: local Ollama server.

## Recommended Relay

Set:

```txt
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

This appears in the web UI as a preset. Users still provide their own API key.
