import { describe, expect, it } from "vitest";
import { createBuiltinMethodRegistry, MethodRunner } from "../src/methods/index.js";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P1 replay", () => {
  it("replays the same Position identity and rejects changed cutoff", () => {
    const { app, store } = createFixtureApp();
    const input = rootPosition("position-syn-001", "2026-08-17T09:10:00Z");
    app.projectPosition(input);
    expect(app.replayPosition(input).projectionIdentity).toBe(app.getPosition(input.id)?.projectionIdentity);
    const canonicalCounts = ["claims", "nodes", "relations", "flows", "states", "events", "strategy_steps"].map((table) => app.count(table));
    expect(app.rebuildPosition(input).projectionIdentity).toBe(app.getPosition(input.id)?.projectionIdentity);
    expect(["claims", "nodes", "relations", "flows", "states", "events", "strategy_steps"].map((table) => app.count(table))).toEqual(canonicalCounts);
    expect(() => app.replayPosition({ ...input, asOf: "2026-08-17T09:11:00Z" })).toThrow(/replay mismatch/);
    store.close();
  });

  it("keeps Position identity immutable and rebuilds without invalidating Method runs", () => {
    const { app, store } = createFixtureApp();
    const input = rootPosition("position-syn-method-rebuild", "2026-08-17T09:10:00Z");
    const projected = app.projectPosition(input);
    const journalCount = app.count("change_journal");
    expect(app.projectPosition(input).projectionIdentity).toBe(projected.projectionIdentity);
    expect(app.count("change_journal")).toBe(journalCount);
    expect(() => app.projectPosition({ ...input, id: "position-syn-duplicate-projection" })).toThrow(/projection already exists/);
    const runner = new MethodRunner(store, createBuiltinMethodRegistry());
    const run = runner.run({ positionId: input.id, methodId: "sna.foundation" });

    expect(app.rebuildPosition(input).projectionIdentity).toBe(projected.projectionIdentity);
    expect(runner.readRun(run.id)?.positionProjectionIdentity).toBe(projected.projectionIdentity);
    expect(() => app.projectPosition({ ...input, asOf: "2026-08-17T08:59:59Z" })).toThrow(/Position identity conflict/);
    expect(app.getPosition(input.id)?.projectionIdentity).toBe(projected.projectionIdentity);
    store.close();
  });
});
