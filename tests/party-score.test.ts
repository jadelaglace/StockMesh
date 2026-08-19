import { describe, expect, it } from "vitest";
import type { PartyScoreOutput } from "../src/methods/index.js";
import { createMethodFixture } from "./helpers.js";

describe("P2 per-Party score vectors", () => {
  it("keeps objective-bound dimensions and uncertainty without a scalar winner", () => {
    const { runner, store } = createMethodFixture();
    const run = runner.run<PartyScoreOutput>({
      positionId: "position-method-after",
      methodId: "sna.party-structural-vector",
      configuration: {
        partyNodeIds: ["node-syn-analyst", "node-syn-sponsor"],
        objective: "improve decision clarity",
        horizon: "next working day",
        uncertaintyLevel: "high",
        uncertaintyBasis: ["synthetic and incomplete network"],
      },
    });
    expect(run.output.aggregateScore).toBeNull();
    expect(run.output.vectors).toHaveLength(2);
    expect(run.output.vectors[0]?.dimensions.map((item) => item.id)).toEqual(["connection-exposure", "brokerage-potential", "recursive-incoming-attention"]);
    expect(run.output.vectors[0]?.positionRef.projectionIdentity).toMatch(/^[a-f0-9]{64}$/);
    expect(run.output.vectors[0]?.uncertainty.level).toBe("high");
    store.close();
  });
});
