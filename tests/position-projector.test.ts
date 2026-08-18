import { describe, expect, it } from "vitest";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P1 deterministic Position projection", () => {
  it("reconstructs as-of projections from canonical rows", () => {
    const { app, fixture, store } = createFixtureApp();
    const input = rootPosition("position-syn-001", "2026-08-17T09:10:00Z");
    const projected = app.projectPosition(input);
    const expected = fixture.positions.find((position) => position.id === input.id);
    expect(expected).toBeDefined();
    expect(projected.projection.active_node_ids).toEqual([...expected?.projection.active_node_ids ?? []].sort());
    expect(projected.projection.relation_ids).toEqual([...expected?.projection.relation_ids ?? []].sort());
    expect(projected.projection.state_ids).toEqual(expected?.projection.state_ids);
    expect(projected.projectionIdentity).toMatch(/^[a-f0-9]{64}$/);
    store.close();
  });
});
