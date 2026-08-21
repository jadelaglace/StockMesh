export type KnowledgeStatus = "observation" | "report" | "inference" | "judgment" | "unknown";

export interface WorkbenchNode {
  id: string;
  label: string;
  type: string;
  profileLabel: string;
  states: Array<{ id: string; type: string; value: unknown; claimRefs: string[] }>;
  claims: Array<{
    id: string;
    kind: string;
    status: string;
    proposition?: string;
    validFrom: string;
    validTo?: string;
    revision: number;
    revisionOf?: string;
    evidenceRefs: string[];
  }>;
}

export interface WorkbenchPartyScorecard {
  partyNodeId: string;
  objective: string;
  dimensions: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
    interpretation: string;
  }>;
  uncertainty: { level: "low" | "medium" | "high"; basis: string[] };
  methodRefs: string[];
}

export interface WorkbenchEvaluation {
  partyScorecards: WorkbenchPartyScorecard[];
  horizon: string;
  riskPolicy: string;
  evidenceCutoff: string;
  evaluationProfile: string;
  uncertainty: { level: "low" | "medium" | "high"; basis: string[] };
}

export interface WorkbenchSnapshot {
  product: { name: "StockMesh"; mode: "synthetic-demo"; profileLabel: string };
  context: {
    playgroundId: string;
    scope: string;
    perspectiveId: string;
    question: string;
    horizon: string;
    evidenceCutoff: string;
    riskPolicy: string;
    evaluationProfile: string;
    objectives: Array<{ partyNodeId: string; partyLabel: string; objective: string; weight: number }>;
  };
  positions: Array<{
    id: string;
    mode: string;
    asOf: string;
    evidenceCutoff: string;
    profileSnapshotId: string;
    projectionIdentity: string;
    projection: { active_node_ids: string[]; relation_ids: string[]; flow_ids: string[]; state_ids: string[] };
  }>;
  selectedPositionId: string;
  timeline: Array<{
    id: string;
    type: string;
    mode: string;
    occurredAt: string;
    recordedAt?: string;
    cutoffStatus: "available" | "hindsight" | "variation";
    participantNodeIds: string[];
    claimRefs: string[];
    evidenceRefs: string[];
    summary: string;
    resultingPositionId?: string;
  }>;
  graph: {
    nodes: WorkbenchNode[];
    relations: Array<{ id: string; type: string; source: string; target: string; claimRefs: string[]; evidenceRefs: string[] }>;
    flows: Array<{ id: string; type: string; path: string[]; claimRefs: string[]; evidenceRefs: string[] }>;
  };
  trace: {
    evidence: Array<{ id: string; sourceKind: string; authority: string; acquiredAt: string; integrity: string; sensitivity: string }>;
    methods: Array<{ runId: string; methodId: string; version: string; status: string; output: unknown; caveats: string[] }>;
    analyses: Array<{ id: string; provider: string; model: string; configurationIdentity: string; status: string; contextSnapshotId: string; tokens: number; cost: number }>;
  };
  branches: Array<{
    id: string;
    parentId?: string;
    positionId: string;
    anchorPositionId: string;
    title: string;
    purpose: "forecast" | "counterfactual" | "exploratory";
    realization: "pending" | "matched" | "partial" | "diverged" | "expired-unobserved" | "unknown" | "not-applicable";
    state: string;
    depth: number;
    action: string;
    modeledResponse: string;
    assumptions: string[];
    replanTrigger: string;
    uncertainty: unknown;
    evaluation: WorkbenchEvaluation;
    contextSnapshotId: string;
  }>;
  searchRuns: Array<{
    id: string;
    status: string;
    stopReason?: string;
    budgets: Record<string, number>;
    usage: Record<string, number>;
    rationale: string[];
  }>;
  staging: Array<{ id: string; status: string; authority: string; submittedAt: string; preview?: string; reviewedAt?: string; decision?: string; reason?: string }>;
  revisionProposals: Array<{
    id: string;
    subjectNodeId: string;
    subjectLabel: string;
    interpretation: string;
    priorClaimRefs: string[];
    proposedClaimId: string;
    evidenceRefs: string[];
    reviewStatus: string;
    applied: boolean;
  }>;
  profileHistory: Array<{ id: string; asOf: string; evidenceCutoff: string; claimRefs: string[]; version: string }>;
}

export interface StageEvidenceCommand {
  text: string;
  observedAt: string;
}

export interface OperationResult {
  operation: string;
  message: string;
  snapshot: WorkbenchSnapshot;
}
