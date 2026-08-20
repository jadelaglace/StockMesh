import { describe, expect, it } from "vitest";
import type { AnalysisPort } from "../src/analysis/types.js";
import { PossibilityStore } from "../src/possibilities/index.js";
import { SearchCoordinator } from "../src/search/index.js";
import { createP3Harness, defaultProposal, startP3Search } from "./p3-helpers.js";

describe("P3 budgeted resumable frontier", () => {
  it("retains variable candidates and resumes without repeating completed analysis", async () => {
    const harness = createP3Harness();
    const started = startP3Search(harness, "budget-resume", {
      maxDepth: 2,
      maxMaterializedPositions: 2,
      maxAnalysisCalls: 10,
      maxTokens: 100,
    });
    const first = await harness.search.execute(started.id);
    expect(first.status).toBe("paused-budget");
    expect(first.stopReason).toBe("maxMaterializedPositions");
    expect(first.usage.materializedPositions).toBe(2);
    expect(harness.adapter.calls).toBe(1);
    expect(harness.app.count("variation_candidates")).toBe(3);
    expect(harness.app.count("variations")).toBe(2);

    const second = await harness.search.resume(started.id, {
      maxDepth: 2,
      maxMaterializedPositions: 4,
      maxAnalysisCalls: 10,
      maxTokens: 100,
    });
    expect(second.status).toBe("paused-budget");
    expect(second.usage.materializedPositions).toBe(4);
    expect(harness.adapter.calls).toBe(2);
    expect(harness.app.count("evaluations")).toBe(4);
    expect(harness.app.count("positions")).toBe(5);
    harness.store.close();
  });

  it("honors a user pause while an analysis call is in flight", async () => {
    const harness = createP3Harness();
    let release!: () => void;
    const port: AnalysisPort = {
      descriptor: { provider: "deferred", model: "fixture", adapterVersion: "1", configurationIdentity: "deferred-v1" },
      analyze(request) {
        return new Promise((resolve) => {
          release = () => resolve({ proposal: defaultProposal(request), usage: { tokens: 1, cost: 0 } });
        });
      },
    };
    const search = new SearchCoordinator(harness.store, new PossibilityStore(harness.store), port);
    const seed = startP3Search({ ...harness, search }, "pause-in-flight", { maxDepth: 1, maxMaterializedPositions: 3, maxAnalysisCalls: 2 });
    const execution = search.execute(seed.id);
    expect(search.pause(seed.id).status).toBe("paused-user");
    release();
    const paused = await execution;
    expect(paused.status).toBe("paused-user");
    expect(harness.app.count("variations")).toBe(0);
    expect(harness.app.count("variation_candidates")).toBe(3);
    harness.store.close();
  });
});
