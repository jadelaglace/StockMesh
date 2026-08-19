import { describe, expect, it } from "vitest";
import type { PageRankOutput } from "../src/methods/metrics.js";
import { createMethodFixture } from "./helpers.js";

describe("P2 PageRank Method", () => {
  it("exposes parameters, normalized scores, and the non-universal-influence guard", () => {
    const { runner, store } = createMethodFixture();
    const run = runner.run<PageRankOutput>({
      positionId: "position-method-after",
      methodId: "sna.pagerank",
      configuration: { alpha: 0.9, maxIterations: 200, tolerance: 1e-8 },
    });
    expect(run.output.graphSemantics).toEqual({ direction: "source-to-target", weightSemantics: "unit-observed-edge-count" });
    expect(run.output.parameters).toMatchObject({ damping: 0.9, maxIterations: 200, tolerance: 1e-8 });
    expect(Object.values(run.output.scores).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(run.caveats.join(" ")).toMatch(/not a universal influence/i);
    expect(() => runner.run({
      positionId: "position-method-after",
      methodId: "sna.pagerank",
      configuration: { graph: { includeRelations: "yes" } },
    })).toThrow(/includeRelations must be boolean/);
    store.close();
  });
});
