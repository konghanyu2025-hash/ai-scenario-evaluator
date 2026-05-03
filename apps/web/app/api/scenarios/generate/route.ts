import { generateRubric, generateScenarios } from "@aise/core";
import { scenarioGenerationRequestSchema } from "@aise/shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = scenarioGenerationRequestSchema.parse(body);
    const scenarios = await generateScenarios(parsed);
    const rubric = generateRubric(parsed.topic, parsed.language);
    return Response.json({ scenarios, rubric });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate scenarios" },
      { status: 400 }
    );
  }
}
