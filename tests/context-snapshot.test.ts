import { describe, expect, it } from "vitest";
import { p3Objectives, createP3Harness } from "./p3-helpers.js";

describe("P3 frozen context", () => {
  it("binds complete Position and Method output and invalidates changed context", () => {
    const harness = createP3Harness();
    const base = {
      positionId: "position-method-after",
      branchPath: [],
      objectives: p3Objectives,
      horizon: "2026-08-17T10:30:00Z",
      riskPolicy: "balanced-synthetic-risk",
      evaluationProfile: "organizational-synthetic@1.0.0",
      methodRunIds: [harness.methodRun.id],
      contextManifest: { fixture: "p3-synthetic" },
    };
    const first = harness.possibilities.createContext({ ...base, unknowns: ["unknown A"] });
    const replay = harness.possibilities.createContext({ ...base, unknowns: ["unknown A"] });
    const changed = harness.possibilities.createContext({ ...base, unknowns: ["unknown B"] });
    expect(replay).toEqual(first);
    expect(changed.snapshotIdentity).not.toBe(first.snapshotIdentity);
    expect(first.positionProjection.active_node_ids.length).toBeGreaterThan(0);
    expect(JSON.stringify(first.contextManifest)).toContain(harness.methodRun.outputIdentity);
    expect(first.evidenceCutoff).toBe("2026-08-17T09:11:00Z");
    harness.store.close();
  });
});
