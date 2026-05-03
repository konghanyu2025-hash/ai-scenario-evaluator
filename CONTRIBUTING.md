# Contributing

Thanks for improving AI Scenario Evaluator.

## Local Setup

```bash
npx pnpm@9.15.4 install
npx pnpm@9.15.4 test
npx pnpm@9.15.4 build
```

## Pull Requests

- Keep changes scoped.
- Add or update tests for scoring, providers, CLI behavior, or report formats.
- Do not commit real API keys, private evaluation data, or generated reports containing sensitive content.
- Provider adapters should implement the shared `ModelProvider` interface.
- New scoring behavior should include a deterministic mock test.

## Commit Style

Use clear imperative commit messages, for example:

```txt
Add Anthropic provider adapter
Fix JSON deterministic check
Document Docker deployment
```
