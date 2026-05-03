# AI Scenario Evaluator

AI Scenario Evaluator is an open-source scenario-based model evaluation system. Instead of using a fixed benchmark, users enter a topic, the system generates realistic application scenarios, runs multiple models against the same tasks, judges the outputs with rubric-based AI scoring plus deterministic checks, and exports reproducible reports.

## What It Does

- Generates realistic evaluation scenarios from any topic.
- Supports web, CLI, Docker, and Vercel deployment.
- Supports user-provided API keys and OpenAI-compatible relay endpoints.
- Includes presets for OpenAI-compatible services, OpenAI, Anthropic, Google, Ollama, and mock models.
- Produces JSON, Markdown, and HTML reports.
- Avoids accounts, billing, and persistent storage in v0.1.

## Quick Start

```bash
npm install -g corepack
npx pnpm@9.15.4 install
npx pnpm@9.15.4 dev
```

Open `http://127.0.0.1:3000`.

The default web flow uses mock models, so it works without real API keys.

## CLI

```bash
npx pnpm@9.15.4 build:packages
node packages/cli/dist/index.js init
node packages/cli/dist/index.js run --topic "客服机器人"
```

After publishing to npm:

```bash
npx @your-scope/ai-scenario-evaluator init
npx @your-scope/ai-scenario-evaluator run --topic "客服机器人"
```

## Provider Configuration

The project supports OpenAI-compatible endpoints as the primary integration path:

```json
{
  "name": "Model A",
  "provider": "openai-compatible",
  "model": "gpt-4o-mini",
  "baseURL": "https://example.com/v1",
  "apiKeyEnv": "MODEL_A_API_KEY"
}
```

Recommended relay preset:

```txt
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

The public demo does not save API keys or reports. For sensitive data, use CLI or Docker locally.

## Docker

```bash
docker compose up --build
```

Then open `http://127.0.0.1:3000`.

## Repository Layout

```txt
apps/web           Next.js web app and API routes
packages/core      Scenario generation, judging, scoring, reporting
packages/providers Model provider adapters
packages/cli       Local CLI
packages/shared    Types, schemas, utilities
docs               Architecture, scoring, deployment, release notes
examples           Example config and reports
```

## Evaluation Method

1. Generate scenarios and task cases from a user topic.
2. Generate a weighted rubric.
3. Run each candidate model on every task.
4. Judge every response with one or more judge models.
5. Apply deterministic checks such as non-empty output, valid JSON, language, length, and overclaiming.
6. Aggregate weighted scores, disagreement, risk flags, and confidence.
7. Export a report with rankings, strengths, weaknesses, and raw task details.

## Development

```bash
npx pnpm@9.15.4 install
npx pnpm@9.15.4 test
npx pnpm@9.15.4 typecheck
npx pnpm@9.15.4 build
```

## Vercel

Use the root repository as the Vercel project and set the build command:

```bash
pnpm build
```

Set environment variables:

```txt
NEXT_PUBLIC_APP_NAME=AI Scenario Evaluator
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

Do not configure paid provider API keys on the public demo unless you have rate limits, auth, abuse protection, and a budget policy.

## Roadmap

- v0.1.0: web, CLI, mock flow, OpenAI-compatible relay, core scoring, reports, Docker, CI.
- v0.2.0: editable rubrics, templates, saved local configs, PDF export, bilingual UI.
- v0.3.0: community scenario templates, share links, calibrated human scoring, simple leaderboard.
- v1.0.0: stable APIs, provider plugin mechanism, complete docs, broader test coverage.

## License

MIT
