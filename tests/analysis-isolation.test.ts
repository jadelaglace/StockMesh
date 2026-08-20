import { describe, expect, it } from "vitest";
import type { AnalysisPort } from "../src/analysis/types.js";
import { PossibilityStore } from "../src/possibilities/index.js";
import { SearchCoordinator } from "../src/search/index.js";
import { createP3Harness, startP3Search } from "./p3-helpers.js";

describe("P3 analysis isolation", () => {
  it("fails closed on semantically invalid model output without canonical writes", async () => {
    const harness = createP3Harness();
    const canonicalTables = ["evidence_items", "claims", "nodes", "relations", "flows", "states", "events", "actions", "transitions", "strategy_steps", "review_decisions"];
    const before = Object.fromEntries(canonicalTables.map((table) => [table, harness.app.count(table)]));
    const invalidPort: AnalysisPort = {
      descriptor: { provider: "invalid", model: "fixture", adapterVersion: "1", configurationIdentity: "invalid-config" },
      async analyze(request) {
        return {
          proposal: {
            schema: "stockmesh.analysis-proposal@0.1.0",
            summary: "Invalid policy",
            candidates: [{
              key: "bad", purpose: "forecast", title: "Bad", action: "Bad action",
              modeledResponse: "Bad response", resultingProjection: request.context.positionProjection,
              evaluation: {
                riskPolicy: "silently-changed-risk",
                evaluationProfile: request.context.evaluationProfile,
                partyScorecards: request.context.objectives.map((objective) => ({
                  partyNodeId: objective.partyNodeId, objective: objective.objective,
                  dimensions: [{ id: "x", label: "X", value: 0, unit: "test", interpretation: "test" }],
                  uncertainty: { level: "high", basis: ["invalid fixture"] }, methodRefs: request.context.methodRunIds,
                })),
                uncertainty: { level: "high", basis: ["invalid fixture"] },
              },
              assumptions: [], uncertainty: { level: "high", basis: ["invalid"] },
              replanTrigger: "Always", horizon: request.context.horizon, priority: 0.5,
            }],
          },
          usage: { tokens: 1, cost: 0 },
        };
      },
    };
    const search = new SearchCoordinator(harness.store, new PossibilityStore(harness.store), invalidPort);
    const seed = startP3Search({ ...harness, search }, "invalid-output", { maxDepth: 1, maxMaterializedPositions: 1 });
    await expect(search.execute(seed.id)).rejects.toThrow("changed the frozen Evaluation policy");
    expect(Object.fromEntries(canonicalTables.map((table) => [table, harness.app.count(table)]))).toEqual(before);
    expect(harness.app.count("variations")).toBe(0);
    expect(harness.app.count("analysis_runs")).toBe(1);
    harness.store.close();
  });

  it("rejects dangling model projection identities transactionally", async () => {
    const harness = createP3Harness((request) => {
      const proposal = structuredClone(({
        schema: "stockmesh.analysis-proposal@0.1.0",
        summary: "Dangling projection",
        candidates: [],
      }) as const);
      const base = request.context.positionProjection;
      return {
        ...proposal,
        candidates: [{
          key: "dangling", purpose: "forecast", title: "Dangling", action: "Propose unknown state",
          modeledResponse: "Unknown", resultingProjection: { ...base, state_ids: [...base.state_ids, "state-does-not-exist"] },
          evaluation: {
            riskPolicy: request.context.riskPolicy, evaluationProfile: request.context.evaluationProfile,
            partyScorecards: request.context.objectives.map((objective) => ({
              partyNodeId: objective.partyNodeId, objective: objective.objective,
              dimensions: [{ id: "x", label: "X", value: 0, unit: "test", interpretation: "test" }],
              uncertainty: { level: "high", basis: ["dangling fixture"] }, methodRefs: request.context.methodRunIds,
            })),
            uncertainty: { level: "high", basis: ["dangling fixture"] },
          },
          assumptions: [], uncertainty: { level: "high", basis: ["dangling"] },
          replanTrigger: "Always", horizon: request.context.horizon, priority: 0.5,
        }],
      };
    });
    const seed = startP3Search(harness, "dangling-output", { maxDepth: 1, maxMaterializedPositions: 1 });
    const positionCount = harness.app.count("positions");
    await expect(harness.search.execute(seed.id)).rejects.toThrow("dangling states identity");
    expect(harness.app.count("positions")).toBe(positionCount);
    expect(harness.app.count("variations")).toBe(0);
    expect(harness.app.count("evaluations")).toBe(0);
    harness.store.close();
  });
});
