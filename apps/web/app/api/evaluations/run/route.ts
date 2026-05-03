import { runEvaluation } from "@aise/core";
import { createProvider } from "@aise/providers";
import { evaluationRunRequestSchema, sanitizeError } from "@aise/shared";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = evaluationRunRequestSchema.parse(body);
    const report = await runEvaluation(parsed, { providerFactory: createProvider });
    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
