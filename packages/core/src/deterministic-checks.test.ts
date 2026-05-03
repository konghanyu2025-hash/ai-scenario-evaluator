import { describe, expect, it } from "vitest";
import { runDeterministicChecks } from "./deterministic-checks";

describe("deterministic checks", () => {
  it("detects invalid json when json output is required", () => {
    const checks = runDeterministicChecks(
      {
        id: "task",
        input: "input",
        instructions: "return json",
        expectedCapabilities: ["format"],
        constraints: ["输出必须是合法 JSON"],
        outputFormat: "json"
      },
      "{ missing: true"
    );

    expect(checks.find((check) => check.id === "valid_json")?.passed).toBe(false);
  });
});
