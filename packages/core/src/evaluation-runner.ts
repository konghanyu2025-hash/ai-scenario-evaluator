import {
  estimateTokens,
  normalizeProviderConfig,
  sanitizeError,
  type EvaluationProgress,
  type EvaluationReport,
  type EvaluationRunRequest,
  type ModelCandidate,
  type ModelResponse,
  type ProviderFactory,
  type ScenarioResult,
  type TaskEvaluationResult
} from "@aise/shared";
import { runDeterministicChecks } from "./deterministic-checks";
import { judgeResponse } from "./judge-runner";
import { buildCandidatePrompt } from "./prompts";
import { buildReport } from "./report-builder";
import { aggregateScores } from "./score-aggregator";

type RunContext = {
  providerFactory: ProviderFactory;
  onProgress?: (progress: EvaluationProgress) => void;
};

export async function runEvaluation(request: EvaluationRunRequest, context: RunContext): Promise<EvaluationReport> {
  const candidates = request.candidates.map((config, index) => normalizeProviderConfig(config, index) as ModelCandidate);
  const judges = request.judges.map((config, index) => normalizeProviderConfig(config, index));
  const totalTasks = request.scenarios.reduce((sum, scenario) => sum + scenario.taskCases.length, 0);
  const totalCandidateCalls = totalTasks * candidates.length;
  const totalJudgeCalls = totalCandidateCalls * Math.max(judges.length, 1);
  const totalWork = totalCandidateCalls + totalJudgeCalls;
  let completed = 0;

  const scenarioResults: ScenarioResult[] = [];

  for (const scenario of request.scenarios) {
    const tasks: TaskEvaluationResult[] = [];
    for (const task of scenario.taskCases) {
      const responses: ModelResponse[] = [];
      const allJudgeScores = [];
      const aggregatedScores = [];

      for (const candidate of candidates) {
        context.onProgress?.({
          phase: "candidate_call",
          completed,
          total: totalWork,
          message: `Running ${candidate.name} on ${task.id}`
        });
        const response = await runCandidateWithRetries({
          candidate,
          prompt: buildCandidatePrompt(scenario, task),
          scenarioId: scenario.id,
          taskId: task.id,
          providerFactory: context.providerFactory,
          retries: request.options.retries,
          timeoutMs: request.options.timeoutMs
        });
        responses.push(response);
        completed += 1;

        context.onProgress?.({
          phase: "judge_call",
          completed,
          total: totalWork,
          message: `Judging ${candidate.name} on ${task.id}`
        });
        const judgeScores = await judgeResponse({
          scenario,
          task,
          rubric: request.rubric,
          response,
          judges,
          providerFactory: context.providerFactory,
          timeoutMs: request.options.timeoutMs
        });
        allJudgeScores.push(...judgeScores);
        completed += Math.max(judges.length, 1);

        const checks = request.options.enableDeterministicChecks ? runDeterministicChecks(task, response.output) : [];
        aggregatedScores.push(
          aggregateScores({
            candidateId: candidate.id,
            scenarioId: scenario.id,
            taskId: task.id,
            difficulty: scenario.difficulty,
            rubric: request.rubric,
            judgeScores,
            deterministicChecks: checks,
            outputFailed: response.status !== "completed"
          })
        );
      }

      tasks.push({
        scenario,
        task,
        responses,
        judgeScores: allJudgeScores,
        aggregatedScores
      });
    }
    scenarioResults.push({ scenario, tasks });
  }

  context.onProgress?.({
    phase: "report",
    completed,
    total: totalWork,
    message: "Building report"
  });
  const report = buildReport({
    request: {
      ...request,
      candidates,
      judges
    },
    scenarioResults
  });
  context.onProgress?.({
    phase: "completed",
    completed: totalWork,
    total: totalWork,
    message: "Evaluation completed"
  });
  return report;
}

async function runCandidateWithRetries(input: {
  candidate: ModelCandidate;
  prompt: string;
  scenarioId: string;
  taskId: string;
  providerFactory: ProviderFactory;
  retries: number;
  timeoutMs: number;
}): Promise<ModelResponse> {
  const provider = input.providerFactory(input.candidate);
  let lastError: unknown;
  for (let attempt = 0; attempt <= input.retries; attempt += 1) {
    const started = Date.now();
    try {
      const output = await withTimeout(
        provider.generate({
          prompt: input.prompt,
          temperature: input.candidate.temperature,
          maxTokens: input.candidate.maxTokens
        }),
        input.timeoutMs
      );
      return {
        id: `${input.candidate.id}_${input.scenarioId}_${input.taskId}`,
        candidateId: input.candidate.id,
        candidateName: input.candidate.name,
        scenarioId: input.scenarioId,
        taskId: input.taskId,
        output: output.text,
        status: "completed",
        latencyMs: output.latencyMs,
        inputTokens: output.inputTokens ?? estimateTokens(input.prompt),
        outputTokens: output.outputTokens ?? estimateTokens(output.text)
      };
    } catch (error) {
      lastError = error;
      if (attempt === input.retries) {
        return {
          id: `${input.candidate.id}_${input.scenarioId}_${input.taskId}`,
          candidateId: input.candidate.id,
          candidateName: input.candidate.name,
          scenarioId: input.scenarioId,
          taskId: input.taskId,
          output: "",
          status: "failed",
          latencyMs: Date.now() - started,
          inputTokens: estimateTokens(input.prompt),
          outputTokens: 0,
          error: sanitizeError(lastError)
        };
      }
    }
  }

  throw lastError;
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
