import {
  createId,
  parseMaybeJson,
  scenarioSchema,
  type Difficulty,
  type ModelProvider,
  type Scenario,
  type ScenarioGenerationRequest,
  type TaskCase
} from "@aise/shared";

type ScenarioGeneratorOptions = {
  provider?: ModelProvider;
};

export async function generateScenarios(
  request: ScenarioGenerationRequest,
  options: ScenarioGeneratorOptions = {}
): Promise<Scenario[]> {
  if (options.provider) {
    const aiScenarios = await generateWithProvider(request, options.provider);
    if (aiScenarios.length > 0) return aiScenarios;
  }

  return generateDeterministicScenarios(request);
}

async function generateWithProvider(
  request: ScenarioGenerationRequest,
  provider: ModelProvider
): Promise<Scenario[]> {
  const zh = request.language === "zh-CN";
  const prompt = zh
    ? `你是 AI 模型评测专家。请为主题“${request.topic}”生成 ${request.scenarioCount} 个真实业务应用场景，每个场景 ${request.tasksPerScenario} 个任务。只输出 JSON 数组，字段必须是 id,title,domain,userRole,businessGoal,difficulty,taskCases。taskCases 字段必须包含 id,input,instructions,expectedCapabilities,constraints,outputFormat。difficulty 只能是 easy/medium/hard，outputFormat 只能是 plain_text/json/markdown。`
    : `You are an AI model evaluation expert. Generate ${request.scenarioCount} realistic application scenarios for "${request.topic}", with ${request.tasksPerScenario} task cases each. Return only a JSON array with id,title,domain,userRole,businessGoal,difficulty,taskCases. Task cases must include id,input,instructions,expectedCapabilities,constraints,outputFormat.`;

  try {
    const output = await provider.generate({ prompt, responseFormat: "json", temperature: 0.2, maxTokens: 3200 });
    const parsed = parseMaybeJson<unknown>(output.text);
    const items = Array.isArray(parsed) ? parsed : [];
    const scenarios = items
      .map((item, index) =>
        scenarioSchema.safeParse({
          ...(item as Record<string, unknown>),
          id: (item as { id?: string }).id || createId(`scenario_${index + 1}`)
        })
      )
      .filter((result) => result.success)
      .map((result) => result.data)
      .slice(0, request.scenarioCount);

    return scenarios.length === request.scenarioCount ? scenarios : [];
  } catch {
    return [];
  }
}

function generateDeterministicScenarios(request: ScenarioGenerationRequest): Scenario[] {
  const scenarioCount = clampCount(request.scenarioCount, 1, 10);
  const tasksPerScenario = clampCount(request.tasksPerScenario, 1, 5);
  const zh = request.language === "zh-CN";
  const templates = zh ? zhTemplates(request.topic) : enTemplates(request.topic);

  return Array.from({ length: scenarioCount }, (_, index) => {
    const template = templates[index % templates.length]!;
    const difficulty = pickDifficulty(request.difficulty, index);
    return {
      id: `scenario_${index + 1}`,
      title: template.title,
      domain: template.domain,
      userRole: template.userRole,
      businessGoal: template.businessGoal,
      difficulty,
      taskCases: Array.from({ length: tasksPerScenario }, (__, taskIndex) =>
        buildTaskCase({
          topic: request.topic,
          zh,
          scenarioIndex: index,
          taskIndex,
          difficulty,
          template
        })
      )
    };
  });
}

function buildTaskCase(input: {
  topic: string;
  zh: boolean;
  scenarioIndex: number;
  taskIndex: number;
  difficulty: Difficulty;
  template: ScenarioTemplate;
}): TaskCase {
  const outputFormat = input.taskIndex % 3 === 1 ? "json" : input.taskIndex % 3 === 2 ? "markdown" : "plain_text";
  const hard = input.difficulty === "hard";

  if (input.zh) {
    return {
      id: `task_${input.scenarioIndex + 1}_${input.taskIndex + 1}`,
      input: `${input.template.inputSeed}\n\n补充信息：用户目标与“${input.topic}”高度相关，当前存在${hard ? "多方约束、信息缺失和潜在合规风险" : "时间限制和信息不完整"}。`,
      instructions: `${input.template.instructions}请给出可直接用于真实业务的回答。`,
      expectedCapabilities: ["理解真实场景", "完成核心任务", "遵守格式和边界", "识别风险", "输出可执行方案"],
      constraints: [
        "必须使用中文",
        "必须先回应用户当前诉求",
        "不能编造无法确认的事实或政策",
        "必须给出下一步操作",
        outputFormat === "json" ? "输出必须是合法 JSON" : "输出不超过 500 字",
        hard ? "必须标记需要人工复核的风险" : "语气必须清晰专业"
      ],
      outputFormat
    };
  }

  return {
    id: `task_${input.scenarioIndex + 1}_${input.taskIndex + 1}`,
    input: `${input.template.inputSeed}\n\nContext: the user goal is strongly related to "${input.topic}" and includes ${hard ? "conflicting constraints, missing facts, and compliance risk" : "time pressure and incomplete information"}.`,
    instructions: `${input.template.instructions} Produce an answer that could be used in a real workflow.`,
    expectedCapabilities: ["Understand the scenario", "Complete the task", "Follow constraints", "Identify risks", "Provide actionable next steps"],
    constraints: [
      "Use English",
      "Address the user's immediate need first",
      "Do not invent unverified facts or policies",
      "Include concrete next steps",
      outputFormat === "json" ? "Output valid JSON" : "Keep the answer under 500 words",
      hard ? "Flag risks requiring human review" : "Use a clear professional tone"
    ],
    outputFormat
  };
}

