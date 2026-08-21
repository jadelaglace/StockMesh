import type { AnalysisCandidate, AnalysisResult, BranchPurpose, ContextSnapshot, VariationState } from "../analysis/types.js";
import type { Mode, PositionProjection } from "../domain/types.js";

export interface PositionView {
  id: string;
  mode: Mode;
  playgroundId: string;
  asOf: string;
  evidenceCutoff: string;
  profileSnapshotId: string;
  perspectiveId?: string;
  question?: string;
  projectorVersion: string;
  projectionIdentity: string;
  projection: PositionProjection;
}

export interface StoredAnalysisRun {
  id: string;
  contextSnapshotId: string;
  provider: string;
  model: string;
  adapterVersion: string;
  configurationIdentity: string;
  requestIdentity: string;
  status: "running" | "succeeded" | "failed";
  result?: AnalysisResult;
}

export interface StoredCandidate {
  id: string;
  analysisRunId: string;
  candidateIdentity: string;
  proposal: AnalysisCandidate;
  materializedVariationId?: string;
}

export interface VariationRecord {
  id: string;
  candidateId: string;
  parentVariationId?: string;
  anchorPositionId: string;
  positionId: string;
  trajectoryId: string;
  purpose: BranchPurpose;
  state: VariationState;
  rootContextSnapshotId: string;
  rootProfileSnapshotId: string;
  horizon: string;
  assumptions: string[];
  createdByAnalysisRunId: string;
  depth: number;
  mode: "hypothetical" | "predicted";
}

export interface EvaluationRecord {
  id: string;
  targetPositionId: string;
  perspectiveId: string;
  partyScorecards: AnalysisCandidate["evaluation"]["partyScorecards"];
  horizon: string;
  riskPolicy: string;
  evidenceCutoff: string;
  evaluationProfile: string;
  uncertainty: AnalysisCandidate["evaluation"]["uncertainty"];
  analysisRunId: string;
  methodRunIds: string[];
  evaluationIdentity: string;
}

export interface BranchCheckout {
  variation: VariationRecord;
  position: PositionView;
  evaluation: EvaluationRecord;
  rootContext: ContextSnapshot;
  lineage: string[];
}

export interface MaterializeCandidateInput {
  candidateId: string;
  searchRunId: string;
  parentPositionId: string;
  parentVariationId?: string;
  rootContextSnapshotId: string;
  depth: number;
}
