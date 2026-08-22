import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server/app.js";
import { createWorkbenchRuntime, type WorkbenchRuntime } from "../src/workbench/runtime.js";

let app: FastifyInstance | undefined;
let runtime: WorkbenchRuntime | undefined;

afterEach(async () => {
  if (app) await app.close();
  runtime?.close();
  app = undefined;
  runtime = undefined;
});

describe("P5 shared capability facade", () => {
  it("keeps HTTP and in-process Position context identities identical", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    app = await createServer(runtime, { serveWeb: false });
    const direct = await runtime.capabilities.execute("context.get", { positionId: "position-syn-001" });
    const response = await app.inject({ method: "POST", url: "/api/capabilities/context.get", payload: { positionId: "position-syn-001" } });
    expect(response.statusCode).toBe(200);
    const remote = response.json();
    expect(remote).toEqual(direct);
    expect(remote.positionId).toBe("position-syn-001");
    expect(remote.result.context.evidenceCutoff).toBe("2026-08-17T09:11:00Z");
    expect(remote.result.positions.find((position: { id: string }) => position.id === remote.positionId).profileSnapshotId).toBe("profile-snapshot-syn-root");
    expect(remote.result.trace.evidence.map((item: { id: string }) => item.id)).toEqual(["evidence-syn-scope", "evidence-syn-ask"]);
    expect(remote.result.trace.analyses).toEqual([]);
    expect(remote.result.branches).toEqual([]);
    expect(remote.result.positions.map((position: { id: string }) => position.id)).toEqual(["position-syn-001"]);
    expect(remote.result.timeline.every((item: { cutoffStatus: string }) => item.cutoffStatus !== "hindsight")).toBe(true);
    expect(remote.result.profileHistory.map((profile: { id: string }) => profile.id)).toEqual(["profile-snapshot-syn-root"]);
    expect(remote.result.staging).toEqual([]);
    expect(remote.result.revisionProposals).toEqual([]);

    const earliest = (await runtime.capabilities.execute("context.get", { positionId: "position-syn-000" })).result as WorkbenchSnapshot & {
      profileHistory: Array<{ asOf: string; evidenceCutoff: string }>;
    };
    expect(earliest.profileHistory.every((profile) => Date.parse(profile.asOf) <= Date.parse("2026-08-17T09:00:00Z")
      && Date.parse(profile.evidenceCutoff) <= Date.parse("2026-08-17T09:00:00Z"))).toBe(true);

    const analysis = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-001" });
    const result = analysis.result as { runId: string; snapshot: { selectedPositionId: string; trace: { analyses: unknown[] } } };
    expect(result.snapshot.selectedPositionId).toBe("position-syn-001");
    expect(result.snapshot.trace.analyses).toHaveLength(1);
    expect((runtime.store.db.prepare("SELECT root_position_id FROM search_runs WHERE id = ?").get(result.runId) as { root_position_id: string }).root_position_id).toBe("position-syn-001");
    expect((await runtime.capabilities.execute("context.get", { positionId: "position-syn-004" })).result).toMatchObject({ trace: { analyses: [] } });

    const currentAnalysis = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-004" });
    const currentSnapshot = (currentAnalysis.result as { snapshot: WorkbenchSnapshot }).snapshot;
    const selectedBranch = currentSnapshot.branches[0]!;
    const branchContext = (await runtime.capabilities.execute("context.get", { positionId: selectedBranch.positionId })).result as WorkbenchSnapshot;
    expect(branchContext.positions.map((position) => position.id)).toEqual([selectedBranch.positionId]);
    expect(branchContext.branches.map((branch) => branch.id)).toEqual([selectedBranch.id]);
    expect(branchContext.timeline.filter((item) => item.cutoffStatus === "variation").map((item) => item.resultingPositionId)).toEqual([selectedBranch.positionId]);
  });

  it("compares typed projection identities without a scalar and stages without canonical writes", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    const analyzed = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-004" });
    const snapshot = (analyzed.result as { snapshot: WorkbenchSnapshot }).snapshot;
    const branch = snapshot.branches.find((item) => item.title === "Broaden the consultation")!;
    const compared = await runtime.capabilities.execute("position.compare", {
      fromPositionId: "position-syn-004",
      toPositionId: branch.positionId,
    });
    expect(compared.result).toMatchObject({
      fromPositionId: "position-syn-004",
      toPositionId: branch.positionId,
      flows: { added: ["flow-syn-shared-channel"], removed: [] },
    });
    expect(compared.result).not.toHaveProperty("score");

    const evidenceBefore = runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number };
    const staged = await runtime.capabilities.execute("evidence.stage", { text: "P5 synthetic staged note", observedAt: "2026-08-17T10:25:00Z" });
    const repeated = await runtime.capabilities.execute("evidence.stage", { text: "P5 synthetic staged note", observedAt: "2026-08-17T10:25:00Z" });
    expect((staged.result as { stageId: string }).stageId).toBe((repeated.result as { stageId: string }).stageId);
    expect((staged.result as { staging: { status: string } }).staging.status).toBe("staged");
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number }).count).toBe(evidenceBefore.count);
    expect(runtime.store.db.prepare("SELECT review_decision FROM staging_items WHERE id = ?").get((staged.result as { stageId: string }).stageId)).toMatchObject({ review_decision: null });
  });

  it("fails closed on unknown capabilities and malformed identifiers", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    app = await createServer(runtime, { serveWeb: false });
    const stagingBefore = (runtime.store.db.prepare("SELECT COUNT(*) AS count FROM staging_items").get() as { count: number }).count;
    const evidenceBefore = (runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number }).count;
    await expect(runtime.capabilities.execute("evidence.accept", {})).rejects.toThrow("unsupported capability");
    await expect(runtime.capabilities.execute("analysis.run", {})).rejects.toThrow("positionId is required");
    await expect(runtime.capabilities.execute("workbench.get", [])).rejects.toThrow("JSON object");
    await expect(runtime.capabilities.execute("context.get", { position_id: "position-syn-001" })).rejects.toThrow("unsupported input field");
    await expect(runtime.capabilities.execute("evidence.stage", { text: "synthetic", observedAt: "not-a-time" })).rejects.toThrow("valid timestamp");
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM staging_items").get() as { count: number }).count).toBe(stagingBefore);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number }).count).toBe(evidenceBefore);
    const response = await app.inject({ method: "POST", url: "/api/capabilities/evidence.accept", payload: {} });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "workbench-command-rejected", message: "unsupported capability: evidence.accept" });
  });

  it("validates complete mutation requests before changing staging, branches, or search", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    const analyzed = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-004" });
    const result = analyzed.result as { runId: string; snapshot: WorkbenchSnapshot };
    const variation = result.snapshot.branches[0]!;
    const variationBefore = runtime.store.db.prepare("SELECT state FROM variations WHERE id = ?").get(variation.id) as { state: string };
    const searchBefore = runtime.store.db.prepare("SELECT budgets_json FROM search_runs WHERE id = ?").get(result.runId) as { budgets_json: string };
    const stagingBefore = (runtime.store.db.prepare("SELECT COUNT(*) AS count FROM staging_items").get() as { count: number }).count;
    const runsBefore = (runtime.store.db.prepare("SELECT COUNT(*) AS count FROM search_runs").get() as { count: number }).count;

    await expect(runtime.capabilities.execute("branch.pin", { variationId: variation.id, positionId: "missing-position" })).rejects.toThrow("Position not found");
    await expect(runtime.capabilities.execute("branch.fork", { variationId: variation.id, positionId: "missing-position" })).rejects.toThrow("Position not found");
    await expect(runtime.capabilities.execute("search.continue", { searchRunId: result.runId, positionId: "missing-position" })).rejects.toThrow("Position not found");
    await expect(runtime.capabilities.execute("evidence.stage", { text: "must not stage", observedAt: "2026-08-17T10:30:00Z", positionId: "missing-position" })).rejects.toThrow("Position not found");
    await expect(runtime.capabilities.execute("branch.pin", { variationId: variation.id, unexpected: true })).rejects.toThrow("unsupported input field");

    expect(runtime.store.db.prepare("SELECT state FROM variations WHERE id = ?").get(variation.id)).toEqual(variationBefore);
    expect(runtime.store.db.prepare("SELECT budgets_json FROM search_runs WHERE id = ?").get(result.runId)).toEqual(searchBefore);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM staging_items").get() as { count: number }).count).toBe(stagingBefore);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM search_runs").get() as { count: number }).count).toBe(runsBefore);
  });

  it("retries an existing failed search instead of wrapping it as succeeded", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    const first = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-004" });
    const runId = (first.result as { runId: string }).runId;
    runtime.store.db.prepare("UPDATE search_runs SET status = 'failed' WHERE id = ?").run(runId);

    const retried = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-004" });
    const retriedResult = retried.result as { runId: string; snapshot: WorkbenchSnapshot };
    expect(retriedResult.runId).toBe(runId);
    expect(retriedResult.snapshot.searchRuns.find((run) => run.id === runId)?.status).not.toBe("failed");
  });
});

interface WorkbenchSnapshot {
  positions: Array<{ id: string }>;
  timeline: Array<{ cutoffStatus: string; resultingPositionId?: string }>;
  branches: Array<{ id: string; title: string; positionId: string }>;
  searchRuns: Array<{ id: string; status: string }>;
}
