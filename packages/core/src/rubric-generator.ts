import type { Rubric, RubricDimension } from "@aise/shared";

export function generateRubric(topic: string, language = "zh-CN"): Rubric {
  const zh = language === "zh-CN";
  const dimensions: RubricDimension[] = [
    {
      id: "task_completion",
      name: zh ? "任务完成度" : "Task completion",
      description: zh
        ? `是否完整解决“${topic}”场景中的用户目标。`
        : `How completely the response solves the user goal in ${topic}.`,
      weight: 25,
      scale: { min: 0, max: 5 }
    },
    {
      id: "accuracy",
      name: zh ? "准确性" : "Accuracy",
      description: zh ? "事实、推理和领域判断是否可靠。" : "Reliability of facts, reasoning, and domain judgment.",
      weight: 20,
      scale: { min: 0, max: 5 }
    },
    {
      id: "constraint_following",
      name: zh ? "约束遵守" : "Constraint following",
      description: zh ? "是否遵守格式、语言、长度、字段和禁止项。" : "Compliance with format, language, length, fields, and forbidden items.",
      weight: 20,
      scale: { min: 0, max: 5 }
    },
    {
      id: "risk_control",
      name: zh ? "风险控制" : "Risk control",
      description: zh ? "是否识别不确定性、合规风险和需要人工复核的边界。" : "Identification of uncertainty, compliance risk, and handoff boundaries.",
      weight: 20,
      scale: { min: 0, max: 5 }
    },
    {
      id: "usability",
      name: zh ? "可用性" : "Usability",
      description: zh ? "输出是否清晰、可执行、适合真实用户使用。" : "Clarity, actionability, and usefulness for real users.",
      weight: 15,
      scale: { min: 0, max: 5 }
    }
  ];

  return {
    dimensions,
    totalWeight: dimensions.reduce((sum, dimension) => sum + dimension.weight, 0)
  };
}
