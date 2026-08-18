export type Mode = "actual" | "reconstructed" | "hypothetical" | "predicted" | "human-proposed";
export type CanonicalMode = "actual" | "reconstructed";
export type ReviewDecision = "accept" | "reject" | "leave-unresolved";
export type StagingStatus = "staged" | "accepted" | "rejected";

export interface EvidenceItem {
  id: string;
  source_kind: string;
  content_identity: string;
  authority: string;
  acquired_at: string;
  integrity: string;
  sensitivity: string;
  locator?: string | null;
}

export interface Claim {
  id: string;
  subject_ref: string;
  claim_kind: string;
  epistemic_status: string;
  proposition?: string;
  valid_time: { from: string; to: string | null };
  observed_at: string;
  recorded_at: string;
  evidence_refs: string[];
  author: string;
  revision: number;
  revision_of?: string;
  competes_with_refs?: string[];
}

export interface NodeRecord {
  id: string;
  node_type: string;
  identity_scope: string;
}

export interface RelationRecord {
  id: string;
  relation_type: string;
  subject_id: string;
  object_id: string;
  valid_time: { from: string; to: string | null };
  claim_refs: string[];
}

export interface FlowRecord {
  id: string;
  flow_type: string;
  path: string[];
  valid_time: { from: string; to: string | null };
  claim_refs: string[];
}

export interface StateRecord {
  id: string;
  subject_id: string;
  state_type: string;
  value: unknown;
  valid_time: { from: string; to: string | null };
  claim_refs: string[];
}

export interface EventRecord {
  id: string;
  event_type: string;
  mode: Mode;
  occurred_time: string;
  observed_at?: string;
  recorded_at?: string;
  claim_refs: string[];
  resulting_position_id?: string;
}

export interface PlaygroundRecord {
  id: string;
  profile_id: string;
  scope: string;
  time_basis: unknown;
  evidence_policy: string;
}

export interface ProfileSnapshot {
  id: string;
  profile_id: string;
  as_of: string;
  evidence_cutoff: string;
  claim_refs: string[];
  profile_version: string;
  snapshot_identity: string;
}

export interface ReviewDecisionRecord {
  id: string;
  target_ref: string;
  decision: ReviewDecision;
  reviewer: string;
  reviewed_at: string;
  rationale: string;
}

export interface ProfileClaimRevisionProposal {
  id: string;
  subject_node_id: string;
  prior_claim_refs: string[];
  proposed_claim_id: string;
  proposed_claim: Claim;
  interpretation: string;
  evidence_refs: string[];
  review_status: "pending" | "accepted" | "rejected" | "unresolved";
  review_decision_ref: string;
  next_profile_snapshot?: ProfileSnapshot;
  next_states?: StateRecord[];
}

export interface PositionProjection {
  active_node_ids: string[];
  relation_ids: string[];
  flow_ids: string[];
  state_ids: string[];
}

export interface PositionInput {
  id: string;
  mode: CanonicalMode;
  playgroundId: string;
  asOf: string;
  evidenceCutoff: string;
  profileSnapshotId: string;
  perspectiveId?: string;
  question?: string;
  projectorVersion?: string;
}

export interface ProjectedPosition extends PositionInput {
  projection: PositionProjection;
  projectionIdentity: string;
}

export interface SyntheticFixture {
  fixture_id: string;
  contract: string;
  fixture_status: string;
  sources: EvidenceItem[];
  playgrounds: PlaygroundRecord[];
  nodes: NodeRecord[];
  relations: RelationRecord[];
  flows: FlowRecord[];
  claims: Claim[];
  review_decisions: ReviewDecisionRecord[];
  profile_snapshots: ProfileSnapshot[];
  states: StateRecord[];
  events: EventRecord[];
  utterances: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  transitions: Array<Record<string, unknown>>;
  strategy_steps: Array<Record<string, unknown>>;
  profile_claim_revision_proposals: ProfileClaimRevisionProposal[];
}

export interface ImportSummary {
  stagedEvidence: number;
  acceptedEvidence: number;
  canonicalClaims: number;
  canonicalNodes: number;
  canonicalEvents: number;
  canonicalStates: number;
  canonicalRelations: number;
  canonicalFlows: number;
  canonicalPositions: number;
  revisionProposals: number;
}
