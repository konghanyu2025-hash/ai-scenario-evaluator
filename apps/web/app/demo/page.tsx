import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

const rows = [
  { name: "模拟均衡模型", score: 83.4, confidence: "medium", strength: "任务完成度、约束遵守" },
  { name: "模拟创意模型", score: 81.9, confidence: "medium", strength: "内容表达、用户体验" },
  { name: "模拟弱模型", score: 54.2, confidence: "low", strength: "基础响应" }
];

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link className="inline-flex items-center gap-2 text-sm text-teal hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        返回工作台
      </Link>
      <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">示例报告</h1>
            <p className="mt-2 text-sm text-ink/65">主题：跨境电商客服。示例数据来自模拟模型，可用于理解报告结构。</p>
          </div>
          <BarChart3 className="h-8 w-8 text-teal" aria-hidden />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/60">
                <th className="py-2 pr-3">模型</th>
                <th className="py-2 pr-3">总分</th>
                <th className="py-2 pr-3">置信度</th>
                <th className="py-2 pr-3">强项</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-line/70">
                  <td className="py-3 pr-3 font-medium">{row.name}</td>
                  <td className="py-3 pr-3">{row.score}</td>
                  <td className="py-3 pr-3">{row.confidence}</td>
                  <td className="py-3 pr-3">{row.strength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-line bg-paper p-4">
            <h2 className="font-semibold">典型发现</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Balanced 模型在约束遵守和风险提示上更稳定，适合客服、审核、结构化工作流。Creative 模型在表达和文案化任务上更有优势。
            </p>
          </div>
          <div className="rounded-md border border-line bg-paper p-4">
            <h2 className="font-semibold">风险提示</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              当裁判数量较少或确定性检查失败时，报告会降低置信度。正式评测建议至少使用一个高质量裁判模型。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
