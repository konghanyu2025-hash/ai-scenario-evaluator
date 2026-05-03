# Architecture

Simplified Chinese docs: [docs/zh-CN/README.md](zh-CN/README.md)

AI Scenario Evaluator is a TypeScript monorepo.

## Packages

- `apps/web`: Next.js UI and API routes.
- `packages/core`: scenario generation, rubric generation, evaluation orchestration, judging, deterministic checks, score aggregation, and report export.
- `packages/providers`: model adapters and provider presets.
- `packages/shared`: schemas, shared types, token estimation, ID helpers, secret masking, and error sanitization.
- `packages/cli`: local command-line runner.

## Runtime Flow

1. The user enters a topic.
2. `generateScenarios` returns scenarios and task cases.
3. `generateRubric` creates weighted dimensions.
4. `runEvaluation` calls each candidate model for every task.
5. `judgeResponse` scores each output with configured judges or a local heuristic fallback.
6. `runDeterministicChecks` adds hard checks for format, length, language, and overclaiming.
7. `aggregateScores` produces task-level scores, confidence, disagreement, and risk flags.
8. `buildReport` creates model rankings and recommendations.
9. `exportReport` writes JSON, Markdown, or HTML.

## Storage

v0.1 is intentionally stateless.

- The public web app does not persist API keys.
- Reports are returned to the browser and can be downloaded.
- CLI writes reports under the configured local output directory.
