import { describe, expect, it } from "vitest";
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
});
