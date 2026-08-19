import { describe, expect, it } from "vitest";
import type { FoundationOutput } from "../src/methods/metrics.js";
import { createMethodFixture } from "./helpers.js";

describe("P2 transparent foundation pack", () => {
  it("computes scoped structural metrics, ego context, and category mixing", () => {
    const { runner, store } = createMethodFixture();
    const run = runner.run<FoundationOutput>({
      positionId: "position-method-after",
      methodId: "sna.foundation",
      configuration: { egoRootNodeId: "node-syn-analyst", egoMaxHops: 1 },
    });
    expect(run.output.graph).toMatchObject({ directed: true, order: 6, size: 2, reciprocity: 0 });
    expect(run.output.graph.density).toBeCloseTo(2 / 30);
    expect(run.output.graph.weakComponents).toHaveLength(4);
    expect(run.output.nodes["node-syn-analyst"]).toMatchObject({ outDegree: 1, inDegree: 0, outStrength: 1 });
    expect(run.output.nodes["node-syn-analyst"]!.shortestPathLengths["node-syn-team"]).toBe(1);
    expect(run.output.egoNetwork).toMatchObject({ traversal: "outbound", nodeIds: ["node-syn-analyst", "node-syn-team"] });
    expect(run.output.mixing.categories).toContain("person");
    expect(run.caveats.join(" ")).toMatch(/not influence|not proof/i);
    store.close();
  });
});
