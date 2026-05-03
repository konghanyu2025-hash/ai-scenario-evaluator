import {
  average,
  confidenceRank,
  round,
  type EvaluationReport,
  type EvaluationRunRequest,
  type ModelRanking,
  type Recommendation,
  type ScenarioResult
} from "@aise/shared";

export function buildReport(input: {
  request: EvaluationRunRequest;
  scenarioResults: ScenarioResult[];
}): EvaluationReport {
  const rankings = buildRankings(input.request, input.scenarioResults);
  return {
    id: `report_${Date.now().toString(36)}`,
    topic: input.request.topic,
    language: input.request.language,
    createdAt: new Date().toISOString(),
    rubric: input.request.rubric,
    summary: {
      topic: input.request.topic,
      language: input.request.language,
      scenarioCount: input.request.scenarios.length,
      taskCount: input.request.scenarios.reduce((sum, scenario) => sum + scenario.taskCases.length, 0),
      candidateCount: input.request.candidates.length,
      judgeCount: input.request.judges.length || 1,
      totalModelCalls: input.request.scenarios.reduce((sum, scenario) => sum + scenario.taskCases.length, 0) * input.request.candidates.length,
      totalJudgeCalls:
        input.request.scenarios.reduce((sum, scenario) => sum + scenario.taskCases.length, 0) *
        input.request.candidates.length *
        Math.max(input.request.judges.length, 1),
      bestModel: rankings[0]?.candidateName
    },
    modelRankings: rankings,
    scenarioResults: input.scenarioResults,
    recommendations: buildRecommendations(rankings)
  };
}

function buildRankings(request: EvaluationRunRequest, scenarioResults: ScenarioResult[]): ModelRanking[] {
  return request.candidates
    .map((candidate, index) => {
      const candidateId = candidate.id || `${candidate.provider}_${candidate.model}_${index}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const candidateName = candidate.name || `${candidate.provider}:${candidate.model}`;
      const taskResults = scenarioResults.flatMap((scenarioResult) => scenarioResult.tasks);
      const scores = taskResults
        .flatMap((taskResult) => taskResult.aggregatedScores)
        .filter((score) => score.candidateId === candidateId);
      const responses = taskResults
        .flatMap((taskResult) => taskResult.responses)
        .filter((response) => response.candidateId === candidateId);
      const dimensionAverages: Record<string, number> = {};
      for (const dimension of request.rubric.dimensions) {
        const values = scores.flatMap((score) =>
          score.dimensionScores.filter((item) => item.dimensionId === dimension.id).map((item) => item.score)
        );
        dimensionAverages[dimension.id] = round(average(values), 2);
      }
      const confidence = pickConfidence(scores.map((score) => score.confidence));
      const strengths = Object.entries(dimensionAverages)
        .filter(([, value]) => value >= 4)
        .map(([id]) => request.rubric.dimensions.find((dimension) => dimension.id === id)?.name || id)
        .slice(0, 3);
      const weaknesses = Object.entries(dimensionAverages)
        .filter(([, value]) => value > 0 && value < 3.4)
        .map(([id]) => request.rubric.dimensions.find((dimension) => dimension.id === id)?.name || id)
        .slice(0, 3);
      return {
        candidateId,
        candidateName,
        provider: candidate.provider,
        model: candidate.model,
        totalScore: round(average(scores.map((score) => score.score)), 2),
        confidence,
        averageLatencyMs: Math.round(average(responses.map((response) => response.latencyMs))),
        estimatedInputTokens: responses.reduce((sum, response) => sum + (response.inputTokens ?? 0), 0),
        estimatedOutputTokens: responses.reduce((sum, response) => sum + (response.outputTokens ?? 0), 0),
        dimensionAverages,
        strengths: strengths.length ? strengths : ["稳定完成基础任务"],
        weaknesses: weaknesses.length ? weaknesses : ["暂未发现显著弱项"],
        riskFlags: Array.from(new Set(scores.flatMap((score) => score.riskFlags))).slice(0, 8)
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

function pickConfidence(values: Array<"low" | "medium" | "high">): "low" | "medium" | "high" {
  if (values.length === 0) return "low";
  const avg = average(values.map(confidenceRank));
  if (avg >= 2.5) return "high";
  if (avg >= 1.6) return "medium";
  return "low";
}

function buildRecommendations(rankings: ModelRanking[]): Recommendation[] {
  return rankings.map((ranking, index) => {
    const top = index === 0;
    const risk = ranking.riskFlags.length > 0;
    return {
      candidateId: ranking.candidateId,
      title: top ? `${ranking.candidateName} 是当前最优选择` : `${ranking.candidateName} 的适用边界`,
      body: top
        ? `综合分 ${ranking.totalScore}，强项集中在 ${ranking.strengths.join("、")}。`
        : `综合分 ${ranking.totalScore}，建议重点复查 ${ranking.weaknesses.join("、")}。`,
      severity: risk ? "warning" : top ? "info" : "risk"
    };
  });
}
