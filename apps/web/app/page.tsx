"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { providerPresets } from "@aise/providers";
import type {
  DifficultyOption,
  EvaluationReport,
  Language,
  ProviderConfig,
  Rubric,
  Scenario
} from "@aise/shared";

const defaultCandidates: ProviderConfig[] = [
  {
    id: "mock-balanced",
    name: "Mock Balanced",
    provider: "mock",
    model: "mock-balanced",
    temperature: 0.2,
    maxTokens: 1200
  },
  {
    id: "mock-creative",
    name: "Mock Creative",
    provider: "mock",
    model: "mock-creative",
    temperature: 0.4,
    maxTokens: 1200
  }
];

const defaultJudges: ProviderConfig[] = [
  {
    id: "mock-judge",
    name: "Mock Judge",
    provider: "mock",
    model: "mock-judge",
    temperature: 0,
    maxTokens: 1400
  }
];

const sampleTopics = ["客服机器人", "代码生成助手", "跨境电商商品文案", "法律合同摘要", "医学问答安全性"];

export default function HomePage() {
  const [topic, setTopic] = useState("客服机器人");
  const [language, setLanguage] = useState<Language>("zh-CN");
  const [scenarioCount, setScenarioCount] = useState(3);
  const [tasksPerScenario, setTasksPerScenario] = useState(2);
  const [difficulty, setDifficulty] = useState<DifficultyOption>("mixed");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [rubric, setRubric] = useState<Rubric | undefined>();
  const [candidates, setCandidates] = useState<ProviderConfig[]>(defaultCandidates);
  const [judges, setJudges] = useState<ProviderConfig[]>(defaultJudges);
  const [report, setReport] = useState<EvaluationReport | undefined>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"scenarios" | "run" | "export" | "">("");

  const taskCount = useMemo(
    () => scenarios.reduce((sum, scenario) => sum + scenario.taskCases.length, 0),
    [scenarios]
  );
  const candidateCalls = taskCount * candidates.length;
  const judgeCalls = candidateCalls * Math.max(judges.length, 1);

  async function generate() {
    setBusy("scenarios");
    setError("");
    setStatus("正在生成场景和评分标准");
    setReport(undefined);
    try {
      const data = await fetchJson<{ scenarios: Scenario[]; rubric: Rubric }>("/api/scenarios/generate", {
        topic,
        language,
        scenarioCount,
        tasksPerScenario,
        difficulty
      });
      setScenarios(data.scenarios);
      setRubric(data.rubric);
      setStatus(`已生成 ${data.scenarios.length} 个场景`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy("");
    }
  }

  async function run() {
    if (!scenarios.length || !rubric) {
      await generate();
      return;
    }
    setBusy("run");
    setError("");
    setStatus(`正在运行评测，预计 ${candidateCalls + judgeCalls} 次模型调用`);
    try {
      const data = await fetchJson<{ report: EvaluationReport }>("/api/evaluations/run", {
        topic,
        language,
        scenarios,
        rubric,
        candidates,
        judges,
        options: {
          retries: 1,
          timeoutMs: 120_000,
          enableDeterministicChecks: true
        }
      });
      setReport(data.report);
      setStatus(`评测完成，当前最优模型：${data.report.summary.bestModel || "n/a"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "评测失败");
    } finally {
      setBusy("");
    }
  }

  async function download(format: "json" | "markdown" | "html") {
    if (!report) return;
    setBusy("export");
    setError("");
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, format })
      });
      if (!response.ok) throw new Error((await response.json()).error || "导出失败");
      const blob = await response.blob();
      const extension = format === "markdown" ? "md" : format;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ai-scenario-report.${extension}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(320px,390px)_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-ink">场景化模型评测</h1>
                <p className="mt-1 text-sm text-ink/65">输入主题，生成真实应用测试，比较模型能力。</p>
              </div>
              <BarChart3 className="h-6 w-6 text-teal" aria-hidden />
            </div>

            <label className="mt-4 block text-sm font-medium text-ink" htmlFor="topic">
              主题
            </label>
            <textarea
              id="topic"
              className="focus-ring mt-2 min-h-24 w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-sm"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {sampleTopics.map((item) => (
                <button
                  key={item}
                  className="focus-ring rounded border border-line bg-paper px-2.5 py-1 text-xs text-ink/80 hover:border-teal"
                  type="button"
                  onClick={() => setTopic(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="语言">
                <select
                  className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
              </Field>
              <Field label="难度">
                <select
                  className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as DifficultyOption)}
                >
                  <option value="mixed">混合</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </Field>
              <Field label="场景数">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  min={1}
                  max={10}
                  type="number"
                  value={scenarioCount}
                  onChange={(event) => setScenarioCount(Number(event.target.value))}
                />
              </Field>
              <Field label="每场景任务">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  min={1}
                  max={5}
                  type="number"
                  value={tasksPerScenario}
                  onChange={(event) => setTasksPerScenario(Number(event.target.value))}
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={busy !== ""}
                onClick={generate}
              >
                {busy === "scenarios" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                生成场景
              </button>
              <button
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={busy !== ""}
                onClick={run}
              >
                {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                运行评测
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">调用估算</h2>
              <span className="rounded bg-paper px-2 py-1 text-xs text-ink/70">{candidateCalls + judgeCalls} 次</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Metric label="任务" value={taskCount || scenarioCount * tasksPerScenario} />
              <Metric label="候选模型" value={candidates.length} />
              <Metric label="候选调用" value={candidateCalls || scenarioCount * tasksPerScenario * candidates.length} />
              <Metric label="裁判调用" value={judgeCalls || scenarioCount * tasksPerScenario * candidates.length * judges.length} />
            </dl>
            <p className="mt-3 text-xs leading-5 text-ink/60">公共演示站不会保存 API Key 或评测报告。敏感数据建议用本地 Docker 部署。</p>
          </section>
        </aside>

        <div className="space-y-5">
          {(status || error) && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
                error ? "border-rose/40 bg-rose/10 text-rose" : "border-teal/30 bg-teal/10 text-teal"
              }`}
            >
              {error ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
              <span>{error || status}</span>
            </div>
          )}

          <ScenariosPanel scenarios={scenarios} setScenarios={setScenarios} rubric={rubric} />

          <ModelPanel
            title="候选模型"
            models={candidates}
            setModels={setCandidates}
            addLabel="添加候选模型"
            allowDelete={candidates.length > 1}
          />

          <ModelPanel
            title="裁判模型"
            models={judges}
            setModels={setJudges}
            addLabel="添加裁判模型"
            allowDelete={judges.length > 0}
          />

          {report && <ReportPanel report={report} onDownload={download} exporting={busy === "export"} />}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-ink">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-line bg-paper p-3">
      <dt className="text-xs text-ink/55">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function ScenariosPanel({
  scenarios,
  setScenarios,
  rubric
}: {
  scenarios: Scenario[];
  setScenarios: (value: Scenario[]) => void;
  rubric?: Rubric;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">场景预览</h2>
        <span className="rounded bg-paper px-2 py-1 text-xs text-ink/70">{scenarios.length || 0} 个场景</span>
      </div>
      {scenarios.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">生成后会在这里看到真实任务、约束和输出格式。</p>
      ) : (
        <div className="mt-4 space-y-3">
          {scenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-md border border-line bg-paper p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{scenario.title}</h3>
                  <p className="mt-1 text-sm text-ink/65">{scenario.businessGoal}</p>
                </div>
                <button
                  className="focus-ring rounded p-1.5 text-ink/55 hover:bg-white hover:text-rose"
                  type="button"
                  title="删除场景"
                  onClick={() => setScenarios(scenarios.filter((item) => item.id !== scenario.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {scenario.taskCases.map((task) => (
                  <div key={task.id} className="rounded border border-line bg-white p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{task.id}</span>
                      <span className="rounded bg-paper px-2 py-0.5 text-xs text-ink/60">{task.outputFormat}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-ink/65">{task.instructions}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {rubric && (
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">评分维度</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {rubric.dimensions.map((dimension) => (
              <span key={dimension.id} className="rounded border border-line bg-paper px-2.5 py-1 text-xs">
                {dimension.name} {dimension.weight}%
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ModelPanel({
  title,
  models,
  setModels,
  addLabel,
  allowDelete
}: {
  title: string;
  models: ProviderConfig[];
  setModels: (value: ProviderConfig[]) => void;
  addLabel: string;
  allowDelete: boolean;
}) {
  function update(index: number, patch: Partial<ProviderConfig>) {
    setModels(models.map((model, modelIndex) => (modelIndex === index ? { ...model, ...patch } : model)));
  }

  function applyPreset(index: number, presetId: string) {
    const preset = providerPresets.find((item) => item.id === presetId);
    if (!preset) return;
    update(index, {
      provider: preset.provider,
      model: preset.defaultModel,
      baseURL: preset.baseURL,
      name: preset.name
    });
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm hover:border-teal"
          type="button"
          onClick={() =>
            setModels([
              ...models,
              {
                id: `${title}_${models.length + 1}`.replace(/\s+/g, "_"),
                name: "New Model",
                provider: "openai-compatible",
                model: "gpt-4o-mini",
                baseURL: "",
                temperature: 0.2,
                maxTokens: 1200
              }
            ])
          }
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {models.map((model, index) => (
          <div key={model.id || index} className="rounded-md border border-line bg-paper p-3">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Preset">
                <select
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={providerPresets.find((preset) => preset.provider === model.provider && preset.baseURL === model.baseURL)?.id || ""}
                  onChange={(event) => applyPreset(index, event.target.value)}
                >
                  <option value="">自定义</option>
                  {providerPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="名称">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={model.name || ""}
                  onChange={(event) => update(index, { name: event.target.value })}
                />
              </Field>
              <Field label="Provider">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={model.provider}
                  onChange={(event) => update(index, { provider: event.target.value })}
                />
              </Field>
              <Field label="Model ID">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={model.model}
                  onChange={(event) => update(index, { model: event.target.value })}
                />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_110px_110px_auto]">
              <Field label="Base URL">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  placeholder="https://example.com/v1"
                  value={model.baseURL || ""}
                  onChange={(event) => update(index, { baseURL: event.target.value })}
                />
              </Field>
              <Field label="API Key">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  placeholder="仅本次请求使用"
                  type="password"
                  value={model.apiKey || ""}
                  onChange={(event) => update(index, { apiKey: event.target.value })}
                />
              </Field>
              <Field label="Temp">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  min={0}
                  max={2}
                  step={0.1}
                  type="number"
                  value={model.temperature ?? 0.2}
                  onChange={(event) => update(index, { temperature: Number(event.target.value) })}
                />
              </Field>
              <Field label="Tokens">
                <input
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                  min={128}
                  max={8000}
                  type="number"
                  value={model.maxTokens ?? 1200}
                  onChange={(event) => update(index, { maxTokens: Number(event.target.value) })}
                />
              </Field>
              <div className="flex items-end">
                <button
                  className="focus-ring rounded-md border border-line bg-white p-2 text-ink/55 hover:border-rose hover:text-rose disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  title="删除模型"
                  disabled={!allowDelete}
                  onClick={() => setModels(models.filter((_, modelIndex) => modelIndex !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportPanel({
  report,
  onDownload,
  exporting
}: {
  report: EvaluationReport;
  onDownload: (format: "json" | "markdown" | "html") => void;
  exporting: boolean;
}) {
  const chartData = report.modelRankings.map((ranking) => ({
    name: ranking.candidateName,
    score: ranking.totalScore
  }));

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">评测报告</h2>
          <p className="mt-1 text-sm text-ink/60">
            {report.summary.taskCount} 个任务，{report.summary.totalModelCalls + report.summary.totalJudgeCalls} 次模型调用
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadButton disabled={exporting} icon={<FileJson className="h-4 w-4" />} label="JSON" onClick={() => onDownload("json")} />
          <DownloadButton disabled={exporting} icon={<FileText className="h-4 w-4" />} label="Markdown" onClick={() => onDownload("markdown")} />
          <DownloadButton disabled={exporting} icon={<Download className="h-4 w-4" />} label="HTML" onClick={() => onDownload("html")} />
        </div>
      </div>

      <div className="mt-4 h-72 rounded-md border border-line bg-paper p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={140} />
            <Tooltip />
            <Bar dataKey="score" fill="#0f766e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/60">
              <th className="py-2 pr-3">排名</th>
              <th className="py-2 pr-3">模型</th>
              <th className="py-2 pr-3">总分</th>
              <th className="py-2 pr-3">置信度</th>
              <th className="py-2 pr-3">强项</th>
              <th className="py-2 pr-3">弱项</th>
            </tr>
          </thead>
          <tbody>
            {report.modelRankings.map((ranking, index) => (
              <tr key={ranking.candidateId} className="border-b border-line/70">
                <td className="py-3 pr-3">{index + 1}</td>
                <td className="py-3 pr-3 font-medium">{ranking.candidateName}</td>
                <td className="py-3 pr-3">{ranking.totalScore}</td>
                <td className="py-3 pr-3">{ranking.confidence}</td>
                <td className="py-3 pr-3">{ranking.strengths.join("、")}</td>
                <td className="py-3 pr-3">{ranking.weaknesses.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3">
        {report.recommendations.map((item) => (
          <div key={`${item.candidateId}_${item.title}`} className="rounded-md border border-line bg-paper p-3 text-sm">
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-ink/65">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DownloadButton({
  icon,
  label,
  onClick,
  disabled
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm hover:border-teal disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

async function fetchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
