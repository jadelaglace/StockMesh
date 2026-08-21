import { expect, test } from "@playwright/test";

test("completes the visible P4 synthetic workflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByText("StockMesh", { exact: true })).toBeVisible();
  if (testInfo.project.name.startsWith("desktop")) await expect(page.getByText("Public synthetic data")).toBeVisible();
  await expect(page.getByText("Horizon / evidence cutoff")).toBeVisible();
  await expect(page.getByTestId("graph-board")).toBeVisible();

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "timeline", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Main Line at cutoff" })).toBeVisible();
  await page.getByLabel("As-of position").selectOption("position-syn-001");
  await expect(page.getByRole("heading", { name: "Later Main Line · hindsight" })).toBeVisible();
  await page.getByLabel("As-of position").selectOption("position-syn-004");

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "analysis", exact: true }).click();
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
  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "branches", exact: true }).click();
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

  if (testInfo.project.name.startsWith("mobile")) await page.getByRole("button", { name: "board", exact: true }).click();
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
