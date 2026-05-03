# AI 场景化模型评分系统

[English](README.md) | [简体中文](README.zh-CN.md)

AI Scenario Evaluator 是一个开源的场景化 AI 模型评测系统。它不依赖固定题库，而是让用户输入主题，系统自动生成真实应用场景、任务样本和评分标准，再让多个模型完成同一批任务，通过 AI 裁判评分、确定性检查和置信度计算生成可下载报告。

## 功能

- 根据任意主题生成真实应用评测场景。
- 支持网页、CLI、Docker 和 Vercel 部署。
- 支持用户自带 API Key，不由公共项目承担推理费用。
- 支持 OpenAI-compatible 接口和推荐中转服务。
- 内置 OpenAI、Anthropic、Google、Ollama、mock 模型预设。
- 导出 JSON、Markdown、HTML 报告。
- v0.1 不做账号、计费、公开排行榜和持久化存储。

## 快速开始

在线 Demo：

```txt
https://ai-scenario-evaluator.vercel.app
```

```bash
npx pnpm@9.15.4 install
npx pnpm@9.15.4 dev
```

打开：

```txt
http://127.0.0.1:3000
```

默认网页流程使用 mock 模型，不需要真实 API Key。

## CLI

```bash
npx pnpm@9.15.4 build:packages
node packages/cli/dist/index.js init
node packages/cli/dist/index.js run --topic "客服机器人"
```

npm 发布后可使用：

```bash
npx @your-scope/ai-scenario-evaluator init
npx @your-scope/ai-scenario-evaluator run --topic "客服机器人"
```

## 模型接入

推荐优先使用 OpenAI-compatible 接口：

```json
{
  "name": "模型 A",
  "provider": "openai-compatible",
  "model": "gpt-4o-mini",
  "baseURL": "https://example.com/v1",
  "apiKeyEnv": "MODEL_A_API_KEY"
}
```

推荐中转配置：

```txt
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

公共演示站不会保存 API Key 或评测报告。敏感数据建议使用 CLI 或 Docker 本地运行。

## Docker

```bash
docker compose up --build
```

然后打开：

```txt
http://127.0.0.1:3000
```

## 项目结构

```txt
apps/web           Next.js 网页和 API 路由
packages/core      场景生成、裁判评分、聚合和报告导出
packages/providers 模型 provider 适配器
packages/cli       本地 CLI
packages/shared    类型、schema 和工具函数
docs               架构、评分、部署和发布文档
examples           示例配置和示例报告
```

## 评测机制

1. 用户输入主题。
2. 系统生成真实场景和任务样本。
3. 系统生成加权 rubric。
4. 每个候选模型完成每个任务。
5. 裁判模型对回答逐维度评分。
6. 确定性检查验证非空、JSON、长度、语言和过度承诺。
7. 聚合总分、置信度、风险标签和模型建议。
8. 导出 JSON、Markdown 或 HTML 报告。

## 开发验证

```bash
npx pnpm@9.15.4 test
npx pnpm@9.15.4 lint
npx pnpm@9.15.4 typecheck
npx pnpm@9.15.4 build
npx pnpm@9.15.4 e2e
```

## 部署

Vercel 构建命令：

```bash
pnpm build
```

环境变量：

```txt
NEXT_PUBLIC_APP_NAME=AI Scenario Evaluator
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

公共部署不建议配置付费模型 Key，除非已经有登录、限流、预算控制和滥用防护。

## 路线图

- v0.1.0：网页、CLI、Docker、OpenAI-compatible、中转预设、核心评分、报告导出、CI。
- v0.2.0：自定义 rubric、场景模板、PDF 导出、中英文界面切换。
- v0.3.0：社区场景模板、分享链接、人工校准、简单排行榜。
- v1.0.0：稳定 API、provider 插件机制、完整文档和更高测试覆盖。

## License

MIT
