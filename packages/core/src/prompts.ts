import type { Rubric, Scenario, TaskCase } from "@aise/shared";

export function buildCandidatePrompt(scenario: Scenario, task: TaskCase): string {
  return [
    `场景标题: ${scenario.title}`,
    `领域: ${scenario.domain}`,
    `用户角色: ${scenario.userRole}`,
    `业务目标: ${scenario.businessGoal}`,
    `难度: ${scenario.difficulty}`,
    "",
    `输入材料:\n${task.input}`,
    "",
    `任务要求:\n${task.instructions}`,
    "",
    `预期能力:\n${task.expectedCapabilities.map((item) => `- ${item}`).join("\n")}`,
    "",
    `约束:\n${task.constraints.map((item) => `- ${item}`).join("\n")}`,
    "",
    `输出格式: ${task.outputFormat || "plain_text"}`
  ].join("\n");
}

export function buildJudgePrompt(input: {
  scenario: Scenario;
  task: TaskCase;
  rubric: Rubric;
  modelOutput: string;
}): string {
  return [
    "你是严格但务实的 AI 模型评测裁判。请只输出 JSON，不要输出 Markdown。",
    "请根据评分维度给候选模型回答打分。每个维度 0 到 5 分，可以有一位小数。",
    "",
    `场景: ${input.scenario.title}`,
    `业务目标: ${input.scenario.businessGoal}`,
    `任务输入:\n${input.task.input}`,
    `任务要求:\n${input.task.instructions}`,
    `约束:\n${input.task.constraints.map((item) => `- ${item}`).join("\n")}`,
    "",
    `评分维度:\n${input.rubric.dimensions
      .map((dimension) => `- ${dimension.id}: ${dimension.name}, 权重 ${dimension.weight}, ${dimension.description}`)
      .join("\n")}`,
    "",
    `候选回答:\n${input.modelOutput}`,
    "",
    "输出 JSON 结构:",
    JSON.stringify(
      {
        dimensionScores: input.rubric.dimensions.map((dimension) => ({
          dimensionId: dimension.id,
          score: 0,
          reason: "评分理由"
        })),
        overallComment: "总体评价",
        riskFlags: ["可选风险标签"]
      },
      null,
      2
    )
  ].join("\n");
}
