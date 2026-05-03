import { describe, expect, it } from "vitest";
import { createProvider } from "@aise/providers";
import { generateRubric } from "./rubric-generator";
import { generateScenarios } from "./scenario-generator";
import { runEvaluation } from "./evaluation-runner";
import { exportReport } from "./exporters";

describe("scenario evaluation flow", () => {
  it("runs a full mock evaluation and exports reports", async () => {
    const scenarios = await generateScenarios({
      topic: "客服机器人",
      language: "zh-CN",
      scenarioCount: 2,
      tasksPerScenario: 1,
      difficulty: "mixed"
    });
    const rubric = generateRubric("客服机器人", "zh-CN");

    const report = await runEvaluation(
      {
        topic: "客服机器人",
        language: "zh-CN",
        scenarios,
        rubric,
        candidates: [
          { id: "balanced", name: "Balanced Mock", provider: "mock", model: "mock-balanced" },
          { id: "weak", name: "Weak Mock", provider: "mock", model: "mock-weak" }
        ],
        judges: [{ id: "judge", name: "Mock Judge", provider: "mock", model: "mock-judge" }],
        options: {
          retries: 0,
          timeoutMs: 10_000,
          enableDeterministicChecks: true
        }
      },
      { providerFactory: createProvider }
    );

    expect(report.summary.scenarioCount).toBe(2);
    expect(report.modelRankings).toHaveLength(2);
    expect(report.modelRankings[0]?.totalScore).toBeGreaterThanOrEqual(report.modelRankings[1]?.totalScore ?? 0);
    expect(exportReport(report, "json")).toContain("客服机器人");
    expect(exportReport(report, "markdown")).toContain("总体排名");
    expect(exportReport(report, "html")).toContain("<html");
  });
});
