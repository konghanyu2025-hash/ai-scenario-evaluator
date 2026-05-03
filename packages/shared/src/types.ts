export type Language = "zh-CN" | "en-US";

export type Difficulty = "easy" | "medium" | "hard";

export type DifficultyOption = Difficulty | "mixed";

export type OutputFormat = "plain_text" | "json" | "markdown";

export type Confidence = "low" | "medium" | "high";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type ExportFormat = "json" | "markdown" | "html";

export type EvaluationTopic = {
  topic: string;
  language: Language;
};

export type TaskCase = {
  id: string;
  input: string;
  instructions: string;
  expectedCapabilities: string[];
  constraints: string[];
  outputFormat?: OutputFormat;
};

export type Scenario = {
  id: string;
  title: string;
  domain: string;
  userRole: string;
  businessGoal: string;
  difficulty: Difficulty;
  taskCases: TaskCase[];
};

export type RubricDimension = {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: {
    min: 0;
    max: 5;
  };
};

export type Rubric = {
  dimensions: RubricDimension[];
  totalWeight: number;
};

export type ProviderKind =
  | "mock"
  | "openai-compatible"
  | "custom-openai-compatible"
  | "openai"
  | "anthropic"
  | "google"
  | "ollama";

export type ProviderConfig = {
  id?: string;
  name?: string;
  provider: ProviderKind | string;
  model: string;
  apiKey?: string;
  apiKeyEnv?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  weight?: number;
};

export type ModelCandidate = ProviderConfig & {
  id: string;
  name: string;
};

export type GenerateMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateInput = {
  system?: string;
  prompt: string;
  messages?: GenerateMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  metadata?: Record<string, unknown>;
};

export type GenerateOutput = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  raw?: unknown;
};

export interface ModelProvider {
  id: string;
  name: string;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

export type ProviderFactory = (config: ProviderConfig) => ModelProvider;

export type ModelResponse = {
  id: string;
  candidateId: string;
  candidateName: string;
  scenarioId: string;
  taskId: string;
  output: string;
  status: TaskStatus;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
};

export type DeterministicCheck = {
  id: string;
  name: string;
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: string;
  penalty: number;
};

export type JudgeDimensionScore = {
  dimensionId: string;
  score: number;
  reason: string;
};

export type JudgeScore = {
  judgeId: string;
  judgeName: string;
  candidateId: string;
  scenarioId: string;
  taskId: string;
  dimensionScores: JudgeDimensionScore[];
  overallComment: string;
  riskFlags: string[];
  latencyMs?: number;
  error?: string;
};

export type AggregatedScore = {
  candidateId: string;
  scenarioId: string;
  taskId: string;
  score: number;
  confidence: Confidence;
  dimensionScores: JudgeDimensionScore[];
  deterministicChecks: DeterministicCheck[];
  judgeCount: number;
  disagreement: number;
  comments: string[];
  riskFlags: string[];
};

export type TaskEvaluationResult = {
  scenario: Scenario;
  task: TaskCase;
  responses: ModelResponse[];
  judgeScores: JudgeScore[];
  aggregatedScores: AggregatedScore[];
};

export type ScenarioResult = {
  scenario: Scenario;
  tasks: TaskEvaluationResult[];
};

export type ModelRanking = {
  candidateId: string;
  candidateName: string;
  provider: string;
  model: string;
  totalScore: number;
  confidence: Confidence;
  averageLatencyMs: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  dimensionAverages: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
};

export type Recommendation = {
  candidateId: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "risk";
};

export type ReportSummary = {
  topic: string;
  language: Language;
  scenarioCount: number;
  taskCount: number;
  candidateCount: number;
  judgeCount: number;
  totalModelCalls: number;
  totalJudgeCalls: number;
  bestModel?: string;
};

export type EvaluationReport = {
  id: string;
  topic: string;
  language: Language;
  createdAt: string;
  rubric: Rubric;
  summary: ReportSummary;
  modelRankings: ModelRanking[];
  scenarioResults: ScenarioResult[];
  recommendations: Recommendation[];
  rawData?: unknown;
};

export type ScenarioGenerationRequest = {
  topic: string;
  language: Language;
  scenarioCount: number;
  tasksPerScenario: number;
  difficulty: DifficultyOption;
};

export type EvaluationRunOptions = {
  retries: number;
  timeoutMs: number;
  enableDeterministicChecks: boolean;
};

export type EvaluationRunRequest = {
  topic: string;
  language: Language;
  scenarios: Scenario[];
  rubric: Rubric;
  candidates: ProviderConfig[];
  judges: ProviderConfig[];
  options: EvaluationRunOptions;
};

export type EvaluationProgress = {
  phase:
    | "candidate_call"
    | "judge_call"
    | "aggregate"
    | "report"
    | "completed"
    | "failed";
  completed: number;
  total: number;
  message: string;
};
