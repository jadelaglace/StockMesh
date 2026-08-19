import { describe, expect, it } from "vitest";
import { createBuiltinMethodRegistry, MethodRunner } from "../src/methods/index.js";
import { createFixtureApp, rootPosition } from "./helpers.js";

const canonicalTables = ["evidence_items", "playgrounds", "nodes", "relations", "flows", "claims", "review_decisions", "profile_snapshots", "states", "events", "actions", "transitions", "utterances", "strategy_steps"];

describe("P2 Method isolation", () => {
  it("rebuilds only derived rows and leaves failures explicit without partial results", () => {
    const { app, store } = createFixtureApp();
    app.projectPosition(rootPosition("position-method-isolation", "2026-08-17T09:10:00Z"));
    const registry = createBuiltinMethodRegistry();
    registry.register({
      id: "test.failure",
      version: "1.0.0",
      title: "Test failure",
      category: "foundation",
      executor: "test",
      implementationIdentity: "test.failure@1",
      outputSchema: "test.failure-output@1",
      caveats: [],
      normalizeConfiguration: () => ({}),
      execute: () => { throw new Error("intentional Method failure"); },
    });
    const runner = new MethodRunner(store, registry);
    const before = canonicalTables.map((table) => app.count(table));
    const succeeded = runner.run({ positionId: "position-method-isolation", methodId: "sna.foundation" });
    const rebuilt = runner.rebuild({ positionId: "position-method-isolation", methodId: "sna.foundation" });
    expect(rebuilt.outputIdentity).toBe(succeeded.outputIdentity);
    expect(canonicalTables.map((table) => app.count(table))).toEqual(before);
    expect(() => runner.run({ positionId: "position-method-isolation", methodId: "test.failure" })).toThrow(/intentional Method failure/);
    expect((store.db.prepare("SELECT status FROM method_runs WHERE method_id = 'test.failure'").get() as { status: string }).status).toBe("failed");
    expect((store.db.prepare("SELECT COUNT(*) AS count FROM method_results x JOIN method_runs r ON r.id = x.run_id WHERE r.method_id = 'test.failure'").get() as { count: number }).count).toBe(0);
    expect(canonicalTables.map((table) => app.count(table))).toEqual(before);
    store.close();
  });
});
