import { z } from "zod";

export const languageSchema = z.enum(["zh-CN", "en-US"]);
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const difficultyOptionSchema = z.enum(["easy", "medium", "hard", "mixed"]);
export const outputFormatSchema = z.enum(["plain_text", "json", "markdown"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const taskCaseSchema = z.object({
  id: z.string().min(1),
  input: z.string().min(1),
  instructions: z.string().min(1),
  expectedCapabilities: z.array(z.string().min(1)).min(1),
  constraints: z.array(z.string().min(1)).default([]),
  outputFormat: outputFormatSchema.optional()
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1),
  userRole: z.string().min(1),
  businessGoal: z.string().min(1),
  difficulty: difficultySchema,
  taskCases: z.array(taskCaseSchema).min(1)
});

export const rubricDimensionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().positive(),
  scale: z.object({
    min: z.literal(0),
    max: z.literal(5)
  })
});

export const rubricSchema = z.object({
  dimensions: z.array(rubricDimensionSchema).min(1),
  totalWeight: z.number().positive()
});

export const providerConfigSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  apiKeyEnv: z.string().optional(),
  baseURL: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  weight: z.number().positive().optional()
});

export const scenarioGenerationRequestSchema = z.object({
  topic: z.string().trim().min(2).max(500),
  language: languageSchema.default("zh-CN"),
  scenarioCount: z.number().int().min(1).max(10).default(5),
  tasksPerScenario: z.number().int().min(1).max(5).default(2),
  difficulty: difficultyOptionSchema.default("mixed")
});

export const evaluationRunOptionsSchema = z.object({
  retries: z.number().int().min(0).max(3).default(2),
  timeoutMs: z.number().int().min(5_000).max(120_000).default(120_000),
  enableDeterministicChecks: z.boolean().default(true)
});

export const evaluationRunRequestSchema = z.object({
  topic: z.string().trim().min(2),
  language: languageSchema.default("zh-CN"),
  scenarios: z.array(scenarioSchema).min(1).max(10),
  rubric: rubricSchema,
  candidates: z.array(providerConfigSchema).min(1).max(8),
  judges: z.array(providerConfigSchema).max(3).default([]),
  options: evaluationRunOptionsSchema.default({
    retries: 2,
    timeoutMs: 120_000,
    enableDeterministicChecks: true
  })
});

export const exportReportRequestSchema = z.object({
  report: z.unknown(),
  format: z.enum(["json", "markdown", "html"])
});
