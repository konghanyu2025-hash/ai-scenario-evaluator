import {
  estimateTokens,
  sanitizeError,
  type GenerateInput,
  type GenerateOutput,
  type ModelProvider,
  type ProviderConfig
} from "@aise/shared";

export class GoogleProvider implements ModelProvider {
  id: string;
  name: string;
  private readonly baseURL: string;

  constructor(private readonly config: ProviderConfig) {
    this.id = config.id || `google_${config.model}`;
    this.name = config.name || `Google:${config.model}`;
    this.baseURL = (config.baseURL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    if (!this.config.apiKey) throw new Error(`Missing API key for ${this.name}.`);
    const started = Date.now();
    const text = [input.system, input.prompt].filter(Boolean).join("\n\n");
    const model = this.config.model.startsWith("models/") ? this.config.model : `models/${this.config.model}`;

    const response = await fetch(
      `${this.baseURL}/${model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            temperature: input.temperature ?? this.config.temperature ?? 0.2,
            maxOutputTokens: input.maxTokens ?? this.config.maxTokens ?? 1200,
            responseMimeType: input.responseFormat === "json" ? "application/json" : "text/plain"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(sanitizeError(`Google returned ${response.status}: ${await response.text()}`));
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    return {
      text:
        json.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim() || "",
      inputTokens: json.usageMetadata?.promptTokenCount ?? estimateTokens(text),
      outputTokens: json.usageMetadata?.candidatesTokenCount,
      latencyMs: Date.now() - started,
      raw: json
    };
  }
}
