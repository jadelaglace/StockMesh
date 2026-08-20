import { describe, expect, it } from "vitest";
import { ForecastAssessmentService } from "../src/forecasting/index.js";
import { createP3Harness, startP3Search } from "./p3-helpers.js";

describe("P3 synthetic workflow", () => {
  it("runs the offline P1/P2/P3 analysis, branch, replay, and reality-assessment loop", async () => {
    const harness = createP3Harness();
    const started = startP3Search(harness, "p3-end-to-end");
    const searched = await harness.search.execute(started.id);
    expect(searched.status).toBe("paused-budget");
    expect(searched.stopReason).toBe("maxDepth");
    expect(searched.usage.analysisCalls).toBe(4);
    expect(searched.usage.materializedPositions).toBe(6);
    expect(harness.app.count("variations")).toBe(6);
    expect(harness.app.count("evaluations")).toBe(6);
    expect(harness.app.count("possibility_transitions")).toBe(6);
    expect(harness.app.count("trajectories")).toBe(6);

    const forecast = harness.store.db.prepare("SELECT id, trajectory_id FROM variations WHERE purpose = 'forecast' ORDER BY depth, id LIMIT 1").get() as { id: string; trajectory_id: string };
    const transitionRow = harness.store.db.prepare("SELECT transition_ids_json FROM trajectories WHERE id = ?").get(forecast.trajectory_id) as { transition_ids_json: string };
    const service = new ForecastAssessmentService(harness.store);
    const assessment = service.assess({
      forecastVariationId: forecast.id,
      forecastTransitionRefs: JSON.parse(transitionRow.transition_ids_json) as string[],
      actualEventRefs: ["event-syn-surprise"],
      actualTransitionRefs: ["transition-syn-surprise"],
      status: "diverged",
      rubricId: "synthetic-semantic-match@1",
      assessor: "synthetic-reviewer",
      assessedAt: "2026-08-17T10:20:00Z",
      rationale: "The actual synthetic surprise differs from the forecast.",
    });
    expect(assessment.status).toBe("diverged");
    expect(harness.possibilities.replay(forecast.id).rootContext.profileSnapshotId).toBe("profile-snapshot-syn-root");
    expect(harness.app.count("claims")).toBe(7);
    expect(harness.app.count("forecast_assessments")).toBe(1);
    harness.store.close();
  });
});
