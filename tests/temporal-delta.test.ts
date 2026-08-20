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
    expect(run.methodVersion).toBe("1.1.0");
    expect(run.output.positionStructural.relations.added).toEqual(["relation-syn-authority", "relation-syn-membership"]);
    expect(run.output.analysisGraphStructural.relations.added).toEqual(["relation-syn-authority", "relation-syn-membership"]);
    expect(run.output.before.asOf).toBe("2026-08-17T08:59:59Z");
    expect(run.output.after.evidenceCutoff).toBe("2026-08-17T09:11:00Z");
    expect(run.caveats.join(" ")).toMatch(/newly acquired evidence|valid-time/i);
    store.close();
  });

  it("separates complete Position change from the filtered analysis graph and retains v1 replay", () => {
    const { app, store } = createFixtureApp();
    projectDeltaPositions(app);
    const runner = new MethodRunner(store, createBuiltinMethodRegistry());
    const configuration = {
      beforePositionId: "position-method-before",
      graph: { includeRelations: false, includeFlows: false },
    };
    const scoped = runner.run<TemporalDeltaOutput>({
      positionId: "position-method-delta-after",
      methodId: "sna.temporal-delta",
      configuration,
    });
    const legacy = runner.run({
      positionId: "position-method-delta-after",
      methodId: "sna.temporal-delta",
      methodVersion: "1.0.0",
      configuration,
    });
    const rebuiltLegacy = runner.rebuild({
      positionId: "position-method-delta-after",
      methodId: "sna.temporal-delta",
      methodVersion: "1.0.0",
      configuration,
    });

    expect(scoped.output.positionStructural.relations.added).toEqual(["relation-syn-authority", "relation-syn-membership"]);
    expect(scoped.output.analysisGraphStructural.relations.added).toEqual([]);
    expect(scoped.output.metrics.density.delta).toBe(0);
    expect(legacy.methodVersion).toBe("1.0.0");
    expect(legacy.outputSchema).toBe("stockmesh.method.temporal-delta-output@1");
    expect(rebuiltLegacy.outputIdentity).toBe(legacy.outputIdentity);
    store.close();
  });
});
