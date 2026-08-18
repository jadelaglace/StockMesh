import { describe, expect, it } from "vitest";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P1 projection boundaries", () => {
  it("applies the evidence cutoff to claim-backed relations, flows, and states", () => {
    const { app, store } = createFixtureApp();
    const projected = app.projectPosition({
      ...rootPosition("position-syn-cutoff", "2026-08-17T09:10:00Z"),
      evidenceCutoff: "2026-08-16T23:59:59Z",
    });

    expect(projected.projection.active_node_ids).toHaveLength(6);
    expect(projected.projection.relation_ids).toEqual([]);
    expect(projected.projection.flow_ids).toEqual([]);
    expect(projected.projection.state_ids).toEqual([]);
    store.close();
  });
});
