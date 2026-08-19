import { describe, expect, it } from "vitest";
import { createFixtureApp, projectDeltaPositions, rootPosition } from "./helpers.js";
import { createBuiltinMethodRegistry, MethodRunner } from "../src/methods/index.js";

describe("P2 synthetic workflow", () => {
  it("projects a P0/P1 Position and persists the selected attributable Method pack", () => {
    const { app, store } = createFixtureApp();
    app.projectPosition(rootPosition("position-p2-workflow", "2026-08-17T09:10:00Z"));
    projectDeltaPositions(app, "position-p2-workflow");
    const runner = new MethodRunner(store, createBuiltinMethodRegistry());
    const requests = [
      { positionId: "position-p2-workflow", methodId: "sna.foundation" },
      { positionId: "position-p2-workflow", methodId: "sna.pagerank" },
      { positionId: "position-p2-workflow", methodId: "sna.community-louvain", configuration: { resolutions: [1], seeds: [1, 2] } },
      { positionId: "position-p2-workflow", methodId: "sna.party-structural-vector", configuration: { objective: "decision clarity", horizon: "one day" } },
      { positionId: "position-p2-workflow", methodId: "sna.temporal-delta", configuration: { beforePositionId: "position-method-before" } },
    ];
    const runs = requests.map((request) => runner.run(request));
    expect(runs.every((run) => run.status === "succeeded" && run.outputIdentity.length === 64)).toBe(true);
    expect(app.count("method_runs")).toBe(5);
    expect(app.count("method_results")).toBe(5);
    expect(app.count("claims")).toBe(7);
    store.close();
  });
});
