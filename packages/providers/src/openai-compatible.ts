import {
  estimateTokens,
  maskSecret,
  sanitizeError,
  type GenerateInput,
  type GenerateMessage,
  type GenerateOutput,
  type ModelProvider,
  type ProviderConfig
} from "@aise/shared";

export class OpenAICompatibleProvider implements ModelProvider {
  id: string;
  name: string;
  private readonly baseURL: string;

  constructor(private readonly config: ProviderConfig) {
    this.id = config.id || `${config.provider}_${config.model}`;
    this.name = config.name || `${config.provider}:${config.model}`;
    this.baseURL = normalizeBaseURL(config.baseURL || "https://api.openai.com/v1");
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    if (!this.config.apiKey) {
      throw new Error(`Missing API key for ${this.name}.`);
    }

    const started = Date.now();
    const messages = buildMessages(input);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: input.temperature ?? this.config.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? this.config.maxTokens ?? 1200,
        response_format: input.responseFormat === "json" ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        sanitizeError(
          `Provider ${this.name} returned ${response.status}: ${body}. Key=${maskSecret(
            this.config.apiKey
          )}`
        )
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: json.choices?.[0]?.message?.content?.trim() || "",
      inputTokens: json.usage?.prompt_tokens ?? estimateTokens(messages.map((m) => m.content).join("\n")),
      outputTokens: json.usage?.completion_tokens,
      latencyMs: Date.now() - started,
      raw: json
    };
  }
}

function buildMessages(input: GenerateInput): GenerateMessage[] {
  if (input.messages?.length) return input.messages;
  const messages: GenerateMessage[] = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });
  return messages;
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/$/, "");
}