type ScenarioTemplate = {
  title: string;
  domain: string;
  userRole: string;
  businessGoal: string;
  inputSeed: string;
  instructions: string;
};

function zhTemplates(topic: string): ScenarioTemplate[] {
  return [
    {
      title: `${topic} - 高压用户请求处理`,
      domain: topic,
      userRole: "情绪紧张的一线用户",
      businessGoal: "在不扩大风险的前提下解决用户问题",
      inputSeed: "用户表示已经等待很久，并要求立即给出明确处理方案。",
      instructions: "请安抚用户、澄清关键信息，并给出可执行处理路径。"
    },
    {
      title: `${topic} - 结构化信息抽取`,
      domain: topic,
      userRole: "需要自动化处理的运营人员",
      businessGoal: "把非结构化输入转为可进入工作流的数据",
      inputSeed: "运营人员提供了一段混乱记录，其中包含时间、责任人、问题描述和期望结果。",
      instructions: "请提取关键信息，补足必要字段，并标记不确定项。"
    },
    {
      title: `${topic} - 决策建议与风险边界`,
      domain: topic,
      userRole: "需要做业务决策的团队负责人",
      businessGoal: "获得可执行建议，同时明确风险和复核点",
      inputSeed: "团队负责人需要在预算、时效和质量之间快速做取舍。",
      instructions: "请给出方案比较、推荐路径和风险控制建议。"
    },
    {
      title: `${topic} - 内容生成与品牌一致性`,
      domain: topic,
      userRole: "负责对外沟通的内容人员",
      businessGoal: "产出符合品牌、场景和渠道限制的内容",
      inputSeed: "内容人员需要面向不同用户群体准备一版可发布文案。",
      instructions: "请生成内容并说明如何保持语气、事实和合规边界。"
    },
    {
      title: `${topic} - 异常输入与拒答边界`,
      domain: topic,
      userRole: "输入不完整或要求不合理的用户",
      businessGoal: "在信息不足或存在风险时仍保持有用",
      inputSeed: "用户只提供了部分背景，并要求模型直接给出确定结论。",
      instructions: "请识别缺口，避免过度承诺，并给出安全替代方案。"
    }
  ];
}

function enTemplates(topic: string): ScenarioTemplate[] {
  return [
    {
      title: `${topic} - High-pressure user request`,
      domain: topic,
      userRole: "An urgent end user",
      businessGoal: "Resolve the user's need without increasing operational risk",
      inputSeed: "The user says they have waited too long and asks for an immediate decision.",
      instructions: "Acknowledge the issue, clarify key facts, and provide an actionable path."
    },
    {
      title: `${topic} - Structured extraction`,
      domain: topic,
      userRole: "An operations teammate automating a workflow",
      businessGoal: "Convert messy text into workflow-ready information",
      inputSeed: "The teammate provides a messy record with time, owner, problem, and desired outcome.",
      instructions: "Extract the key details, fill required fields, and mark uncertain items."
    },
    {
      title: `${topic} - Decision support and risk boundaries`,
      domain: topic,
      userRole: "A team lead making a tradeoff",
      businessGoal: "Get a recommendation with clear risk and review points",
      inputSeed: "The team lead must choose between budget, speed, and quality constraints.",
      instructions: "Compare options, recommend a path, and include risk controls."
    },
    {
      title: `${topic} - Content generation with brand consistency`,
      domain: topic,
      userRole: "A communications operator",
      businessGoal: "Produce content that fits brand, channel, and compliance constraints",
      inputSeed: "The operator needs publish-ready copy for a specific audience.",
      instructions: "Generate the content and explain how tone, facts, and compliance are preserved."
    },
    {
      title: `${topic} - Ambiguous input and refusal boundary`,
      domain: topic,
      userRole: "A user with incomplete or unsafe requirements",
      businessGoal: "Stay useful when information is missing or risk exists",
      inputSeed: "The user gives partial context and demands a definite answer.",
      instructions: "Identify missing facts, avoid overclaiming, and provide a safe alternative."
    }
  ];
}

function pickDifficulty(difficulty: string, index: number): Difficulty {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") return difficulty;
  return (["easy", "medium", "hard"] as const)[index % 3]!;
}

function clampCount(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
