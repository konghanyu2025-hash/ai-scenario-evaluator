import Link from "next/link";
import { ArrowLeft, KeyRound, Server } from "lucide-react";
import { providerPresets, recommendedRelayBaseURL, recommendedRelayName } from "@aise/providers";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link className="inline-flex items-center gap-2 text-sm text-teal hover:underline" href="/">
        <ArrowLeft className="h-4 w-4" />
        返回工作台
      </Link>
      <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-teal" />
          <h1 className="text-2xl font-semibold">模型接入</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          网站不会保存 API Key。运行评测时，Key 只用于本次服务端请求。敏感数据建议使用本地 Docker 或 CLI。
        </p>
        <div className="mt-5 rounded-md border border-line bg-paper p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber" />
            <h2 className="font-semibold">推荐中转</h2>
          </div>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-ink/55">名称</dt>
              <dd className="mt-1 font-medium">{recommendedRelayName}</dd>
            </div>
            <div>
              <dt className="text-ink/55">Base URL</dt>
              <dd className="mt-1 break-all font-medium">{recommendedRelayBaseURL}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/60">
                <th className="py-2 pr-3">预设</th>
                <th className="py-2 pr-3">提供商</th>
                <th className="py-2 pr-3">默认模型</th>
                <th className="py-2 pr-3">需要 Key</th>
                <th className="py-2 pr-3">说明</th>
              </tr>
            </thead>
            <tbody>
              {providerPresets.map((preset) => (
                <tr key={preset.id} className="border-b border-line/70">
                  <td className="py-3 pr-3 font-medium">{preset.name}</td>
                  <td className="py-3 pr-3">{preset.provider}</td>
                  <td className="py-3 pr-3">{preset.defaultModel}</td>
                  <td className="py-3 pr-3">{preset.requiresApiKey ? "是" : "否"}</td>
                  <td className="py-3 pr-3">{preset.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
