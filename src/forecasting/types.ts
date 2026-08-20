export type ObservationCoverageStatus = "adequate" | "inadequate" | "unknown";
export type ForecastAssessmentStatus = "pending" | "matched" | "partially-matched" | "diverged" | "expired-unobserved" | "unknown";

export interface ObservationCoverageInput {
  scope: string;
  interval: { from: string; to: string };
  status: ObservationCoverageStatus;
  evidenceRefs: string[];
  limitations: string[];
  recordedAt: string;
}

export interface ObservationCoverageRecord extends ObservationCoverageInput {
  id: string;
  coverageIdentity: string;
}

export interface ForecastAssessmentInput {
  forecastVariationId: string;
  forecastTransitionRefs: string[];
  actualEventRefs: string[];
  actualTransitionRefs: string[];
  status: ForecastAssessmentStatus;
  rubricId: string;
  observationCoverageId?: string;
  assessor: string;
  assessedAt: string;
  rationale: string;
}

export interface ForecastAssessmentRecord extends ForecastAssessmentInput {
  id: string;
  horizon: string;
  assessmentIdentity: string;
}
