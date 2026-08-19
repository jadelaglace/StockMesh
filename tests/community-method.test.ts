import { describe, expect, it } from "vitest";
import type { CommunityOutput } from "../src/methods/metrics.js";
import { createMethodFixture } from "./helpers.js";

describe("P2 Louvain sensitivity Method", () => {
  it("retains resolution, seed, modularity, and community disagreement inputs", () => {
    const { runner, store } = createMethodFixture();
    const run = runner.run<CommunityOutput>({
      positionId: "position-method-after",
      methodId: "sna.community-louvain",
      configuration: { resolutions: [0.5, 1], seeds: [7, 11] },
    });
    expect(run.output.projection).toBe("undirected-weighted");
    expect(run.output.runs).toHaveLength(4);
    expect(run.output.runs.every((item) => Number.isFinite(item.modularity))).toBe(true);
    expect(run.caveats.join(" ")).toMatch(/not established factions/i);
    store.close();
  });
});
