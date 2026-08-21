import { describe, expect, it } from "vitest";
import { createWorkbenchRuntime } from "../src/workbench/runtime.js";

describe("P4 WorkbenchService", () => {
  it("advances reviewed reality, analyzes the selected Position, and preserves cutoff replay", async () => {
    const runtime = createWorkbenchRuntime(":memory:");
    const initial = runtime.service.snapshot();
    expect(initial.product.mode).toBe("synthetic-demo");
    expect(initial.selectedPositionId).toBe("position-syn-004");
    expect(initial.graph.nodes).toHaveLength(6);
    expect(initial.timeline).toHaveLength(4);
    expect(initial.timeline.every((item) => item.cutoffStatus === "available")).toBe(true);
    expect(initial.timeline.every((item) => item.resultingPositionId && initial.positions.some((position) => position.id === item.resultingPositionId))).toBe(true);
    expect(initial.trace.methods).toHaveLength(1);
    expect(initial.trace.evidence.every((item) => !("payload" in item) && !("locator" in item))).toBe(true);

    const historical = runtime.service.snapshot("position-syn-001");
    expect(historical.timeline.filter((item) => item.cutoffStatus === "available").map((item) => item.id)).toEqual(["event-syn-ask"]);
    expect(historical.timeline.filter((item) => item.cutoffStatus === "hindsight")).toHaveLength(3);
    expect(historical.trace.evidence.map((item) => item.id)).toEqual(["evidence-syn-scope", "evidence-syn-ask"]);
    expect(historical.trace.analyses).toHaveLength(0);
    expect(historical.branches).toHaveLength(0);
    expect(() => runtime.service.snapshot("missing-position")).toThrow("Position not found");

    const beforeCounts = {
      evidence: runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number },
      claims: runtime.store.db.prepare("SELECT COUNT(*) AS count FROM claims").get() as { count: number },
      events: runtime.store.db.prepare("SELECT COUNT(*) AS count FROM events").get() as { count: number },
      positions: runtime.store.db.prepare("SELECT COUNT(*) AS count FROM positions").get() as { count: number },
      profiles: runtime.store.db.prepare("SELECT COUNT(*) AS count FROM profile_snapshots").get() as { count: number },
    };
    const stageId = runtime.service.stageEvidence({ text: "A new synthetic checkpoint was recorded.", observedAt: "2026-08-17T10:25:00Z" });
    expect(runtime.service.stageEvidence({ text: "A new synthetic checkpoint was recorded.", observedAt: "2026-08-17T10:25:00Z" })).toBe(stageId);
    expect(runtime.service.snapshot().staging.find((item) => item.id === stageId)).toMatchObject({ status: "staged", preview: "A new synthetic checkpoint was recorded." });
    runtime.service.reviewEvidence(stageId, "accept");

    let current = runtime.service.snapshot();
    const observedPositionId = current.selectedPositionId;
    expect(observedPositionId).toMatch(/^position-web-observed-/);
    expect(current.timeline.at(-1)).toMatchObject({ type: "observed-note", cutoffStatus: "available", resultingPositionId: observedPositionId });
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number }).count).toBe(beforeCounts.evidence.count + 1);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM claims").get() as { count: number }).count).toBe(beforeCounts.claims.count + 1);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count).toBe(beforeCounts.events.count + 1);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM positions").get() as { count: number }).count).toBe(beforeCounts.positions.count + 1);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM profile_snapshots").get() as { count: number }).count).toBe(beforeCounts.profiles.count + 1);
    expect(runtime.service.snapshot("position-syn-001").trace.evidence.map((item) => item.id)).toEqual(["evidence-syn-scope", "evidence-syn-ask"]);

    const rootProjection = current.positions.find((position) => position.id === observedPositionId)!.projection;
    const runId = await runtime.service.analyze(observedPositionId);
    current = runtime.service.snapshot(observedPositionId);
    expect((runtime.store.db.prepare("SELECT root_position_id FROM search_runs WHERE id = ?").get(runId) as { root_position_id: string }).root_position_id).toBe(observedPositionId);
    expect(current.trace.analyses).toHaveLength(1);
    expect(current.branches).toHaveLength(6);
    expect(new Set(current.branches.map((branch) => branch.purpose))).toEqual(new Set(["forecast", "counterfactual", "exploratory"]));
    const rootBranches = current.branches.filter((branch) => branch.depth === 1);
    expect(new Set(rootBranches.map((branch) => JSON.stringify(current.positions.find((position) => position.id === branch.positionId)!.projection))).size).toBe(3);
    expect(rootBranches.every((branch) => JSON.stringify(current.positions.find((position) => position.id === branch.positionId)!.projection) !== JSON.stringify(rootProjection))).toBe(true);
    const flowBranch = rootBranches.find((branch) => branch.title === "Broaden the consultation")!;
    expect(runtime.service.snapshot(flowBranch.positionId).graph.flows.map((flow) => flow.id)).toEqual(["flow-syn-shared-channel"]);
    expect(runtime.service.snapshot("position-syn-001").trace.analyses).toHaveLength(0);
    expect(runtime.service.snapshot("position-syn-001").branches).toHaveLength(0);

    expect(current.searchRuns.find((item) => item.id === runId)?.status).toBe("paused-budget");
    await runtime.service.resume(runId);
    expect(runtime.service.snapshot(observedPositionId).searchRuns.find((item) => item.id === runId)?.status).toBe("completed");
    const forecast = current.branches.find((branch) => branch.purpose === "forecast")!;
    runtime.service.pin(forecast.id);
    expect(runtime.service.snapshot(runtime.service.replay(forecast.id)).selectedPositionId).toBe(forecast.positionId);
    await runtime.service.fork(forecast.id);
    expect(runtime.service.snapshot(observedPositionId).branches.find((branch) => branch.id === forecast.id)?.state).toBe("pinned");

    const proposal = current.revisionProposals.find((item) => item.reviewStatus === "accepted")!;
    expect(proposal.applied).toBe(false);
    runtime.service.applyRevision(proposal.id);
    const revised = runtime.service.snapshot();
    expect(revised.selectedPositionId).not.toBe(observedPositionId);
    expect(revised.revisionProposals.find((item) => item.id === proposal.id)?.applied).toBe(true);
    expect(revised.graph.nodes.find((node) => node.id === proposal.subjectNodeId)?.claims.some((claim) => claim.id === proposal.proposedClaimId)).toBe(true);
    expect(revised.trace.evidence.some((item) => item.id.startsWith("evidence-web-"))).toBe(true);
    expect(runtime.service.snapshot(observedPositionId).positions.find((position) => position.id === observedPositionId)?.profileSnapshotId).toMatch(/^profile-web-/);
    runtime.close();
  });

  it("keeps assessment history on one branch and applies both world-time boundaries", async () => {
    const runtime = createWorkbenchRuntime(":memory:");
    const positionId = runtime.service.snapshot().selectedPositionId;
    await runtime.service.analyze(positionId);
    const forecast = runtime.service.snapshot(positionId).branches.find((branch) => branch.purpose === "forecast")!;
    const insert = runtime.store.db.prepare(`INSERT INTO forecast_assessments (
      id, forecast_variation_id, forecast_transition_refs_json, actual_event_refs_json,
      actual_transition_refs_json, status, horizon, rubric_id, observation_coverage_id,
      assessor, assessed_at, rationale, assessment_identity
    ) VALUES (?, ?, '[]', '[]', '[]', ?, '{}', 'test-rubric', NULL, 'test', ?, ?, ?)`);
    insert.run("assessment-test-matched", forecast.id, "matched", "2026-08-17T10:22:00Z", "first", "identity-matched");
    insert.run("assessment-test-diverged", forecast.id, "diverged", "2026-08-17T10:23:00Z", "later", "identity-diverged");
    runtime.store.db.prepare("INSERT INTO events (id, event_type, mode, occurred_time, recorded_at, claim_refs_json) VALUES (?, 'test', 'actual', ?, ?, '[]')")
      .run("event-recorded-before-occurrence", "2026-08-17T10:30:00Z", "2026-08-17T10:00:00Z");

    const snapshot = runtime.service.snapshot(positionId);
    expect(snapshot.branches).toHaveLength(6);
    expect(snapshot.branches.find((branch) => branch.id === forecast.id)).toMatchObject({
      realization: "diverged",
      assessmentHistory: [
        { id: "assessment-test-matched", status: "matched" },
        { id: "assessment-test-diverged", status: "diverged" },
      ],
    });
    expect(snapshot.timeline.find((event) => event.id === "event-recorded-before-occurrence")?.cutoffStatus).toBe("hindsight");
    runtime.close();
  });

  it("fails closed on invalid evidence, selected Positions, and branch identities", async () => {
    const runtime = createWorkbenchRuntime(":memory:");
    expect(() => runtime.service.stageEvidence({ text: "", observedAt: "2026-08-17T10:25:00Z" })).toThrow("required");
    expect(() => runtime.service.stageEvidence({ text: "synthetic", observedAt: "not-a-time" })).toThrow("invalid");
    expect(() => runtime.service.pin("missing-variation")).toThrow("not found");
    await expect(runtime.service.analyze("missing-position")).rejects.toThrow("Position not found");
    runtime.close();
  });
});
