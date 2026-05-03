import {
  estimateTokens,
  sanitizeError,
  type GenerateInput,
  type GenerateOutput,
  type ModelProvider,
  type ProviderConfig
} from "@aise/shared";

export class OllamaProvider implements ModelProvider {
  id: string;
  name: string;
  private readonly baseURL: string;

  constructor(private readonly config: ProviderConfig) {
    this.id = config.id || `ollama_${config.model}`;
    this.name = config.name || `Ollama:${config.model}`;
    this.baseURL = (config.baseURL || "http://127.0.0.1:11434").replace(/\/$/, "");
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const started = Date.now();
    const prompt = [input.system, input.prompt].filter(Boolean).join("\n\n");

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: false,
        options: {
          temperature: input.temperature ?? this.config.temperature ?? 0.2,
          num_predict: input.maxTokens ?? this.config.maxTokens ?? 1200
        }
      })
    });

    if (!response.ok) {
      throw new Error(sanitizeError(`Ollama returned ${response.status}: ${await response.text()}`));
    }

    const json = (await response.json()) as {
      response?: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      text: json.response?.trim() || "",
      inputTokens: json.prompt_eval_count ?? estimateTokens(prompt),
      outputTokens: json.eval_count ?? estimateTokens(json.response || ""),
      latencyMs: Date.now() - started,
      raw: json
    };
  }
}
