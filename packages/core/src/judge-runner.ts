import {
  clamp,
  estimateTokens,
  parseMaybeJson,
  sanitizeError,
  type JudgeDimensionScore,
  type JudgeScore,
  type ModelResponse,
  type ProviderConfig,
  type ProviderFactory,
  type Rubric,
  type Scenario,
  type TaskCase
} from "@aise/shared";
import { buildJudgePrompt } from "./prompts";

type JudgeModelOutput = {
  dimensionScores?: JudgeDimensionScore[];
  overallComment?: string;
  riskFlags?: string[];
};

export async function judgeResponse(input: {
  scenario: Scenario;
  task: TaskCase;
  rubric: Rubric;
  response: ModelResponse;
  judges: ProviderConfig[];
  providerFactory: ProviderFactory;
  timeoutMs: number;
}): Promise<JudgeScore[]> {
  if (input.judges.length === 0) {
    return [heuristicJudge(input)];
  }

  const scores: JudgeScore[] = [];
  for (const judgeConfig of input.judges) {
    const provider = input.providerFactory(judgeConfig);
    const started = Date.now();
    try {
      const output = await withTimeout(
        provider.generate({
          prompt: buildJudgePrompt({
            scenario: input.scenario,
            task: input.task,
            rubric: input.rubric,
            modelOutput: input.response.output
          }),
          responseFormat: "json",
          temperature: 0,
          maxTokens: 1600
        }),
        input.timeoutMs
      );
      const parsed = parseMaybeJson<JudgeModelOutput>(output.text);
      scores.push(normalizeJudgeScore({
        parsed,
        fallbackText: output.text,
        rubric: input.rubric,
        judgeId: provider.id,
        judgeName: provider.name,
        response: input.response,
        latencyMs: output.latencyMs
      }));
    } catch (error) {
      scores.push({
        judgeId: provider.id,
        judgeName: provider.name,
        candidateId: input.response.candidateId,
        scenarioId: input.scenario.id,
        taskId: input.task.id,
        dimensionScores: input.rubric.dimensions.map((dimension) => ({
          dimensionId: dimension.id,
          score: 0,
          reason: "裁判调用失败，不能可靠评分。"
        })),
        overallComment: "裁判调用失败。",
        riskFlags: ["judge_failed"],
        latencyMs: Date.now() - started,
        error: sanitizeError(error)
      });
    }
  }

  return scores;
}

function normalizeJudgeScore(input: {
  parsed: JudgeModelOutput | undefined;
  fallbackText: string;
  rubric: Rubric;
  judgeId: string;
  judgeName: string;
  response: ModelResponse;
  latencyMs: number;
}): JudgeScore {
  const dimensionScores = input.rubric.dimensions.map((dimension) => {
    const found = input.parsed?.dimensionScores?.find((score) => score.dimensionId === dimension.id);
    return {
      dimensionId: dimension.id,
      score: clamp(Number(found?.score ?? 3), 0, 5),
      reason: found?.reason || "裁判未给出该维度的具体理由。"
    };
  });

  return {
    judgeId: input.judgeId,
    judgeName: input.judgeName,
    candidateId: input.response.candidateId,
    scenarioId: input.response.scenarioId,
    taskId: input.response.taskId,
    dimensionScores,
    overallComment: input.parsed?.overallComment || input.fallbackText.slice(0, 240),
    riskFlags: Array.isArray(input.parsed?.riskFlags) ? input.parsed.riskFlags.filter(Boolean) : [],
    latencyMs: input.latencyMs
  };
}

function heuristicJudge(input: {
  scenario: Scenario;
  task: TaskCase;
  rubric: Rubric;
  response: ModelResponse;
}): JudgeScore {
  const output = input.response.output;
  const tokenEstimate = estimateTokens(output);
  const emptyPenalty = output.trim().length === 0 ? 2.5 : 0;
  const jsonPenalty = input.task.outputFormat === "json" && !looksLikeJson(output) ? 1.2 : 0;
  const nextStepBonus = /下一步|next step|建议|recommend/i.test(output) ? 0.4 : 0;
  const riskBonus = /风险|复核|uncertain|risk|review/i.test(output) ? 0.35 : 0;

  const base = clamp(3.2 + nextStepBonus + riskBonus - emptyPenalty - jsonPenalty + Math.min(tokenEstimate / 800, 0.3), 0, 5);
  return {
    judgeId: "heuristic_judge",
    judgeName: "Heuristic judge",
    candidateId: input.response.candidateId,
    scenarioId: input.scenario.id,
    taskId: input.task.id,
    dimensionScores: input.rubric.dimensions.map((dimension) => ({
      dimensionId: dimension.id,
      score: dimension.id === "constraint_following" ? clamp(base - jsonPenalty, 0, 5) : base,
      reason: "无裁判模型时使用本地启发式评分，适合演示和测试，不适合正式排名。"
    })),
    overallComment: "本地启发式评分已生成。正式评测建议配置至少一个裁判模型。",
    riskFlags: ["heuristic_judge"]
  };
}

function looksLikeJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
