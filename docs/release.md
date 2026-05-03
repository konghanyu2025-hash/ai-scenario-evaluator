# Release and Upload Plan

Simplified Chinese docs: [docs/zh-CN/README.md](zh-CN/README.md)

## GitHub

```bash
git init -b main
git add .
git commit -m "Initial AI Scenario Evaluator release"
gh repo create ai-scenario-evaluator --public --source=. --remote=origin --push
git tag v0.1.0
git push origin v0.1.0
```

Create a GitHub release from tag `v0.1.0`.

## Vercel

1. Import the GitHub repository.
2. Use the repository root.
3. Build command: `pnpm build`.
4. Add relay environment variables.
5. Deploy.

## npm

Before publishing, replace `@your-scope/ai-scenario-evaluator` with your npm scope.

```bash
npx pnpm@9.15.4 build:packages
cd packages/cli
pnpm publish --access public
```

## Docker Image

```bash
docker build -t ghcr.io/YOUR_NAME/ai-scenario-evaluator:0.1.0 .
docker push ghcr.io/YOUR_NAME/ai-scenario-evaluator:0.1.0
```

Replace `YOUR_NAME` with your GitHub namespace.
