import { describe, expect, it } from "vitest";
import { createFixtureApp } from "./helpers.js";

describe("P1 mode separation", () => {
  it("does not promote possible P0 branches into canonical history", () => {
    const { app, store } = createFixtureApp();
    expect(app.hasEventMode("hypothetical")).toBe(false);
    expect(app.hasEventMode("predicted")).toBe(false);
    expect(app.count("strategy_steps")).toBe(4);
    store.close();
  });
});
