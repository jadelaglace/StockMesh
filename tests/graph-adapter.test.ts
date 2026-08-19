import { describe, expect, it } from "vitest";
import { PositionGraphAdapter } from "../src/methods/index.js";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P2 Position graph adapter", () => {
  it("builds a typed directed graph from projected rows and retains edge provenance", () => {
    const { app, store } = createFixtureApp();
    app.projectPosition(rootPosition("position-graph", "2026-08-17T09:10:00Z"));
    const adapter = new PositionGraphAdapter(store.db);
    const adapted = adapter.adapt(adapter.loadPosition("position-graph"));
    expect(adapted.graph.order).toBe(6);
    expect(adapted.graph.size).toBe(2);
    const authorityEdge = adapted.graph.findEdge((_edge, attributes) => attributes.provenance.some((item) => item.sourceId === "relation-syn-authority"));
    expect(authorityEdge).toBeDefined();
    expect(adapted.graph.getEdgeAttribute(authorityEdge!, "weightSemantics")).toBe("unit-observed-edge-count");
    expect(adapted.inputIdentity).toMatch(/^[a-f0-9]{64}$/);
    store.db.prepare("DELETE FROM relations WHERE id = 'relation-syn-authority'").run();
    expect(() => adapter.adapt(adapter.loadPosition("position-graph"))).toThrow(/missing Relations/);
    store.close();
  });
});
