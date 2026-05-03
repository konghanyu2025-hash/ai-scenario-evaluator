import type { EvaluationReport, ExportFormat } from "@aise/shared";

export function exportReport(report: EvaluationReport, format: ExportFormat): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "html") return exportReportAsHtml(report);
  return exportReportAsMarkdown(report);
}

export function exportReportAsMarkdown(report: EvaluationReport): string {
  const lines = [
    `# ${report.topic} AI 模型评测报告`,
    "",
    `- 创建时间: ${report.createdAt}`,
    `- 场景数量: ${report.summary.scenarioCount}`,
    `- 任务数量: ${report.summary.taskCount}`,
    `- 候选模型: ${report.summary.candidateCount}`,
    `- 裁判数量: ${report.summary.judgeCount}`,
    "",
    "## 总体排名",
    "",
    "| 排名 | 模型 | 总分 | 置信度 | 延迟 |",
    "| --- | --- | ---: | --- | ---: |",
    ...report.modelRankings.map(
      (ranking, index) =>
        `| ${index + 1} | ${ranking.candidateName} | ${ranking.totalScore} | ${ranking.confidence} | ${ranking.averageLatencyMs}ms |`
    ),
    "",
    "## 模型建议",
    "",
    ...report.recommendations.map((item) => `- **${item.title}**: ${item.body}`),
    "",
    "## 场景详情",
    ""
  ];

  for (const scenarioResult of report.scenarioResults) {
    lines.push(`### ${scenarioResult.scenario.title}`, "");
    for (const taskResult of scenarioResult.tasks) {
      lines.push(`#### ${taskResult.task.id}`, "", taskResult.task.instructions, "");
      for (const score of taskResult.aggregatedScores) {
        const ranking = report.modelRankings.find((item) => item.candidateId === score.candidateId);
        lines.push(
          `- ${ranking?.candidateName || score.candidateId}: ${score.score} 分，置信度 ${score.confidence}，风险 ${score.riskFlags.join(", ") || "无"}`
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function exportReportAsHtml(report: EvaluationReport): string {
  const markdown = exportReportAsMarkdown(report);
  const body = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith("#### ")) return `<h4>${escapeHtml(line.slice(5))}</h4>`;
      if (line.startsWith("- ")) return `<p>${escapeHtml(line)}</p>`;
      if (line.startsWith("|")) return `<pre>${escapeHtml(line)}</pre>`;
      if (line.trim() === "") return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.topic)} AI 模型评测报告</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #18211f; background: #f8faf8; margin: 0; padding: 40px; line-height: 1.6; }
    main { max-width: 1080px; margin: 0 auto; }
    h1, h2, h3 { line-height: 1.2; }
    pre { background: #eef3ef; border: 1px solid #d9e1dc; padding: 10px 12px; overflow-x: auto; }
    p { margin: 8px 0; }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
