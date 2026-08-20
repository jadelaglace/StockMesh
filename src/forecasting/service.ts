import type { SqliteStore } from "../persistence/database.js";
import { stableHash, stableJson } from "../methods/identity.js";
import type {
  ForecastAssessmentInput,
  ForecastAssessmentRecord,
  ObservationCoverageInput,
  ObservationCoverageRecord,
} from "./types.js";

function parse<T>(value: string): T {
  return JSON.parse(value) as T;
}

function instant(value: string, field: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${field} must be an ISO-compatible instant`);
  return time;
}

export class ForecastAssessmentService {
  constructor(private readonly store: SqliteStore) {}

  recordCoverage(input: ObservationCoverageInput): ObservationCoverageRecord {
    if (!input.scope || !input.recordedAt) throw new Error("coverage scope and recordedAt are required");
    instant(input.recordedAt, "coverage recordedAt");
    if (instant(input.interval.from, "coverage interval.from") > instant(input.interval.to, "coverage interval.to")) throw new Error("coverage interval is reversed");
    if (input.status === "adequate" && input.evidenceRefs.length === 0) throw new Error("adequate coverage requires evidence");
    for (const evidenceId of input.evidenceRefs) {
      if (!this.store.db.prepare("SELECT 1 FROM evidence_items WHERE id = ?").get(evidenceId)) throw new Error(`coverage Evidence not found: ${evidenceId}`);
    }
    const coverageIdentity = stableHash(input);
    const id = `coverage-${coverageIdentity}`;
    this.store.db.prepare(`
      INSERT OR IGNORE INTO observation_coverages (
        id, scope, interval_from, interval_to, status, evidence_refs_json,
        limitations_json, recorded_at, coverage_identity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.scope, input.interval.from, input.interval.to, input.status,
      stableJson(input.evidenceRefs), stableJson(input.limitations), input.recordedAt,
      coverageIdentity,
    );
    return this.requireCoverage(id);
  }

  assess(input: ForecastAssessmentInput): ForecastAssessmentRecord {
    const variation = this.store.db.prepare(`
      SELECT v.id, v.purpose, v.horizon, v.trajectory_id, v.anchor_position_id,
        t.transition_ids_json, p.as_of AS anchor_as_of
      FROM variations v JOIN trajectories t ON t.id = v.trajectory_id
      JOIN positions p ON p.id = v.anchor_position_id WHERE v.id = ?
    `).get(input.forecastVariationId) as {
      id: string; purpose: string; horizon: string; trajectory_id: string;
      anchor_position_id: string; transition_ids_json: string; anchor_as_of: string;
    } | undefined;
    if (!variation) throw new Error(`forecast Variation not found: ${input.forecastVariationId}`);
    if (variation.purpose !== "forecast") throw new Error("only forecast Variations may receive Forecast Assessments");
    if (!input.rubricId || !input.assessor || !input.rationale) throw new Error("assessment rubric, assessor, and rationale are required");
    instant(input.assessedAt, "assessedAt");
    instant(variation.horizon, "forecast horizon");
    const forecastTransitions = parse<string[]>(variation.transition_ids_json);
    if (input.forecastTransitionRefs.length === 0 || input.forecastTransitionRefs.some((id) => !forecastTransitions.includes(id))) {
      throw new Error("forecast Transition refs must belong to the frozen forecast Trajectory");
    }
    for (const refs of [input.forecastTransitionRefs, input.actualEventRefs, input.actualTransitionRefs]) {
      if (new Set(refs).size !== refs.length) throw new Error("assessment references must not contain duplicates");
    }
    const realizedStatuses = new Set(["matched", "partially-matched", "diverged"]);
    if (realizedStatuses.has(input.status) && input.actualEventRefs.length + input.actualTransitionRefs.length === 0) {
      throw new Error(`${input.status} requires actual evidence`);
    }
    for (const eventId of input.actualEventRefs) {
      const event = this.store.db.prepare("SELECT mode, occurred_time FROM events WHERE id = ?").get(eventId) as { mode: string; occurred_time: string } | undefined;
      if (!event || (event.mode !== "actual" && event.mode !== "reconstructed")) throw new Error(`actual Event is missing or non-canonical: ${eventId}`);
      if (instant(event.occurred_time, `actual Event ${eventId}`) > instant(input.assessedAt, "assessedAt")) throw new Error(`actual Event occurs after assessment cutoff: ${eventId}`);
    }
    for (const transitionId of input.actualTransitionRefs) {
      const transition = this.store.db.prepare("SELECT mode FROM transitions WHERE id = ?").get(transitionId) as { mode: string } | undefined;
      if (!transition || (transition.mode !== "actual" && transition.mode !== "reconstructed")) throw new Error(`actual Transition is missing or non-canonical: ${transitionId}`);
    }
    const coverage = input.observationCoverageId === undefined ? undefined : this.requireCoverage(input.observationCoverageId);
    if (input.status === "expired-unobserved") {
      if (input.actualEventRefs.length > 0 || input.actualTransitionRefs.length > 0) throw new Error("expired-unobserved cannot cite a realized match");
      if (!coverage || coverage.status !== "adequate") throw new Error("expired-unobserved requires adequate Observation Coverage");
      if (instant(input.assessedAt, "assessedAt") < instant(variation.horizon, "forecast horizon")) throw new Error("forecast horizon has not elapsed");
      if (instant(coverage.interval.to, "coverage interval.to") < instant(variation.horizon, "forecast horizon")) throw new Error("Observation Coverage does not reach the forecast horizon");
      if (instant(coverage.interval.from, "coverage interval.from") > instant(variation.anchor_as_of, "forecast anchor")) throw new Error("Observation Coverage starts after the forecast anchor");
    }
    if (input.status === "pending" && instant(input.assessedAt, "assessedAt") >= instant(variation.horizon, "forecast horizon") && coverage?.status === "adequate") {
      throw new Error("pending is invalid after the horizon with adequate coverage");
    }
    const identityPayload = {
      ...input,
      observationCoverageId: input.observationCoverageId ?? null,
      horizon: variation.horizon,
    };
    const assessmentIdentity = stableHash(identityPayload);
    const id = `forecast-assessment-${assessmentIdentity}`;
    this.store.db.prepare(`
      INSERT OR IGNORE INTO forecast_assessments (
        id, forecast_variation_id, forecast_transition_refs_json, actual_event_refs_json,
        actual_transition_refs_json, status, horizon, rubric_id, observation_coverage_id,
        assessor, assessed_at, rationale, assessment_identity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.forecastVariationId, stableJson(input.forecastTransitionRefs),
      stableJson(input.actualEventRefs), stableJson(input.actualTransitionRefs),
      input.status, variation.horizon, input.rubricId,
      input.observationCoverageId ?? null, input.assessor, input.assessedAt,
      input.rationale, assessmentIdentity,
    );
    return this.requireAssessment(id);
  }

  getAssessments(forecastVariationId: string): ForecastAssessmentRecord[] {
    const rows = this.store.db.prepare("SELECT id FROM forecast_assessments WHERE forecast_variation_id = ? ORDER BY assessed_at, id")
      .all(forecastVariationId) as Array<{ id: string }>;
    return rows.map((row) => this.requireAssessment(row.id));
  }

  private requireCoverage(id: string): ObservationCoverageRecord {
    const row = this.store.db.prepare("SELECT * FROM observation_coverages WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Observation Coverage not found: ${id}`);
    return {
      id: String(row.id), scope: String(row.scope),
      interval: { from: String(row.interval_from), to: String(row.interval_to) },
      status: String(row.status) as ObservationCoverageRecord["status"],
      evidenceRefs: parse(String(row.evidence_refs_json)), limitations: parse(String(row.limitations_json)),
      recordedAt: String(row.recorded_at), coverageIdentity: String(row.coverage_identity),
    };
  }

  private requireAssessment(id: string): ForecastAssessmentRecord {
    const row = this.store.db.prepare("SELECT * FROM forecast_assessments WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Forecast Assessment not found: ${id}`);
    return {
      id: String(row.id), forecastVariationId: String(row.forecast_variation_id),
      forecastTransitionRefs: parse(String(row.forecast_transition_refs_json)),
      actualEventRefs: parse(String(row.actual_event_refs_json)),
      actualTransitionRefs: parse(String(row.actual_transition_refs_json)),
      status: String(row.status) as ForecastAssessmentRecord["status"], horizon: String(row.horizon),
      rubricId: String(row.rubric_id),
      ...(row.observation_coverage_id === null ? {} : { observationCoverageId: String(row.observation_coverage_id) }),
      assessor: String(row.assessor), assessedAt: String(row.assessed_at), rationale: String(row.rationale),
      assessmentIdentity: String(row.assessment_identity),
    };
  }
}
