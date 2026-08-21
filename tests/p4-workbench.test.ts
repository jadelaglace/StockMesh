import { describe, expect, it } from "vitest";
import { createWorkbenchRuntime } from "../src/workbench/runtime.js";

describe("P4 WorkbenchService", () => {
  it("completes the synthetic stage, inspect, analyze, branch, replay, and correction loop", async () => {
    const runtime = createWorkbenchRuntime(":memory:");
    const initial = runtime.service.snapshot();
    expect(initial.product.mode).toBe("synthetic-demo");
    expect(initial.graph.nodes).toHaveLength(6);
    expect(initial.timeline).toHaveLength(4);
    expect(initial.timeline.some((item) => item.cutoffStatus === "available")).toBe(true);
    expect(initial.timeline.some((item) => item.cutoffStatus === "hindsight")).toBe(true);
    expect(initial.graph.flows.map((flow) => flow.id)).toEqual(initial.positions.find((position) => position.id === initial.selectedPositionId)?.projection.flow_ids);
    expect(initial.trace.methods).toHaveLength(1);
    expect(initial.trace.evidence.every((item) => !("payload" in item) && !("locator" in item))).toBe(true);
    expect(initial.context).toMatchObject({ riskPolicy: "balanced-synthetic-risk", evaluationProfile: "organizational-synthetic@1.0.0" });

    const before = runtime.service.snapshot("position-web-before");
    expect(before.graph.nodes.find((node) => node.id === "node-syn-sponsor")?.claims.some((claim) => claim.id === "claim-syn-ask")).toBe(false);
    expect(() => runtime.service.snapshot("missing-position")).toThrow("Position not found");

    const stageId = runtime.service.stageEvidence({ text: "A new synthetic checkpoint was recorded.", observedAt: "2026-08-17T10:25:00Z" });
    expect(runtime.service.stageEvidence({ text: "A new synthetic checkpoint was recorded.", observedAt: "2026-08-17T10:25:00Z" })).toBe(stageId);
    expect(runtime.service.snapshot().staging.filter((item) => item.id === stageId)).toHaveLength(1);
    expect(runtime.service.snapshot().staging.find((item) => item.id === stageId)?.status).toBe("staged");
    expect(runtime.service.snapshot().staging.find((item) => item.id === stageId)?.preview).toBe("A new synthetic checkpoint was recorded.");
    runtime.service.reviewEvidence(stageId, "accept");
    expect(runtime.service.snapshot().staging.find((item) => item.id === stageId)?.status).toBe("accepted");

    const rootProjection = initial.positions.find((position) => position.id === "position-web-current")?.projectionIdentity;
    const runId = await runtime.service.analyze();
    let analyzed = runtime.service.snapshot();
    expect(new Set(analyzed.branches.map((branch) => branch.purpose))).toEqual(new Set(["forecast", "counterfactual", "exploratory"]));
    expect(analyzed.branches).toHaveLength(6);
    expect(analyzed.branches[0]?.action).toBe("Clarify the decision boundary");
    expect(analyzed.timeline.some((item) => item.cutoffStatus === "variation")).toBe(true);
    expect(analyzed.branches.every((branch) => branch.evaluation.riskPolicy === "balanced-synthetic-risk" && branch.evaluation.evidenceCutoff === initial.context.evidenceCutoff)).toBe(true);
    expect(analyzed.searchRuns.find((item) => item.id === runId)?.status).toBe("paused-budget");
    await runtime.service.resume(runId);
    expect(runtime.service.snapshot().searchRuns.find((item) => item.id === runId)?.status).toBe("completed");
    const forecast = analyzed.branches.find((branch) => branch.purpose === "forecast");
    expect(forecast).toBeDefined();
    runtime.service.pin(forecast!.id);
    const replayPositionId = runtime.service.replay(forecast!.id);
    expect(runtime.service.snapshot(replayPositionId).selectedPositionId).toBe(forecast!.positionId);
    await runtime.service.fork(forecast!.id);
    expect(runtime.service.snapshot().branches.find((branch) => branch.id === forecast!.id)?.state).toBe("pinned");
    expect(runtime.service.snapshot().searchRuns.some((run) => run.id === runId)).toBe(true);

    const proposal = analyzed.revisionProposals.find((item) => item.reviewStatus === "accepted");
    expect(proposal?.applied).toBe(false);
    runtime.service.applyRevision(proposal!.id);
    analyzed = runtime.service.snapshot();
    expect(analyzed.revisionProposals.find((item) => item.id === proposal!.id)?.applied).toBe(true);
    expect(analyzed.profileHistory.length).toBeGreaterThan(initial.profileHistory.length);
    expect(analyzed.positions.find((position) => position.id === "position-web-current")?.projectionIdentity).toBe(rootProjection);
    expect(analyzed.graph.nodes.find((node) => node.id === proposal!.subjectNodeId)?.claims.some((claim) => claim.id === proposal!.proposedClaimId)).toBe(false);
    runtime.close();
  });

  it("fails closed on invalid evidence and branch identities", () => {
    const runtime = createWorkbenchRuntime(":memory:");
    expect(() => runtime.service.stageEvidence({ text: "", observedAt: "2026-08-17T10:25:00Z" })).toThrow("required");
    expect(() => runtime.service.stageEvidence({ text: "synthetic", observedAt: "not-a-time" })).toThrow("invalid");
    expect(() => runtime.service.pin("missing-variation")).toThrow("not found");
    runtime.close();
  });
});
