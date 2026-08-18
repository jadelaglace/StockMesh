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
});
