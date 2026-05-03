import {
  createId,
  estimateTokens,
  type GenerateInput,
  type GenerateOutput,
  type ModelProvider,
  type ProviderConfig
} from "@aise/shared";

export class MockProvider implements ModelProvider {
  id: string;
  name: string;

  constructor(private readonly config: ProviderConfig) {
    this.id = config.id || createId("mock");
    this.name = config.name || `Mock ${config.model}`;
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const started = Date.now();
    const prompt = input.messages?.map((message) => message.content).join("\n") || input.prompt;
    const text = this.isJudgePrompt(prompt)
      ? this.generateJudgeJson(prompt)
      : this.generateCandidateResponse(prompt);

    return {
      text,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(text),
      latencyMs: Math.max(1, Date.now() - started)
    };
  }

  private isJudgePrompt(prompt: string): boolean {
    return /dimensionScores|评分维度|Judge the model response|裁判/i.test(prompt);
  }

  private generateCandidateResponse(prompt: string): string {
    const model = this.config.model.toLowerCase();
    const isCreative = model.includes("creative");
    const isWeak = model.includes("weak");
    const isJson = /JSON|合法 json|valid json/i.test(prompt);

    if (isJson) {
      if (isWeak) return "{ answer: missing-quotes, next_step: none";
      return JSON.stringify(
        {
          summary: isCreative ? "提出一个有记忆点的解决方案。" : "基于任务约束完成结构化回复。",
          next_steps: ["确认关键信息", "给出可执行方案", "标记需要人工复核的风险"],
          risk_notes: isWeak ? ["可能遗漏约束"] : []
        },
        null,
        2
      );
    }

    const tone = isCreative ? "更有创意" : "稳健";
    const risk = isWeak ? "不过该回复可能遗漏部分边界条件。" : "同时保留人工复核入口。";
    return [
      `这是一个${tone}的候选回答。`,
      "我会先确认用户目标和已知限制，再给出分步骤方案。",
      "关键动作包括：提取事实、识别风险、输出可执行建议，并保持语言清晰。",
      risk
    ].join("\n");
  }

  private generateJudgeJson(prompt: string): string {
    const weakSignal = /missing-quotes|遗漏|failed|error/i.test(prompt);
    const creativeSignal = /创意|creative/i.test(prompt);
    const base = weakSignal ? 2.7 : creativeSignal ? 4.3 : 4;

    return JSON.stringify(
      {
        dimensionScores: [
          {
            dimensionId: "task_completion",
            score: weakSignal ? 2.5 : 4.2,
            reason: weakSignal ? "任务要求覆盖不完整。" : "基本完成用户任务。"
          },
          {
            dimensionId: "accuracy",
            score: weakSignal ? 2.8 : 4,
            reason: weakSignal ? "存在事实或结构风险。" : "回答没有明显事实错误。"
          },
          {
            dimensionId: "constraint_following",
            score: weakSignal ? 2 : 4.1,
            reason: weakSignal ? "未完全满足格式或约束。" : "主要约束得到遵守。"
          },
          {
            dimensionId: "risk_control",
            score: weakSignal ? 2.6 : 3.9,
            reason: weakSignal ? "风险提示不足。" : "能提示必要风险。"
          },
          {
            dimensionId: "usability",
            score: base,
            reason: "输出整体可读且便于执行。"
          }
        ],
        overallComment: weakSignal
          ? "回答可用性有限，需要人工复核。"
          : "回答质量稳定，适合进入业务试用。",
        riskFlags: weakSignal ? ["constraint_risk", "format_risk"] : []
      }
    );
  }
}
