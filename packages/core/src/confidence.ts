import { clamp, confidenceFromScore, standardDeviation, type Confidence } from "@aise/shared";

export function calculateConfidence(input: {
  judgeCount: number;
  disagreement: number;
  deterministicPassRate: number;
  outputFailed: boolean;
  difficulty: "easy" | "medium" | "hard";
}): Confidence {
  const judgeFactor = input.judgeCount >= 3 ? 1 : input.judgeCount === 2 ? 0.75 : input.judgeCount === 1 ? 0.5 : 0.25;
  const disagreementFactor = clamp(1 - input.disagreement / 2.5, 0, 1);
  const checkFactor = input.deterministicPassRate;
  const outputFactor = input.outputFailed ? 0 : 1;
  const difficultyFactor = input.difficulty === "hard" ? 0.85 : input.difficulty === "medium" ? 0.95 : 1;
  return confidenceFromScore(judgeFactor * 0.35 + disagreementFactor * 0.25 + checkFactor * 0.2 + outputFactor * 0.15 + difficultyFactor * 0.05);
}

export function disagreementForDimensionScores(scores: number[]): number {
  return standardDeviation(scores);
}
