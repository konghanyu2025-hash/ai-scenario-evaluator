#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Command } from "commander";
import { exportReport, generateRubric, generateScenarios, runEvaluation } from "@aise/core";
import { createProvider } from "@aise/providers";
import {
  evaluationRunOptionsSchema,
  providerConfigSchema,
  resolveEnvConfig,
  scenarioGenerationRequestSchema,
  type EvaluationReport,
  type ExportFormat,
  type ProviderConfig
} from "@aise/shared";

type CliConfig = {
  topic: string;
  language?: "zh-CN" | "en-US";
  scenarioCount?: number;
  tasksPerScenario?: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  models?: ProviderConfig[];
  judges?: ProviderConfig[];
  output?: {
    formats?: ExportFormat[];
    dir?: string;
  };
};

const program = new Command();

program
  .name("ai-scenario-evaluator")
  .description("Run scenario-based AI model evaluations from the command line.")
  .version("0.1.0");

program
  .command("init")
  .description("Create an eval.config.json file.")
  .option("-f, --force", "Overwrite existing config")
  .action(async (options: { force?: boolean }) => {
    const target = resolve("eval.config.json");
    if (!options.force && (await exists(target))) {
      throw new Error("eval.config.json already exists. Use --force to overwrite it.");
    }
    await writeFile(target, JSON.stringify(defaultConfig(), null, 2), "utf8");
    console.log(`Created ${target}`);
  });

program
  .command("run")
  .description("Run an evaluation from a topic or config file.")
  .option("-t, --topic <topic>", "Evaluation topic")
  .option("-c, --config <path>", "Path to eval.config.json")
  .option("-o, --output <dir>", "Output directory")
  .action(async (options: { topic?: string; config?: string; output?: string }) => {
    const config = options.config ? await readConfig(resolve(options.config)) : defaultConfig(options.topic);
    if (options.topic) config.topic = options.topic;
    if (options.output) config.output = { ...(config.output || {}), dir: options.output };
    const report = await runFromConfig(config);
    const outDir = resolve(config.output?.dir || "results");
    await mkdir(outDir, { recursive: true });
    const formats: ExportFormat[] = config.output?.formats?.length
      ? config.output.formats
      : ["json", "markdown", "html"];
    for (const format of formats) {
      const extension = format === "markdown" ? "md" : format;
      const target = join(outDir, `report.${extension}`);
      await writeFile(target, exportReport(report, format), "utf8");
      console.log(`Wrote ${target}`);
    }
    await writeFile(join(outDir, "latest.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(`Best model: ${report.summary.bestModel || "n/a"}`);
  });

program
  .command("report")
  .description("Export an existing JSON report to another format.")
  .requiredOption("-i, --input <path>", "Input report JSON")
  .requiredOption("-f, --format <format>", "json, markdown, or html")
  .option("-o, --output <path>", "Output file")
  .action(async (options: { input: string; format: ExportFormat; output?: string }) => {
    const raw = await readFile(resolve(options.input), "utf8");
    const report = JSON.parse(raw) as EvaluationReport;
    const format = parseFormat(options.format);
    const extension = format === "markdown" ? "md" : format;
    const target = resolve(options.output || `report.${extension}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, exportReport(report, format), "utf8");
    console.log(`Wrote ${target}`);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function runFromConfig(config: CliConfig): Promise<EvaluationReport> {
  const generationRequest = scenarioGenerationRequestSchema.parse({
    topic: config.topic,
    language: config.language || "zh-CN",
    scenarioCount: config.scenarioCount ?? 5,
    tasksPerScenario: config.tasksPerScenario ?? 2,
    difficulty: config.difficulty || "mixed"
  });
  const candidates = (config.models?.length ? config.models : defaultConfig(config.topic).models || []).map((item, index) =>
    providerConfigSchema.parse(resolveEnvConfig({ ...item, id: item.id || `model_${index + 1}` }))
  );
  const judges = (config.judges?.length ? config.judges : defaultConfig(config.topic).judges || []).map((item, index) =>
    providerConfigSchema.parse(resolveEnvConfig({ ...item, id: item.id || `judge_${index + 1}` }))
  );
  const scenarios = await generateScenarios(generationRequest);
  const rubric = generateRubric(generationRequest.topic, generationRequest.language);
  const options = evaluationRunOptionsSchema.parse({
    retries: 1,
    timeoutMs: 120_000,
    enableDeterministicChecks: true
  });

  return runEvaluation(
    {
      topic: generationRequest.topic,
      language: generationRequest.language,
      scenarios,
      rubric,
      candidates,
      judges,
      options
    },
    {
      providerFactory: createProvider,
      onProgress: (progress) => {
        if (progress.phase === "candidate_call" || progress.phase === "judge_call") {
          process.stdout.write(`\r${progress.completed}/${progress.total} ${progress.message}`.padEnd(100));
        }
        if (progress.phase === "completed") process.stdout.write("\n");
      }
    }
  );
}

async function readConfig(path: string): Promise<CliConfig> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as CliConfig;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function parseFormat(format: string): ExportFormat {
  if (format === "json" || format === "markdown" || format === "html") return format;
  if (format === "md") return "markdown";
  throw new Error("Unsupported format. Use json, markdown, md, or html.");
}

function defaultConfig(topic = "客服机器人"): CliConfig {
  return {
    topic,
    language: "zh-CN",
    scenarioCount: 3,
    tasksPerScenario: 2,
    difficulty: "mixed",
    models: [
      {
        id: "mock-balanced",
        name: "Mock Balanced",
        provider: "mock",
        model: "mock-balanced"
      },
      {
        id: "mock-creative",
        name: "Mock Creative",
        provider: "mock",
        model: "mock-creative"
      }
    ],
    judges: [
      {
        id: "mock-judge",
        name: "Mock Judge",
        provider: "mock",
        model: "mock-judge"
      }
    ],
    output: {
      formats: ["json", "markdown", "html"],
      dir: "./results"
    }
  };
}
