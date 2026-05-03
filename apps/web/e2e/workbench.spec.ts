import { expect, test } from "@playwright/test";

test("runs the mock workbench flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "场景化模型评测" })).toBeVisible();
  await page.getByRole("button", { name: "生成场景" }).click();
  await expect(page.getByText("已生成")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "运行评测" }).click();
  await expect(page.getByRole("heading", { name: "评测报告" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("cell", { name: "Mock Balanced" })).toBeVisible();
});
