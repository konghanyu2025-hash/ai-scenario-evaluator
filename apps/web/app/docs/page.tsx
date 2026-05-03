import Link from "next/link";
import { ArrowLeft, Terminal, ShieldCheck, Workflow } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link className="inline-flex items-center gap-2 text-sm text-teal hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        返回工作台
      </Link>
      <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
        <h1 className="text-2xl font-semibold">使用说明</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <DocItem
            icon={<Workflow className="h-5 w-5" />}
            title="生成场景"
            body="输入主题，选择语言、难度和数量，系统会生成真实任务、约束和评分 rubric。"
          />
          <DocItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="混合评分"
            body="候选模型回答后，由裁判模型和确定性检查共同评分，报告会标记置信度和风险。"
          />
          <DocItem
            icon={<Terminal className="h-5 w-5" />}
            title="本地复现"
            body="CLI 和 Docker 可以在本地保存配置与结果，适合敏感数据和批量评测。"
          />
        </div>
        <div className="mt-6 rounded-md border border-line bg-paper p-4">
          <h2 className="font-semibold">CLI 快速开始</h2>
          <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-sm">
{`npx @your-scope/ai-scenario-evaluator init
npx @your-scope/ai-scenario-evaluator run --topic "客服机器人"`}
          </pre>
        </div>
      </section>
    </main>
  );
}

function DocItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-md border border-line bg-paper p-4">
      <div className="flex items-center gap-2 text-teal">
        {icon}
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/65">{body}</p>
    </div>
  );
}
