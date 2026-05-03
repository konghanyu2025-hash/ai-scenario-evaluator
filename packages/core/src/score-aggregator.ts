import {
  average,
  clamp,
  round,
  type AggregatedScore,
  type DeterministicCheck,
  type JudgeScore,
  type Rubric
} from "@aise/shared";
import { calculateConfidence, disagreementForDimensionScores } from "./confidence";

export function aggregateScores(input: {
  candidateId: string;
  scenarioId: string;
  taskId: string;
  difficulty: "easy" | "medium" | "hard";
  rubric: Rubric;
  judgeScores: JudgeScore[];
  deterministicChecks: DeterministicCheck[];
  outputFailed: boolean;
}): AggregatedScore {
  const dimensionScores = input.rubric.dimensions.map((dimension) => {
    const scores = input.judgeScores
      .flatMap((judge) => judge.dimensionScores)
      .filter((score) => score.dimensionId === dimension.id)
      .map((score) => clamp(score.score, 0, 5));
    const avg = scores.length > 0 ? average(scores) : 0;
    return {
      dimensionId: dimension.id,
      score: round(avg, 2),
      reason: mergeReasons(input.judgeScores, dimension.id)
    };
  });

  const weightedRaw = dimensionScores.reduce((sum, dimensionScore) => {
    const dimension = input.rubric.dimensions.find((item) => item.id === dimensionScore.dimensionId);
    if (!dimension) return sum;
    return sum + (dimensionScore.score / 5) * dimension.weight;
  }, 0);

  const penalty = input.deterministicChecks.reduce((sum, check) => sum + check.penalty, 0);
  const score = round(clamp((weightedRaw / input.rubric.totalWeight) * 100 - penalty, 0, 100), 2);
  const disagreement = round(
    average(
      input.rubric.dimensions.map((dimension) =>
        disagreementForDimensionScores(
          input.judgeScores
            .flatMap((judge) => judge.dimensionScores)
            .filter((item) => item.dimensionId === dimension.id)
            .map((item) => item.score)
        )
      )
    ),
    3
  );
  const passRate =
    input.deterministicChecks.length === 0
      ? 1
      : input.deterministicChecks.filter((check) => check.passed).length / input.deterministicChecks.length;
  const confidence = calculateConfidence({
    judgeCount: input.judgeScores.filter((scoreItem) => !scoreItem.error).length,
    disagreement,
    deterministicPassRate: passRate,
    outputFailed: input.outputFailed,
    difficulty: input.difficulty
  });

  return {
    candidateId: input.candidateId,
    scenarioId: input.scenarioId,
    taskId: input.taskId,
    score,
    confidence,
    dimensionScores,
    deterministicChecks: input.deterministicChecks,
    judgeCount: input.judgeScores.length,
    disagreement,
    comments: input.judgeScores.map((judge) => judge.overallComment).filter(Boolean),
    riskFlags: Array.from(
      new Set([
        ...input.judgeScores.flatMap((judge) => judge.riskFlags),
        ...input.deterministicChecks.filter((check) => !check.passed).map((check) => check.id)
      ])
    )
  };
}

function mergeReasons(judgeScores: JudgeScore[], dimensionId: string): string {
  const reasons = judgeScores
    .flatMap((judge) => judge.dimensionScores)
    .filter((score) => score.dimensionId === dimensionId)
    .map((score) => score.reason)
    .filter(Boolean);
  return reasons.slice(0, 2).join(" / ") || "没有可用评分理由。";
}
