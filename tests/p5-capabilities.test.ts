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

    const analysis = await runtime.capabilities.execute("analysis.run", { positionId: "position-syn-001" });
    const result = analysis.result as { runId: string; snapshot: { selectedPositionId: string; trace: { analyses: unknown[] } } };
    expect(result.snapshot.selectedPositionId).toBe("position-syn-001");
    expect(result.snapshot.trace.analyses).toHaveLength(1);
    expect((runtime.store.db.prepare("SELECT root_position_id FROM search_runs WHERE id = ?").get(result.runId) as { root_position_id: string }).root_position_id).toBe("position-syn-001");
    expect((await runtime.capabilities.execute("context.get", { positionId: "position-syn-004" })).result).toMatchObject({ trace: { analyses: [] } });
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
    await expect(runtime.capabilities.execute("evidence.stage", { text: "synthetic", observedAt: "not-a-time" })).rejects.toThrow("valid timestamp");
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM staging_items").get() as { count: number }).count).toBe(stagingBefore);
    expect((runtime.store.db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get() as { count: number }).count).toBe(evidenceBefore);
    const response = await app.inject({ method: "POST", url: "/api/capabilities/evidence.accept", payload: {} });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "workbench-command-rejected", message: "unsupported capability: evidence.accept" });
  });
});

interface WorkbenchSnapshot {
  branches: Array<{ title: string; positionId: string }>;
}
