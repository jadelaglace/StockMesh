import { randomUUID } from "node:crypto";
import type { SqliteStore } from "../persistence/database.js";
import { PositionProjector } from "../projection/position-projector.js";
import type {
  Claim,
  EvidenceItem,
  EventRecord,
  ImportSummary,
  PositionInput,
  ProfileClaimRevisionProposal,
  ProfileSnapshot,
  ReviewDecisionRecord,
  StateRecord,
  StagingStatus,
  SyntheticFixture,
} from "../domain/types.js";

const canonicalModes = new Set(["actual", "reconstructed"]);

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function equivalentJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function now(): string {
  return new Date().toISOString();
}

export interface StageEvidenceInput {
  id: string;
  contentIdentity: string;
  authority: string;
  payload: EvidenceItem;
}

export interface RevisionAcceptanceResult {
  proposalId: string;
  claimId: string;
  profileSnapshotId: string;
  stateIds: string[];
  positionId?: string;
}

export interface ReviewedRealityStepInput {
  claim: Claim;
  profileSnapshot: ProfileSnapshot;
  position: PositionInput;
  event: EventRecord;
}

export interface ProfileRevisionContinuation {
  profileSnapshot: ProfileSnapshot;
  position: PositionInput;
  event: EventRecord;
}

export class StockMeshApp {
  readonly projector: PositionProjector;

  constructor(private readonly store: SqliteStore, private readonly writer = "stockmesh-p1") {
    this.projector = new PositionProjector(store.db);
  }

  stageEvidence(input: StageEvidenceInput): void {
    const existing = this.store.db.prepare("SELECT content_identity, payload_json, status FROM staging_items WHERE id = ?").get(input.id) as { content_identity: string; payload_json: string; status: StagingStatus } | undefined;
    if (existing) {
      if (existing.content_identity !== input.contentIdentity || !equivalentJson(parseJson(existing.payload_json), input.payload)) {
        throw new Error(`staging identity conflict: ${input.id}`);
      }
      return;
    }
    this.store.db.prepare(`
      INSERT INTO staging_items (id, content_identity, payload_json, status, authority, submitted_at)
      VALUES (?, ?, ?, 'staged', ?, ?)
    `).run(input.id, input.contentIdentity, json(input.payload), input.authority, now());
    this.journal("staging_item", input.id, "stage", input.payload);
  }

  reviewEvidence(id: string, decision: "accept" | "reject", reviewer: string, reason: string): void {
    this.store.transaction(() => this.reviewEvidenceInTransaction(id, decision, reviewer, reason));
  }

  reviewEvidenceAndAppend(id: string, decision: "accept" | "reject", reviewer: string, reason: string, step?: ReviewedRealityStepInput): void {
    this.store.transaction(() => {
      this.reviewEvidenceInTransaction(id, decision, reviewer, reason);
      if (decision === "accept" && step) {
        this.validateRealityStep(step);
        this.insertClaim(step.claim);
        this.insertProfileSnapshot(step.profileSnapshot);
        const position = this.projectPosition(step.position);
        this.insertEvent(step.event);
        this.journal("reality_step", step.event.id, "append", { reviewer, claimId: step.claim.id, positionId: position.id });
      }
    });
  }

  private reviewEvidenceInTransaction(id: string, decision: "accept" | "reject", reviewer: string, reason: string): void {
    const row = this.store.db.prepare("SELECT payload_json, status FROM staging_items WHERE id = ?").get(id) as { payload_json: string; status: StagingStatus } | undefined;
    if (!row) throw new Error(`staging item not found: ${id}`);
    const terminalStatus = decision === "accept" ? "accepted" : "rejected";
    if (row.status !== "staged") {
      if (row.status === terminalStatus) return;
      throw new Error(`staging item is already terminal: ${id}`);
    }
    const status = terminalStatus;
    this.store.db.prepare(`
      UPDATE staging_items SET status = ?, reviewed_at = ?, review_decision = ?, review_reason = ? WHERE id = ?
    `).run(status, now(), decision, reason, id);
    if (decision === "accept") this.insertEvidence(parseJson<EvidenceItem>(row.payload_json));
    this.journal("staging_item", id, `review-${decision}`, { reviewer, reason });
  }

