# 简体中文文档

## 架构

项目采用 TypeScript monorepo：

- `apps/web`：Next.js 工作台、说明页和 API 路由。
- `packages/core`：场景生成、rubric、候选模型调用、裁判评分、确定性检查、聚合和报告导出。
- `packages/providers`：OpenAI-compatible、推荐中转、OpenAI、Anthropic、Google、Ollama、mock provider。
- `packages/cli`：本地命令行评测和报告导出。
- `packages/shared`：共享类型、Zod schema、脱敏、错误清理和 token 估算。

## 评分

默认评分维度：

- 任务完成度：25
- 准确性：20
- 约束遵守：20
- 风险控制：20
- 可用性：15

裁判模型按 0 到 5 分逐维度评分，系统再按权重归一化到 100 分。确定性检查会对空输出、非法 JSON、超长、语言不符和过度承诺进行扣分并加入风险标签。

## Provider

推荐第一接入路径是 OpenAI-compatible：

```json
{
  "provider": "openai-compatible",
  "model": "gpt-4o-mini",
  "baseURL": "https://example.com/v1",
  "apiKeyEnv": "MODEL_A_API_KEY"
}
```

推荐中转预设通过环境变量配置：

```txt
NEXT_PUBLIC_RECOMMENDED_RELAY_NAME=Your Relay Name
NEXT_PUBLIC_RECOMMENDED_RELAY_BASE_URL=https://your-relay.example.com/v1
```

## 部署

本地开发：

```bash
npx pnpm@9.15.4 install
npx pnpm@9.15.4 dev
```

Docker：

```bash
docker compose up --build
```

Vercel：

```bash
pnpm build
```

公共站点不要内置付费模型 Key；严肃评测和敏感数据建议用 Docker 或 CLI 本地运行。

## 发布

源码推送到 GitHub 后可创建 release：

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0" --notes "Initial release"
```
