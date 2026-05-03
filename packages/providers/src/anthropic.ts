import {
  estimateTokens,
  sanitizeError,
  type GenerateInput,
  type GenerateOutput,
  type ModelProvider,
  type ProviderConfig
} from "@aise/shared";

export class AnthropicProvider implements ModelProvider {
  id: string;
  name: string;
  private readonly baseURL: string;

  constructor(private readonly config: ProviderConfig) {
    this.id = config.id || `anthropic_${config.model}`;
    this.name = config.name || `Anthropic:${config.model}`;
    this.baseURL = (config.baseURL || "https://api.anthropic.com").replace(/\/$/, "");
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    if (!this.config.apiKey) throw new Error(`Missing API key for ${this.name}.`);
    const started = Date.now();
    const userText = input.messages?.map((message) => `${message.role}: ${message.content}`).join("\n") || input.prompt;

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.config.model,
        system: input.system,
        messages: [{ role: "user", content: userText }],
        max_tokens: input.maxTokens ?? this.config.maxTokens ?? 1200,
        temperature: input.temperature ?? this.config.temperature ?? 0.2
      })
    });

    if (!response.ok) {
      throw new Error(sanitizeError(`Anthropic returned ${response.status}: ${await response.text()}`));
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    return {
      text: json.content?.map((part) => part.text || "").join("").trim() || "",
      inputTokens: json.usage?.input_tokens ?? estimateTokens(userText),
      outputTokens: json.usage?.output_tokens,
      latencyMs: Date.now() - started,
      raw: json
    };
  }
}