  importSyntheticFixture(fixture: SyntheticFixture): ImportSummary {
    if (fixture.fixture_status !== "synthetic-only") throw new Error("P1 accepts synthetic fixtures only");
    if (fixture.contract !== "stockmesh.domain@0.2.0") throw new Error("fixture must pin stockmesh.domain@0.2.0");

    return this.store.transaction(() => {
      for (const source of fixture.sources) {
        this.stageEvidence({ id: `stage-${source.id}`, contentIdentity: source.content_identity, authority: source.authority, payload: source });
        this.reviewEvidence(source.id ? `stage-${source.id}` : "", "accept", "fixture-reviewer", "synthetic fixture accepted");
      }

      for (const playground of fixture.playgrounds) {
        this.insert("playgrounds", playground.id, `INSERT OR IGNORE INTO playgrounds (id, profile_id, scope, time_basis_json, evidence_policy) VALUES (?, ?, ?, ?, ?)`, [playground.id, playground.profile_id, playground.scope, json(playground.time_basis), playground.evidence_policy], playground);
      }
      for (const node of fixture.nodes) {
        this.insert("nodes", node.id, `INSERT OR IGNORE INTO nodes (id, node_type, identity_scope) VALUES (?, ?, ?)`, [node.id, node.node_type, node.identity_scope], node);
      }
      for (const relation of fixture.relations) {
        this.insert("relations", relation.id, `INSERT OR IGNORE INTO relations (id, relation_type, subject_id, object_id, valid_from, valid_to, claim_refs_json) VALUES (?, ?, ?, ?, ?, ?, ?)`, [relation.id, relation.relation_type, relation.subject_id, relation.object_id, relation.valid_time.from, relation.valid_time.to, json(relation.claim_refs)], relation);
      }
      for (const flow of fixture.flows) {
        this.insert("flows", flow.id, `INSERT OR IGNORE INTO flows (id, flow_type, path_json, valid_from, valid_to, claim_refs_json) VALUES (?, ?, ?, ?, ?, ?)`, [flow.id, flow.flow_type, json(flow.path), flow.valid_time.from, flow.valid_time.to, json(flow.claim_refs)], flow);
      }

      const proposalIds = new Set(fixture.profile_claim_revision_proposals.map((proposal) => proposal.proposed_claim_id));
      const claims = fixture.claims.filter((claim) => !proposalIds.has(claim.id));
      for (const claim of claims) this.insertClaim(claim);
      for (const decision of fixture.review_decisions) this.insertReviewDecision(decision);

      const rootSnapshots = fixture.profile_snapshots.filter((snapshot) => !snapshot.claim_refs.some((claimId) => proposalIds.has(claimId)));
      for (const snapshot of rootSnapshots) this.insertProfileSnapshot(snapshot);
      const rootStateIds = new Set(fixture.states.filter((state) => !state.claim_refs.some((claimId) => proposalIds.has(claimId))).map((state) => state.id));
      for (const state of fixture.states.filter((state) => rootStateIds.has(state.id))) this.insertState(state);

      const canonicalEvents = fixture.events.filter((event) => canonicalModes.has(event.mode) && !event.claim_refs.some((claimId) => proposalIds.has(claimId)));
      for (const event of canonicalEvents) this.insertEvent(event);
      for (const utterance of fixture.utterances) {
        this.insert("utterances", String(utterance.id), `INSERT OR IGNORE INTO utterances (id, speaker_node_id, audience_node_ids_json, occurred_time, text, evidence_ref, claim_ref) VALUES (?, ?, ?, ?, ?, ?, ?)`, [String(utterance.id), String(utterance.speaker_node_id), json(utterance.audience_node_ids), String(utterance.occurred_time), String(utterance.text), String(utterance.evidence_ref), String(utterance.claim_ref)], utterance);
      }
      for (const action of fixture.actions.filter((action) => canonicalModes.has(String(action.mode)))) {
        this.insert("actions", String(action.id), `INSERT OR IGNORE INTO actions (id, actor_node_id, mode, target_position_id, constraints_json) VALUES (?, ?, ?, ?, ?)`, [String(action.id), String(action.actor_node_id), String(action.mode), String(action.target_position_id), json(action.constraints)], action);
      }
      const canonicalTransitions = fixture.transitions.filter((transition) => canonicalModes.has(String(transition.mode)) && String(transition.id) !== "transition-syn-profile-review");
      const canonicalTransitionIds = new Set(canonicalTransitions.map((transition) => String(transition.id)));
      for (const transition of canonicalTransitions) {
        this.insert("transitions", String(transition.id), `INSERT OR IGNORE INTO transitions (id, from_position_id, to_position_id, mode, cause_refs_json, effect_summary) VALUES (?, ?, ?, ?, ?, ?)`, [String(transition.id), String(transition.from_position_id), String(transition.to_position_id), String(transition.mode), json(transition.cause_refs), String(transition.effect_summary)], transition);
      }
      for (const step of fixture.strategy_steps.filter((step) => step.branch_membership === "main-line" && canonicalModes.has(String(step.mode)) && canonicalTransitionIds.has(String(step.transition_id)))) {
        this.insert("strategy_steps", String(step.id), `INSERT OR IGNORE INTO strategy_steps (id, before_position_id, input_refs_json, event_refs_json, action_refs_json, transition_id, after_position_id, mode, evidence_refs_json, branch_membership) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [String(step.id), String(step.before_position_id), json(step.input_refs), json(step.event_refs), json(step.action_refs), String(step.transition_id), String(step.after_position_id), String(step.mode), json(step.evidence_refs), String(step.branch_membership)], step);
      }

      for (const proposal of fixture.profile_claim_revision_proposals) {
        const proposedClaim = fixture.claims.find((claim) => claim.id === proposal.proposed_claim_id);
        if (!proposedClaim) throw new Error(`proposal claim not found: ${proposal.proposed_claim_id}`);
        this.insert("profile_claim_revision_proposals", proposal.id, `INSERT OR IGNORE INTO profile_claim_revision_proposals (id, subject_node_id, prior_claim_refs_json, proposed_claim_id, proposed_claim_json, interpretation, evidence_refs_json, review_status, review_decision_ref, next_profile_snapshot_json, next_states_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [proposal.id, proposal.subject_node_id, json(proposal.prior_claim_refs), proposal.proposed_claim_id, json(proposedClaim), proposal.interpretation, json(proposal.evidence_refs), proposal.review_status, proposal.review_decision_ref, json(fixture.profile_snapshots.find((snapshot) => snapshot.id === "profile-snapshot-syn-current") ?? null), json(fixture.states.filter((state) => state.claim_refs.includes(proposal.proposed_claim_id)))], proposal);
      }

      return {
        stagedEvidence: fixture.sources.length,
        acceptedEvidence: fixture.sources.length,
        canonicalClaims: claims.length,
        canonicalNodes: fixture.nodes.length,
        canonicalEvents: canonicalEvents.length,
        canonicalStates: rootStateIds.size,
        canonicalRelations: fixture.relations.length,
        canonicalFlows: fixture.flows.length,
        canonicalPositions: 0,
        revisionProposals: fixture.profile_claim_revision_proposals.length,
      };
    });
  }

  appendReviewedRealityStep(input: ReviewedRealityStepInput, reviewer: string): ReturnType<PositionProjector["project"]> {
    return this.store.transaction(() => {
      this.validateRealityStep(input);
      this.insertClaim(input.claim);
      this.insertProfileSnapshot(input.profileSnapshot);
      const position = this.projectPosition(input.position);
      this.insertEvent(input.event);
      this.journal("reality_step", input.event.id, "append", { reviewer, claimId: input.claim.id, positionId: position.id });
      return position;
    });
  }

  acceptProfileClaimRevision(proposalId: string, reviewer: string, continuation?: ProfileRevisionContinuation): RevisionAcceptanceResult {
    return this.store.transaction(() => {
      const proposal = this.store.db.prepare("SELECT * FROM profile_claim_revision_proposals WHERE id = ?").get(proposalId) as {
        id: string; proposed_claim_id: string; proposed_claim_json: string; prior_claim_refs_json: string;
        review_status: string; review_decision_ref: string; next_profile_snapshot_json: string | null; next_states_json: string | null;
      } | undefined;
      if (!proposal) throw new Error(`profile revision proposal not found: ${proposalId}`);
      const review = this.store.db.prepare("SELECT decision FROM review_decisions WHERE id = ?").get(proposal.review_decision_ref) as { decision: string } | undefined;
      if (proposal.review_status !== "accepted" || review?.decision !== "accept") throw new Error(`profile revision is not accepted: ${proposalId}`);
      const priorClaimIds = parseJson<string[]>(proposal.prior_claim_refs_json);
      for (const priorClaimId of priorClaimIds) {
        if (!this.store.db.prepare("SELECT 1 FROM claims WHERE id = ?").get(priorClaimId)) throw new Error(`prior Claim is not canonical: ${priorClaimId}`);
      }
      const claim = parseJson<Claim>(proposal.proposed_claim_json);
      const alreadyApplied = Boolean(this.store.db.prepare("SELECT 1 FROM claims WHERE id = ?").get(proposal.proposed_claim_id));
      if (alreadyApplied) {
        this.insertClaim(claim);
        const existingSnapshot = proposal.next_profile_snapshot_json ? parseJson<ProfileSnapshot>(proposal.next_profile_snapshot_json) : undefined;
        if (!existingSnapshot) throw new Error(`accepted proposal has no next profile snapshot: ${proposalId}`);
        this.insertProfileSnapshot(existingSnapshot);
        for (const state of proposal.next_states_json ? parseJson<StateRecord[]>(proposal.next_states_json) : []) this.insertState(state);
      } else {
        this.insertClaim(claim);
        const snapshot = proposal.next_profile_snapshot_json ? parseJson<ProfileSnapshot>(proposal.next_profile_snapshot_json) : undefined;
        if (!snapshot) throw new Error(`accepted proposal has no next profile snapshot: ${proposalId}`);
        this.insertProfileSnapshot(snapshot);
        const states = proposal.next_states_json ? parseJson<StateRecord[]>(proposal.next_states_json) : [];
        for (const state of states) this.insertState(state);
        this.journal("profile_claim_revision_proposal", proposalId, "accept", { reviewer, claimId: claim.id, profileSnapshotId: snapshot.id });
      }
      const result = this.revisionResult(proposal);
      if (!continuation) return result;
      if (!continuation.profileSnapshot.claim_refs.includes(result.claimId)) throw new Error("revision continuation profile must include the accepted Claim");
      if (continuation.position.profileSnapshotId !== continuation.profileSnapshot.id) throw new Error("revision continuation Position/profile mismatch");
      if (continuation.event.resulting_position_id !== continuation.position.id || !continuation.event.claim_refs.includes(result.claimId)) {
        throw new Error("revision continuation Event must link the accepted Claim and resulting Position");
      }
      this.insertProfileSnapshot(continuation.profileSnapshot);
      const position = this.projectPosition(continuation.position);
      this.insertEvent(continuation.event);
      this.journal("profile_claim_revision_proposal", proposalId, "advance-position", { reviewer, positionId: position.id, eventId: continuation.event.id });
      return { ...result, positionId: position.id };
    });
  }

  projectPosition(input: PositionInput): ReturnType<PositionProjector["project"]> {
    if (!this.store.db.prepare("SELECT 1 FROM profile_snapshots WHERE id = ?").get(input.profileSnapshotId)) throw new Error(`profile snapshot not found: ${input.profileSnapshotId}`);
    const projected = this.projector.project(input);
    if (this.projector.persist(projected)) this.journal("position", projected.id, "project", projected);
    return projected;
  }

  replayPosition(input: PositionInput): ReturnType<PositionProjector["project"]> {
    const replayed = this.projector.project(input);
    const existing = this.store.db.prepare("SELECT projection_identity, projection_json FROM positions WHERE id = ?").get(input.id) as { projection_identity: string; projection_json: string } | undefined;
    if (!existing) throw new Error(`position not found for replay: ${input.id}`);
    if (existing.projection_identity !== replayed.projectionIdentity || existing.projection_json !== json(replayed.projection)) throw new Error(`replay mismatch: ${input.id}`);
    return replayed;
  }

  rebuildPosition(input: PositionInput): ReturnType<PositionProjector["project"]> {
    return this.store.transaction(() => {
      const rebuilt = this.projector.project(input);
      const existing = this.getPosition(input.id);
      if (!existing) throw new Error(`position not found for rebuild: ${input.id}`);
      if (existing.projectionIdentity !== rebuilt.projectionIdentity || !equivalentJson(existing.projection, rebuilt.projection)) {
        throw new Error(`rebuild mismatch: ${input.id}`);
      }
      this.projector.persist(rebuilt);
      this.journal("position", rebuilt.id, "rebuild", rebuilt);
      return rebuilt;
    });
  }

  getPosition(id: string): ReturnType<PositionProjector["project"]> | undefined {
    const row = this.store.db.prepare("SELECT * FROM positions WHERE id = ? AND mode IN ('actual', 'reconstructed')").get(id) as {
      id: string; mode: "actual" | "reconstructed"; playground_id: string; as_of: string; evidence_cutoff: string;
      profile_snapshot_id: string; perspective_id: string | null; question: string | null; projector_version: string;
      projection_identity: string; projection_json: string;
    } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      mode: row.mode,
      playgroundId: row.playground_id,
      asOf: row.as_of,
      evidenceCutoff: row.evidence_cutoff,
      profileSnapshotId: row.profile_snapshot_id,
      ...(row.perspective_id === null ? {} : { perspectiveId: row.perspective_id }),
      ...(row.question === null ? {} : { question: row.question }),
      projectorVersion: row.projector_version,
      projectionIdentity: row.projection_identity,
      projection: parseJson(row.projection_json),
    };
  }

