import { describe, expect, it } from "vitest";
import { createFixtureApp, projectDeltaPositions } from "./helpers.js";
import { createBuiltinMethodRegistry, MethodRunner, type TemporalDeltaOutput } from "../src/methods/index.js";

describe("P2 temporal delta", () => {
  it("reports structural and metric changes with both Position time axes", () => {
    const { app, store } = createFixtureApp();
    projectDeltaPositions(app);
    const runner = new MethodRunner(store, createBuiltinMethodRegistry());
    const run = runner.run<TemporalDeltaOutput>({
      positionId: "position-method-delta-after",
      methodId: "sna.temporal-delta",
      configuration: { beforePositionId: "position-method-before" },
    });
    expect(run.output.structural.relations.added).toEqual(["relation-syn-authority", "relation-syn-membership"]);
    expect(run.output.before.asOf).toBe("2026-08-17T08:59:59Z");
    expect(run.output.after.evidenceCutoff).toBe("2026-08-17T09:11:00Z");
    expect(run.caveats.join(" ")).toMatch(/newly acquired evidence|valid-time/i);
    store.close();
  });
});
