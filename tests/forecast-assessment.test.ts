import { describe, expect, it } from "vitest";
import { ForecastAssessmentService } from "../src/forecasting/index.js";
import { createP3Harness, startP3Search } from "./p3-helpers.js";

describe("P3 cutoff-correct Forecast Assessment", () => {
  it("appends many-to-many assessments and requires coverage for non-occurrence", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "forecast-assessment", { maxDepth: 1, maxMaterializedPositions: 3, maxAnalysisCalls: 2 });
    await harness.search.execute(run.id);
    const forecast = harness.store.db.prepare(`
      SELECT v.id, t.transition_ids_json FROM variations v JOIN trajectories t ON t.id = v.trajectory_id
      WHERE v.purpose = 'forecast' LIMIT 1
    `).get() as { id: string; transition_ids_json: string };
    const counterfactual = harness.store.db.prepare("SELECT id FROM variations WHERE purpose = 'counterfactual' LIMIT 1").get() as { id: string };
    const transitionRefs = JSON.parse(forecast.transition_ids_json) as string[];
    const service = new ForecastAssessmentService(harness.store);
    const matched = service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs: transitionRefs,
      actualEventRefs: ["event-syn-sponsor-reply", "event-syn-coordinator-reply"],
      actualTransitionRefs: ["transition-syn-sponsor-reply"],
      status: "matched",
      rubricId: "synthetic-semantic-match@1",
      assessor: "test-reviewer",
      assessedAt: "2026-08-17T10:10:00Z",
      rationale: "Synthetic actual records match the bounded forecast rubric.",
    });
    expect(matched.actualEventRefs).toHaveLength(2);

    await expect(Promise.resolve().then(() => service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs: transitionRefs,
      actualEventRefs: [], actualTransitionRefs: [], status: "expired-unobserved",
      rubricId: "synthetic-semantic-match@1", assessor: "test-reviewer",
      assessedAt: "2026-08-17T11:00:00Z", rationale: "No match.",
    }))).rejects.toThrow("adequate Observation Coverage");

    const coverage = service.recordCoverage({
      scope: "synthetic organizational responses",
      interval: { from: "2026-08-17T09:10:00Z", to: "2026-08-17T11:00:00Z" },
      status: "adequate",
      evidenceRefs: ["evidence-syn-coverage-public"],
      limitations: ["Synthetic fixture only."],
      recordedAt: "2026-08-17T11:00:00Z",
    });
    const expired = service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs: transitionRefs,
      actualEventRefs: [], actualTransitionRefs: [], status: "expired-unobserved",
      rubricId: "synthetic-semantic-match@1", observationCoverageId: coverage.id,
      assessor: "test-reviewer", assessedAt: "2026-08-17T11:00:00Z",
      rationale: "The synthetic horizon elapsed under complete coverage.",
    });
    expect(expired.status).toBe("expired-unobserved");
    expect(service.getAssessments(forecast.id)).toHaveLength(2);
    expect(() => service.assess({
      forecastVariationId: counterfactual.id,
      forecastTransitionRefs: transitionRefs,
      actualEventRefs: [], actualTransitionRefs: [], status: "unknown",
      rubricId: "synthetic-semantic-match@1", assessor: "test-reviewer",
      assessedAt: "2026-08-17T11:00:00Z", rationale: "Not a forecast.",
    })).toThrow("only forecast Variations");
    expect(harness.possibilities.checkout(forecast.id).position.mode).toBe("predicted");
    harness.store.close();
  });

  it("rejects actual evidence outside the frozen forecast interval", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "forecast-temporal-eligibility", {
      maxDepth: 1, maxMaterializedPositions: 3, maxAnalysisCalls: 2,
    });
    await harness.search.execute(run.id);
    const forecast = harness.store.db.prepare(`
      SELECT v.id, t.transition_ids_json
      FROM variations v JOIN trajectories t ON t.id = v.trajectory_id
      WHERE v.purpose = 'forecast' LIMIT 1
    `).get() as { id: string; transition_ids_json: string };
    const forecastTransitionRefs = JSON.parse(forecast.transition_ids_json) as string[];
    harness.store.db.prepare(`
      INSERT INTO events (id, event_type, mode, occurred_time, claim_refs_json)
      VALUES (?, 'synthetic-review', 'actual', ?, '[]')
    `).run("event-before-forecast-anchor", "2026-08-17T09:00:00Z");
    harness.store.db.prepare(`
      INSERT INTO events (id, event_type, mode, occurred_time, claim_refs_json)
      VALUES (?, 'synthetic-review', 'actual', ?, '[]')
    `).run("event-after-forecast-horizon", "2026-08-17T10:45:00Z");
    harness.store.db.prepare(`
      INSERT INTO transitions (id, from_position_id, to_position_id, mode, cause_refs_json, effect_summary)
      VALUES (?, 'position-review-before', 'position-review-after', 'actual', ?, 'Synthetic late transition.')
    `).run("transition-after-forecast-horizon", JSON.stringify(["event-after-forecast-horizon"]));
    const service = new ForecastAssessmentService(harness.store);
    const assessEvent = (eventId: string) => service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs,
      actualEventRefs: [eventId],
      actualTransitionRefs: [],
      status: "matched",
      rubricId: "synthetic-semantic-match@1",
      assessor: "test-reviewer",
      assessedAt: "2026-08-17T11:00:00Z",
      rationale: "Temporal eligibility regression.",
    });

    expect(() => assessEvent("event-before-forecast-anchor")).toThrow("forecast anchor");
    expect(() => assessEvent("event-after-forecast-horizon")).toThrow("forecast horizon");
    expect(() => service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs,
      actualEventRefs: [],
      actualTransitionRefs: ["transition-after-forecast-horizon"],
      status: "matched",
      rubricId: "synthetic-semantic-match@1",
      assessor: "test-reviewer",
      assessedAt: "2026-08-17T11:00:00Z",
      rationale: "Transition temporal eligibility regression.",
    })).toThrow("forecast horizon");
    harness.store.close();
  });

  it("treats assessment reference arrays as order-independent sets", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "forecast-reference-set", {
      maxDepth: 1, maxMaterializedPositions: 3, maxAnalysisCalls: 2,
    });
    await harness.search.execute(run.id);
    const forecast = harness.store.db.prepare(`
      SELECT v.id, t.transition_ids_json
      FROM variations v JOIN trajectories t ON t.id = v.trajectory_id
      WHERE v.purpose = 'forecast' LIMIT 1
    `).get() as { id: string; transition_ids_json: string };
    const forecastTransitionRefs = JSON.parse(forecast.transition_ids_json) as string[];
    const service = new ForecastAssessmentService(harness.store);
    const base = {
      forecastVariationId: forecast.id,
      forecastTransitionRefs,
      actualTransitionRefs: [] as string[],
      status: "matched" as const,
      rubricId: "synthetic-semantic-match@1",
      assessor: "test-reviewer",
      assessedAt: "2026-08-17T10:10:00Z",
      rationale: "Reference-set identity regression.",
    };
    const first = service.assess({
      ...base,
      actualEventRefs: ["event-syn-sponsor-reply", "event-syn-coordinator-reply"],
    });
    const reordered = service.assess({
      ...base,
      actualEventRefs: ["event-syn-coordinator-reply", "event-syn-sponsor-reply"],
    });

    expect(reordered.id).toBe(first.id);
    expect(service.getAssessments(forecast.id)).toHaveLength(1);
    expect(reordered.actualEventRefs).toEqual([
      "event-syn-coordinator-reply",
      "event-syn-sponsor-reply",
    ]);
    harness.store.close();
  });
});
