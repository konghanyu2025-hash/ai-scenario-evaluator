import { exportReport } from "@aise/core";
import { exportReportRequestSchema } from "@aise/shared";
import type { EvaluationReport } from "@aise/shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = exportReportRequestSchema.parse(body);
    const report = parsed.report as EvaluationReport;
    const content = exportReport(report, parsed.format);
    const extension = parsed.format === "markdown" ? "md" : parsed.format;
    const contentType =
      parsed.format === "html"
        ? "text/html; charset=utf-8"
        : parsed.format === "json"
          ? "application/json; charset=utf-8"
          : "text/markdown; charset=utf-8";
    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="ai-scenario-report.${extension}"`
      }
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to export report" },
      { status: 400 }
    );
  }
}
