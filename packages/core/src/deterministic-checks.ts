import type { DeterministicCheck, TaskCase } from "@aise/shared";

export function runDeterministicChecks(task: TaskCase, output: string): DeterministicCheck[] {
  const checks: DeterministicCheck[] = [];
  const trimmed = output.trim();

  checks.push({
    id: "non_empty",
    name: "非空输出",
    passed: trimmed.length > 0,
    severity: "error",
    message: trimmed.length > 0 ? "模型返回了内容。" : "模型输出为空。",
    penalty: trimmed.length > 0 ? 0 : 25
  });

  const maxLength = extractMaxLength(task.constraints);
  if (maxLength) {
    const length = [...trimmed].length;
    checks.push({
      id: "max_length",
      name: "长度限制",
      passed: length <= maxLength,
      severity: "warning",
      message: length <= maxLength ? `输出长度 ${length}/${maxLength}。` : `输出长度 ${length} 超过限制 ${maxLength}。`,
      penalty: length <= maxLength ? 0 : 8
    });
  }

  if (task.outputFormat === "json" || hasConstraint(task, /合法\s*JSON|valid\s*JSON/i)) {
    let valid = true;
    try {
      JSON.parse(trimmed);
    } catch {
      valid = false;
    }
    checks.push({
      id: "valid_json",
      name: "JSON 格式",
      passed: valid,
      severity: "error",
      message: valid ? "输出是合法 JSON。" : "输出不是合法 JSON。",
      penalty: valid ? 0 : 18
    });
  }

  if (hasConstraint(task, /必须使用中文|Use Chinese/i)) {
    const hasCjk = /[\u3400-\u9fff]/.test(trimmed);
    checks.push({
      id: "language_zh",
      name: "中文输出",
      passed: hasCjk,
      severity: "warning",
      message: hasCjk ? "输出包含中文内容。" : "输出可能未按要求使用中文。",
      penalty: hasCjk ? 0 : 8
    });
  }

  if (hasConstraint(task, /Use English|必须使用英文/i)) {
    const mostlyAscii = trimmed.length === 0 ? false : /^[\x00-\x7F\s\S]*$/.test(trimmed.slice(0, 300));
    checks.push({
      id: "language_en",
      name: "English output",
      passed: mostlyAscii,
      severity: "warning",
      message: mostlyAscii ? "Output is compatible with English constraints." : "Output may not be English.",
      penalty: mostlyAscii ? 0 : 8
    });
  }

  if (hasConstraint(task, /不能编造|Do not invent/i)) {
    const risky = /(肯定|保证|绝对|一定|guarantee|definitely|certainly)/i.test(trimmed);
    checks.push({
      id: "overclaiming",
      name: "过度承诺",
      passed: !risky,
      severity: "warning",
      message: risky ? "输出可能存在过度承诺。" : "未发现明显过度承诺。",
      penalty: risky ? 6 : 0
    });
  }

  return checks;
}

function hasConstraint(task: TaskCase, pattern: RegExp): boolean {
  return task.constraints.some((constraint) => pattern.test(constraint));
}

function extractMaxLength(constraints: string[]): number | undefined {
  for (const constraint of constraints) {
    const match = constraint.match(/(?:不超过|under|less than)\s*(\d+)\s*(?:字|words)?/i);
    if (match?.[1]) return Number(match[1]);
  }
  return undefined;
}