  count(table: string): number {
    if (!/^[a-z_]+$/.test(table)) throw new Error("invalid table name");
    const row = this.store.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
    return row.count;
  }

  hasEventMode(mode: string): boolean {
    return Boolean(this.store.db.prepare("SELECT 1 FROM events WHERE mode = ? LIMIT 1").get(mode));
  }

  private insertEvidence(evidence: EvidenceItem): void {
    const existingById = this.store.db.prepare("SELECT content_identity, payload_json FROM evidence_items WHERE id = ?").get(evidence.id) as {
      content_identity: string;
      payload_json: string;
    } | undefined;
    if (existingById) {
      if (existingById.content_identity !== evidence.content_identity || !equivalentJson(parseJson(existingById.payload_json), evidence)) {
        throw new Error(`evidence identity conflict: ${evidence.id}`);
      }
      return;
    }
    const existingByContent = this.store.db.prepare("SELECT id FROM evidence_items WHERE content_identity = ?").get(evidence.content_identity) as { id: string } | undefined;
    if (existingByContent) throw new Error(`evidence content identity already belongs to ${existingByContent.id}`);
    this.store.db.prepare(`
      INSERT INTO evidence_items (id, source_kind, content_identity, authority, acquired_at, integrity, sensitivity, locator, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(evidence.id, evidence.source_kind, evidence.content_identity, evidence.authority, evidence.acquired_at, evidence.integrity, evidence.sensitivity, evidence.locator ?? null, json(evidence));
    this.journal("evidence_item", evidence.id, "accept", evidence);
  }

  private insertClaim(claim: Claim): void {
    this.insert("claims", claim.id, `INSERT OR IGNORE INTO claims (id, subject_ref, claim_kind, epistemic_status, proposition, valid_from, valid_to, observed_at, recorded_at, evidence_refs_json, author, revision, revision_of, competes_with_refs_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [claim.id, claim.subject_ref, claim.claim_kind, claim.epistemic_status, claim.proposition ?? null, claim.valid_time.from, claim.valid_time.to, claim.observed_at, claim.recorded_at, json(claim.evidence_refs), claim.author, claim.revision, claim.revision_of ?? null, json(claim.competes_with_refs ?? [])], claim);
  }

  private insertReviewDecision(decision: ReviewDecisionRecord): void {
    this.insert("review_decisions", decision.id, `INSERT OR IGNORE INTO review_decisions (id, target_ref, decision, reviewer, reviewed_at, rationale) VALUES (?, ?, ?, ?, ?, ?)`, [decision.id, decision.target_ref, decision.decision, decision.reviewer, decision.reviewed_at, decision.rationale], decision);
  }

  private insertProfileSnapshot(snapshot: ProfileSnapshot): void {
    this.insert("profile_snapshots", snapshot.id, `INSERT OR IGNORE INTO profile_snapshots (id, profile_id, as_of, evidence_cutoff, claim_refs_json, profile_version, snapshot_identity) VALUES (?, ?, ?, ?, ?, ?, ?)`, [snapshot.id, snapshot.profile_id, snapshot.as_of, snapshot.evidence_cutoff, json(snapshot.claim_refs), snapshot.profile_version, snapshot.snapshot_identity], snapshot);
  }

  private insertState(state: StateRecord): void {
    this.insert("states", state.id, `INSERT OR IGNORE INTO states (id, subject_id, state_type, value_json, valid_from, valid_to, claim_refs_json) VALUES (?, ?, ?, ?, ?, ?, ?)`, [state.id, state.subject_id, state.state_type, json(state.value), state.valid_time.from, state.valid_time.to, json(state.claim_refs)], state);
  }

  private insertEvent(event: EventRecord): void {
    this.insert("events", event.id, `INSERT OR IGNORE INTO events (id, event_type, mode, occurred_time, observed_at, recorded_at, claim_refs_json, resulting_position_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [event.id, event.event_type, event.mode, event.occurred_time, event.observed_at ?? null, event.recorded_at ?? null, json(event.claim_refs), event.resulting_position_id ?? null], event);
  }

  private validateRealityStep(input: ReviewedRealityStepInput): void {
    if (!canonicalModes.has(input.event.mode)) throw new Error("reviewed reality Event must be canonical");
    if (input.claim.evidence_refs.length === 0) throw new Error("reviewed reality Claim requires Evidence");
    for (const evidenceId of input.claim.evidence_refs) {
      if (!this.store.db.prepare("SELECT 1 FROM evidence_items WHERE id = ?").get(evidenceId)) throw new Error(`reviewed Evidence is not canonical: ${evidenceId}`);
    }
    if (!input.profileSnapshot.claim_refs.includes(input.claim.id)) throw new Error("reviewed reality profile must include its Claim");
    if (input.position.profileSnapshotId !== input.profileSnapshot.id) throw new Error("reviewed reality Position/profile mismatch");
    if (input.event.resulting_position_id !== input.position.id || !input.event.claim_refs.includes(input.claim.id)) {
      throw new Error("reviewed reality Event must link its Claim and resulting Position");
    }
    if (input.event.occurred_time !== input.position.asOf) throw new Error("reviewed reality Event/Position time mismatch");
    if ((input.event.recorded_at ?? input.event.occurred_time) > input.position.evidenceCutoff) throw new Error("reviewed reality exceeds the Position cutoff");
  }

  private insert(table: string, id: string, sql: string, params: unknown[], payload: unknown): void {
    if (!/^[a-z_]+$/.test(table)) throw new Error("invalid table name");
    const existingRow = this.store.db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
    if (existingRow) {
      const provenance = this.store.db.prepare(`
        SELECT payload_json FROM change_journal
        WHERE entity_type = ? AND entity_id = ? AND operation = 'insert'
        ORDER BY id LIMIT 1
      `).get(table, id) as { payload_json: string } | undefined;
      if (!provenance || !equivalentJson(parseJson(provenance.payload_json), payload)) throw new Error(`${table} identity conflict: ${id}`);
      return;
    }
    const result = this.store.db.prepare(sql).run(...params);
    if (result.changes !== 1) throw new Error(`${table} insert did not materialize: ${id}`);
    this.journal(table, id, "insert", payload);
  }

  private journal(entityType: string, entityId: string, operation: string, payload: unknown): void {
    this.store.db.prepare(`
      INSERT OR IGNORE INTO change_journal (operation_id, entity_type, entity_id, operation, writer, occurred_at, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), entityType, entityId, operation, this.writer, now(), json(payload));
  }

  private revisionResult(proposal: { id: string; proposed_claim_id: string; next_profile_snapshot_json: string | null; next_states_json: string | null }): RevisionAcceptanceResult {
    if (!proposal.next_profile_snapshot_json) throw new Error(`accepted proposal has no next profile snapshot: ${proposal.id}`);
    const snapshot = parseJson<ProfileSnapshot>(proposal.next_profile_snapshot_json);
    const states = proposal.next_states_json ? parseJson<StateRecord[]>(proposal.next_states_json) : [];
    return { proposalId: proposal.id, claimId: proposal.proposed_claim_id, profileSnapshotId: snapshot.id, stateIds: states.map((state) => state.id) };
  }
}
