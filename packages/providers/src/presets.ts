import type { ProviderConfig } from "@aise/shared";

export type ProviderPreset = {
  id: string;
  name: string;
  provider: ProviderConfig["provider"];
  baseURL?: string;
  defaultModel: string;
  requiresApiKey: boolean;
  description: string;
};

export const recommendedRelayBaseURL =
  process.env.NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL || "https://your-relay.example.com/v1";

export const recommendedRelayName =
  process.env.NEXT_PUBLIC_RECOMMENDED_RELAY_NAME || "Recommended Relay";

export const providerPresets: ProviderPreset[] = [
  {
    id: "recommended-relay",
    name: recommendedRelayName,
    provider: "custom-openai-compatible",
    baseURL: recommendedRelayBaseURL,
    defaultModel: "gpt-4o-mini",
    requiresApiKey: true,
    description: "推荐中转服务预设，兼容 OpenAI Chat Completions 接口。"
  },
  {
    id: "openai-compatible",
    name: "OpenAI-compatible",
    provider: "openai-compatible",
    defaultModel: "gpt-4o-mini",
    requiresApiKey: true,
    description: "适用于任何兼容 /v1/chat/completions 的服务。"
  },
  {
    id: "openai",
    name: "OpenAI",
    provider: "openai",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    requiresApiKey: true,
    description: "OpenAI 官方接口预设。"
  },
  {
    id: "anthropic",
    name: "Anthropic",
    provider: "anthropic",
    baseURL: "https://api.anthropic.com",
    defaultModel: "claude-3-5-sonnet-latest",
    requiresApiKey: true,
    description: "Anthropic Messages API 预设。"
  },
  {
    id: "google",
    name: "Google Gemini",
    provider: "google",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
    requiresApiKey: true,
    description: "Google Generative Language API 预设。"
  },
  {
    id: "ollama",
    name: "Ollama",
    provider: "ollama",
    baseURL: "http://127.0.0.1:11434",
    defaultModel: "llama3.1",
    requiresApiKey: false,
    description: "本地 Ollama 模型服务。"
  },
  {
    id: "mock",
    name: "模拟模型",
    provider: "mock",
    defaultModel: "mock-balanced",
    requiresApiKey: false,
    description: "用于演示和测试的本地确定性模型。"
  }
];
