import { describe, expect, it } from "vitest";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P1 synthetic P0 workflow", () => {
  it("stages, imports, projects, revises, and replays one synthetic record", () => {
    const { app, fixture, store } = createFixtureApp();
    const summary = {
      claims: app.count("claims"),
      nodes: app.count("nodes"),
      events: app.count("events"),
      positions: app.count("positions"),
    };
    expect(summary).toEqual({ claims: 7, nodes: fixture.nodes.length, events: 4, positions: 0 });
    const p1 = app.projectPosition(rootPosition("position-syn-001", "2026-08-17T09:10:00Z"));
    expect(app.replayPosition(rootPosition("position-syn-001", "2026-08-17T09:10:00Z")).projectionIdentity).toBe(p1.projectionIdentity);
    app.acceptProfileClaimRevision("revision-proposal-syn-prior-estimate", "fixture-reviewer");
    expect(app.count("profile_snapshots")).toBe(2);
    store.close();
  });
});
