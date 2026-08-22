import { expect, test } from "@playwright/test";

test("switches and retains complete Simplified Chinese chrome without clipping the Position panel", async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith("desktop")) await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "简中", exact: true }).click();
  await expect(page.getByRole("button", { name: "简中", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("推演时限 / 证据截止")).toBeVisible();
  await expect(page.getByRole("heading", { name: "局势", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sponsor", exact: true })).toBeVisible();
  await expect(page.getByText("Which response best improves decision clarity without unnecessary escalation?", { exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith("desktop")) {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 720 }]) {
      await page.setViewportSize(viewport);
      const layout = await page.locator(".board-panel").evaluate((panel) => {
        const delta = panel.querySelector<HTMLElement>(".comparison-strip")!;
        const panelRect = panel.getBoundingClientRect();
        const deltaRect = delta.getBoundingClientRect();
        return { panelBottom: panelRect.bottom, deltaBottom: deltaRect.bottom, panelClientHeight: panel.clientHeight, panelScrollHeight: panel.scrollHeight };
      });
      expect(layout.deltaBottom).toBeLessThanOrEqual(layout.panelBottom + 1);
      expect(layout.panelScrollHeight).toBeLessThanOrEqual(layout.panelClientHeight + 1);
    }
  }
  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "分析", exact: true }).click();
  await page.getByRole("button", { name: "运行局势分析", exact: true }).click();
  await expect(page.getByText("分析和有界分支搜索已完成。")).toBeVisible();
  await expect(page.getByText("已成功", { exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "分支", exact: true }).click();
  await expect(page.getByText("不适用", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("候选", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("达到最大深度", { exact: true })).toBeVisible();
  await expect(page.locator(".branch-panel").getByText("Clarify the decision boundary", { exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("stockmesh.locale"))).toBe("zh-CN");
  await page.reload();
  await expect(page.getByRole("button", { name: "简中", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("completes the visible P4 synthetic workflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByText("StockMesh", { exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith("desktop")) await expect(page.getByText("Public synthetic data")).toBeVisible();
  await expect(page.getByText("Horizon / evidence cutoff")).toBeVisible();
  await expect(page.getByTestId("graph-board")).toBeVisible();

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Main Line at cutoff" })).toBeVisible();
  await page.getByLabel("As-of position").selectOption("position-syn-001");
  await expect(page.getByRole("heading", { name: "Later Main Line · hindsight" })).toBeVisible();
  await page.getByLabel("As-of position").selectOption("position-syn-004");

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "Analysis", exact: true }).click();
  await page.route("**/api/evidence/stage", async (route) => { await new Promise((resolve) => setTimeout(resolve, 150)); await route.continue(); }, { times: 1 });
  await page.getByPlaceholder("Record what happened next...").fill(`A synthetic decision checkpoint was confirmed by ${testInfo.project.name}.`);
  await page.getByRole("button", { name: "Stage for review" }).click();
  await expect(page.getByRole("button", { name: "Staging..." })).toBeVisible();
  await expect(page.getByText("Evidence is staged for human review.")).toBeVisible();
  await page.getByTitle("Accept evidence").click();
  await expect(page.getByText("Evidence accepted.")).toBeVisible();

  await page.getByRole("button", { name: "Run position analysis" }).click();
  await expect(page.getByText("Analysis and bounded branch search completed.")).toBeVisible();
  await expect(page.getByText("deterministic-offline / p4-workbench").first()).toBeVisible();
  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "Branches", exact: true }).click();
  await expect(page.getByText("purpose: forecast").first()).toBeVisible();
  await expect(page.getByText("Score uncertainty")).toBeVisible();
  await expect(page.getByLabel("Compare branch")).toBeVisible();
  await page.getByTitle("Pin variation").click();
  await expect(page.getByText("Variation pinned without changing Main Line history.")).toBeVisible();
  await page.getByTitle("Replay frozen context").click();
  await expect(page.getByText("Variation replayed with its frozen context.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Checked out" })).toBeDisabled();
  const resume = page.getByRole("button", { name: "Resume + budget" });
  if (await resume.isVisible()) {
    await resume.click();
    await expect(page.getByText("Search resumed with an expanded explicit budget.")).toBeVisible();
  } else {
    await expect(page.getByText("completed", { exact: true })).toBeVisible();
  }

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "Board", exact: true }).click();
  await page.getByRole("button", { name: "Sponsor" }).click();
  await expect(page.getByRole("heading", { name: "Sponsor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Relations & flows" })).toBeVisible();
  await expect(page.getByText("decision authority", { exact: true })).toBeVisible();
  await expect(page.getByText("No stance Claim at this cutoff")).toBeVisible();
  await expect(page.getByText("Selected snapshot")).toBeVisible();
  const acceptedRevision = page.getByRole("article").filter({ hasText: "prior-estimate-error" });
  const apply = acceptedRevision.getByRole("button");
  if (await apply.isEnabled()) {
    await apply.click();
    await expect(page.getByText("Reviewed Claim revision appended; historical snapshots remain unchanged.")).toBeVisible();
    await expect(page.getByText("Later or alternate snapshot").first()).toBeVisible();
  }
  await expect(acceptedRevision.getByRole("button", { name: "Applied append-only" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Awaiting review" }).first()).toBeDisabled();
});
