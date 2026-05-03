# Deployment

## Vercel

Use the repository root as the Vercel project.

Recommended build command:

```bash
pnpm build
```

Environment variables:

```txt
NEXT_PUBLIC_APP_NAME=AI Scenario Evaluator
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

Do not put paid provider API keys in the public deployment unless you also add authentication, rate limits, budget controls, and abuse protection.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://127.0.0.1:3000`.

## CLI

```bash
npx pnpm@9.15.4 build:packages
node packages/cli/dist/index.js run --topic "客服机器人"
```
