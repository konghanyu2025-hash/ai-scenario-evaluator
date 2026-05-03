import type { Confidence, ProviderConfig } from "./types";

export function createId(prefix = "id"): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 5)}${"*".repeat(Math.min(12, value.length - 9))}${value.slice(-4)}`;
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/([A-Za-z0-9_-]{8,})/g, (match) => {
    if (match.startsWith("sk-") || match.length > 24) return maskSecret(match);
    return match;
  });
}

export function estimateTokens(text: string): number {
  const asciiWords = text.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const cjkChars = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const punctuation = text.match(/[^\sA-Za-z0-9_\u3400-\u9fff]/g)?.length ?? 0;
  return Math.max(1, Math.ceil(asciiWords * 1.3 + cjkChars * 0.7 + punctuation * 0.25));
}

export function normalizeProviderConfig(config: ProviderConfig, index = 0): ProviderConfig {
  const provider = config.provider || "openai-compatible";
  const model = config.model || "unknown-model";
  return {
    ...config,
    id: config.id || `${provider}_${model}_${index}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
    name: config.name || `${provider}:${model}`,
    provider,
    model,
    temperature: config.temperature ?? 0.2,
    maxTokens: config.maxTokens ?? 1200,
    weight: config.weight ?? 1
  };
}

export function resolveEnvConfig(config: ProviderConfig): ProviderConfig {
  if (config.apiKey || !config.apiKeyEnv) return normalizeProviderConfig(config);
  return normalizeProviderConfig({
    ...config,
    apiKey: process.env[config.apiKeyEnv]
  });
}

export function parseMaybeJson<T>(text: string): T | undefined {
  const direct = safeJsonParse<T>(text);
  if (direct) return direct;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return safeJsonParse<T>(fenced[1]);

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safeJsonParse<T>(text.slice(firstBrace, lastBrace + 1));
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return safeJsonParse<T>(text.slice(firstBracket, lastBracket + 1));
  }

  return undefined;
}

function safeJsonParse<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

export function confidenceRank(confidence: Confidence): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

export function confidenceFromScore(value: number): Confidence {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  return "low";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
