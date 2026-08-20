import { describe, expect, it } from "vitest";
import { createFixtureApp } from "./helpers.js";

describe("P1 append-only canonical history", () => {
  it("imports only canonical modes and keeps a journal of writes", () => {
    const { app, fixture, store } = createFixtureApp();
    expect(app.count("claims")).toBe(7);
    expect(app.count("events")).toBe(4);
    expect(app.hasEventMode("predicted")).toBe(false);
    const journalCount = app.count("change_journal");
    expect(journalCount).toBeGreaterThan(0);

    app.importSyntheticFixture(fixture);
    expect(app.count("claims")).toBe(7);
    expect(app.count("events")).toBe(4);
    expect(app.count("change_journal")).toBe(journalCount);
    store.close();
  });

  it("rejects changed canonical content that reuses an existing ID", () => {
    const { app, fixture, store } = createFixtureApp();
    const changed = structuredClone(fixture);
    changed.nodes[0]!.node_type = "changed-type";
    const journalCount = app.count("change_journal");

    expect(() => app.importSyntheticFixture(changed)).toThrow(/nodes identity conflict/);
    expect(app.count("change_journal")).toBe(journalCount);
    expect((store.db.prepare("SELECT node_type FROM nodes WHERE id = ?").get(changed.nodes[0]!.id) as { node_type: string }).node_type).not.toBe("changed-type");
    store.close();
  });
});
