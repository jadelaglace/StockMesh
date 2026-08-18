import { describe, expect, it } from "vitest";
import { createFixtureApp, rootPosition } from "./helpers.js";

describe("P1 reviewed profile revisions", () => {
  it("appends a revision and leaves the old profile snapshot replayable", () => {
    const { app, store } = createFixtureApp();
    const oldPosition = rootPosition("position-syn-004", "2026-08-17T10:20:00Z");
    app.projectPosition(oldPosition);
    const beforeClaims = app.count("claims");
    const result = app.acceptProfileClaimRevision("revision-proposal-syn-prior-estimate", "fixture-reviewer");
    expect(app.count("claims")).toBe(beforeClaims + 1);
    expect(result.profileSnapshotId).toBe("profile-snapshot-syn-current");
    expect(app.replayPosition(oldPosition).projectionIdentity).toBe(app.getPosition(oldPosition.id)?.projectionIdentity);

    const current = app.projectPosition({
      id: "position-syn-005",
      mode: "reconstructed",
      playgroundId: "playground-syn-orchard",
      asOf: "2026-08-17T11:00:00Z",
      evidenceCutoff: "2026-08-17T10:21:00Z",
      profileSnapshotId: "profile-snapshot-syn-current",
      perspectiveId: "perspective-syn-analyst",
      question: "Which response best improves decision clarity without unnecessary escalation?",
    });
    expect(current.projection.state_ids).toContain("state-syn-style-current");
    expect(current.projection.state_ids).not.toContain("state-syn-style-root");
    store.close();
  });
});
