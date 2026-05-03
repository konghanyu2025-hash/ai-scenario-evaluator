import { normalizeProviderConfig, type ModelProvider, type ProviderConfig } from "@aise/shared";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { MockProvider } from "./mock-provider";
import { OllamaProvider } from "./ollama";
import { OpenAICompatibleProvider } from "./openai-compatible";

export function createProvider(config: ProviderConfig): ModelProvider {
  const normalized = normalizeProviderConfig(config);

  switch (normalized.provider) {
    case "mock":
      return new MockProvider(normalized);
    case "anthropic":
      return new AnthropicProvider(normalized);
    case "google":
      return new GoogleProvider(normalized);
    case "ollama":
      return new OllamaProvider(normalized);
    case "openai":
      return new OpenAICompatibleProvider({
        ...normalized,
        baseURL: normalized.baseURL || "https://api.openai.com/v1"
      });
    case "openai-compatible":
    case "custom-openai-compatible":
    default:
      return new OpenAICompatibleProvider(normalized);
  }
}
