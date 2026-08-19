import { describe, expect, it } from "vitest";
import { createMethodFixture } from "./helpers.js";

describe("P2 Method replay", () => {
  it("reuses identical identities and changes identity when configuration changes", () => {
    const { runner, app, store } = createMethodFixture();
    const first = runner.run({ positionId: "position-method-after", methodId: "sna.pagerank", configuration: { alpha: 0.85 } });
    const repeated = runner.run({ positionId: "position-method-after", methodId: "sna.pagerank", configuration: { alpha: 0.85 } });
    const changed = runner.run({ positionId: "position-method-after", methodId: "sna.pagerank", configuration: { alpha: 0.9 } });
    expect(repeated.id).toBe(first.id);
    expect(repeated.outputIdentity).toBe(first.outputIdentity);
    expect(changed.id).not.toBe(first.id);
    expect(app.count("method_runs")).toBe(2);
    store.close();
  });
});
