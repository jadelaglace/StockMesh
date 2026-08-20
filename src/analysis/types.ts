import type { PositionProjection } from "../domain/types.js";

export const ANALYSIS_PROPOSAL_SCHEMA = "stockmesh.analysis-proposal@0.1.0";

export type BranchPurpose = "forecast" | "counterfactual" | "exploratory";
export type VariationState = "candidate" | "pinned" | "selected" | "archived" | "invalidated";

export interface ObjectiveSpec {
  partyNodeId: string;
  objective: string;
  weight: number;
}

export interface SearchBudget {
  maxDepth?: number;
  maxMaterializedPositions?: number;
  maxAnalysisCalls?: number;
  maxElapsedMs?: number;
  maxTokens?: number;
  maxCost?: number;
}

export interface BudgetUsage {
  materializedPositions: number;
  analysisCalls: number;
  elapsedMs: number;
  tokens: number;
  cost: number;
}

export interface ContextSnapshot {
  id: string;
  positionId: string;
  positionProjectionIdentity: string;
  positionProjection: PositionProjection;
  evidenceCutoff: string;
  branchPath: string[];
  profileSnapshotId: string;
  perspectiveId: string;
  objectives: ObjectiveSpec[];
  horizon: string;
  riskPolicy: string;
  evaluationProfile: string;
  methodRunIds: string[];
  unknowns: string[];
  contextManifest: Record<string, unknown>;
  projectorVersion: string;
  snapshotIdentity: string;
}

export interface AnalysisPortDescriptor {
  provider: string;
  model: string;
  adapterVersion: string;
  configurationIdentity: string;
}

export interface AnalysisRequest {
  context: ContextSnapshot;
  remainingBudget: SearchBudget;
}

export interface EvaluationDimensionProposal {
  id: string;
  label: string;
  value: number;
  unit: string;
  interpretation: string;
}

export interface PartyEvaluationProposal {
  partyNodeId: string;
  objective: string;
  dimensions: EvaluationDimensionProposal[];
  uncertainty: {
    level: "low" | "medium" | "high";
    basis: string[];
  };
  methodRefs: string[];
}

export interface EvaluationProposal {
  riskPolicy: string;
  evaluationProfile: string;
  partyScorecards: PartyEvaluationProposal[];
  uncertainty: {
    level: "low" | "medium" | "high";
    basis: string[];
  };
}

export interface AnalysisCandidate {
  key: string;
  purpose: BranchPurpose;
  title: string;
  action: string;
  modeledResponse: string;
  resultingProjection: PositionProjection;
  evaluation: EvaluationProposal;
  assumptions: string[];
  uncertainty: {
    level: "low" | "medium" | "high";
    basis: string[];
  };
  replanTrigger: string;
  horizon: string;
  priority: number;
}

export interface AnalysisProposal {
  schema: typeof ANALYSIS_PROPOSAL_SCHEMA;
  summary: string;
  candidates: AnalysisCandidate[];
}

export interface AnalysisResult {
  proposal: AnalysisProposal;
  usage: {
    tokens: number;
    cost: number;
  };
}

export interface AnalysisPort {
  readonly descriptor: AnalysisPortDescriptor;
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export interface ContextSnapshotInput {
  positionId: string;
  branchPath: string[];
  perspectiveId?: string;
  objectives: ObjectiveSpec[];
  horizon: string;
  riskPolicy: string;
  evaluationProfile: string;
  methodRunIds?: string[];
  unknowns?: string[];
  contextManifest?: Record<string, unknown>;
}

export interface SearchPolicyIdentity {
  id: string;
  version: string;
}
