import { createHash } from "node:crypto";
import type { SqliteStore } from "../persistence/database.js";
import type { StockMeshApp } from "../application/stockmesh-app.js";
import type { Claim, EventRecord, PositionInput, ProfileSnapshot, SyntheticFixture } from "../domain/types.js";
import type { MethodRunner } from "../methods/index.js";
import type { PossibilityStore } from "../possibilities/index.js";
import type { SearchCoordinator } from "../search/index.js";
import type { StageEvidenceCommand, WorkbenchNode, WorkbenchSnapshot } from "./types.js";

const defaultHorizon = "2026-08-17T12:30:00Z";
const objectives = [
  { partyNodeId: "node-syn-sponsor", objective: "improve decision clarity", weight: 0.6 },
  { partyNodeId: "node-syn-coordinator", objective: "avoid unnecessary escalation", weight: 0.4 },
];
const budgets = {
  maxDepth: 2,
  maxMaterializedPositions: 10,
  maxAnalysisCalls: 10,
  maxElapsedMs: 60_000,
  maxTokens: 10_000,
  maxCost: 10,
};

function parse<T>(value: string): T {
  return JSON.parse(value) as T;
}

function label(id: string): string {
  return id.replace(/^node-syn-/, "").replace(/^position-web-/, "").split("-").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export class WorkbenchService {
  constructor(
    private readonly store: SqliteStore,
    private readonly app: StockMeshApp,
    private readonly methods: MethodRunner,
    private readonly possibilities: PossibilityStore,
    private readonly search: SearchCoordinator,
    private readonly fixture: SyntheticFixture,
  ) {}

  initialize(): void {
    for (const source of this.fixture.positions.filter((item) => item.mode === "actual" || item.mode === "reconstructed")) {
      if (!this.store.db.prepare("SELECT 1 FROM profile_snapshots WHERE id = ?").get(source.profile_snapshot_id)) continue;
      const input: PositionInput = {
        id: source.id,
        mode: source.mode as "actual" | "reconstructed",
        playgroundId: source.playground_id,
        asOf: source.as_of,
        evidenceCutoff: source.evidence_cutoff,
        profileSnapshotId: source.profile_snapshot_id,
        perspectiveId: source.perspective_id ?? "perspective-syn-analyst",
        question: source.question ?? "Which response best improves decision clarity without unnecessary escalation?",
      };
      if (!this.app.getPosition(source.id)) this.app.projectPosition(input);
      this.ensureFoundationMethod(source.id);
    }
  }

  snapshot(selectedPositionId?: string): WorkbenchSnapshot {
    const requestedPositionId = selectedPositionId ?? this.currentPositionId();
    const position = this.position(requestedPositionId);
    if (!position) throw new Error(`Position not found: ${requestedPositionId}`);
    const projection = parse<WorkbenchSnapshot["positions"][number]["projection"]>(String(position.projection_json));
    const allPositions = this.store.db.prepare("SELECT * FROM positions ORDER BY as_of, id").all() as Array<Record<string, unknown>>;
    const claims = this.store.db.prepare("SELECT * FROM claims ORDER BY subject_ref, valid_from, revision, id").all() as Array<Record<string, unknown>>;
    const profileSnapshot = this.store.db.prepare("SELECT claim_refs_json FROM profile_snapshots WHERE id = ?").get(String(position.profile_snapshot_id)) as { claim_refs_json: string } | undefined;
    if (!profileSnapshot) throw new Error(`Profile snapshot not found: ${String(position.profile_snapshot_id)}`);
    const visibleClaimIds = new Set(parse<string[]>(profileSnapshot.claim_refs_json));
    const claimsBySubject = new Map<string, Array<Record<string, unknown>>>();
    for (const claim of claims.filter((row) => visibleClaimIds.has(String(row.id)) && Date.parse(String(row.recorded_at)) <= Date.parse(String(position.as_of)))) {
      const subject = String(claim.subject_ref);
      claimsBySubject.set(subject, [...(claimsBySubject.get(subject) ?? []), claim]);
    }
    const states = (this.store.db.prepare("SELECT * FROM states ORDER BY subject_id, state_type, valid_from").all() as Array<Record<string, unknown>>)
      .filter((row) => projection.state_ids.includes(String(row.id)));
    const nodes: WorkbenchNode[] = projection.active_node_ids.map((id) => ({
      id,
      label: label(id),
      type: String((this.store.db.prepare("SELECT node_type FROM nodes WHERE id = ?").get(id) as { node_type: string }).node_type),
      profileLabel: "Pawn",
      states: states.filter((row) => row.subject_id === id).map((row) => ({
        id: String(row.id), type: String(row.state_type), value: parse(String(row.value_json)), claimRefs: parse(String(row.claim_refs_json)),
      })),
      claims: (claimsBySubject.get(id) ?? []).map((row) => ({
        id: String(row.id), kind: String(row.claim_kind), status: String(row.epistemic_status),
        ...(row.proposition === null ? {} : { proposition: String(row.proposition) }),
        validFrom: String(row.valid_from), ...(row.valid_to === null ? {} : { validTo: String(row.valid_to) }),
        revision: Number(row.revision), ...(row.revision_of === null ? {} : { revisionOf: String(row.revision_of) }),
        evidenceRefs: parse(String(row.evidence_refs_json)),
      })),
    }));
    const events = this.store.db.prepare("SELECT * FROM events ORDER BY occurred_time, id").all() as Array<Record<string, unknown>>;
    const evidenceRefsByClaim = new Map(claims.map((row) => [String(row.id), parse<string[]>(String(row.evidence_refs_json))]));
    const subjectByClaim = new Map(claims.map((row) => [String(row.id), String(row.subject_ref)]));
    const utterances = this.store.db.prepare("SELECT * FROM utterances").all() as Array<Record<string, unknown>>;
    const selectedVariation = this.store.db.prepare(`SELECT c.position_id AS root_position_id FROM variations v
      JOIN context_snapshots c ON c.id = v.root_context_snapshot_id WHERE v.position_id = ?`).get(String(position.id)) as { root_position_id: string } | undefined;
    const branchRootIds = [...new Set([String(position.id), ...(selectedVariation ? [selectedVariation.root_position_id] : [])])];
    const branchPlaceholders = branchRootIds.map(() => "?").join(", ");
    const branches = this.store.db.prepare(`
      SELECT DISTINCT v.*, c.proposal_json, t.mode AS transition_mode, t.action_json, t.modeled_response,
        t.assumptions_json AS transition_assumptions_json, t.replan_trigger,
        e.party_scorecards_json, e.horizon AS evaluation_horizon, e.risk_policy,
        e.evidence_cutoff AS evaluation_evidence_cutoff, e.evaluation_profile,
        e.uncertainty_json AS evaluation_uncertainty_json
      FROM variations v
      JOIN variation_candidates c ON c.id = v.candidate_id
      JOIN possibility_transitions t ON t.candidate_id = c.id
      JOIN evaluations e ON e.target_position_id = v.position_id
      JOIN search_frontier f ON f.position_id = v.position_id
      JOIN search_runs s ON s.id = f.search_run_id
      WHERE s.root_position_id IN (${branchPlaceholders})
      ORDER BY v.depth, v.created_at, v.id
    `).all(...branchRootIds) as Array<Record<string, unknown>>;
    const assessments = this.store.db.prepare("SELECT id, forecast_variation_id, status, assessed_at, rationale FROM forecast_assessments ORDER BY assessed_at, id").all() as Array<Record<string, unknown>>;
    const assessmentsByVariation = new Map<string, Array<Record<string, unknown>>>();
    for (const assessment of assessments) {
      const variationId = String(assessment.forecast_variation_id);
      assessmentsByVariation.set(variationId, [...(assessmentsByVariation.get(variationId) ?? []), assessment]);
    }
    const horizon = this.horizonFor(String(position.as_of));
    return {
      product: { name: "StockMesh", mode: "synthetic-demo", profileLabel: "Organizational strategy / Pawn" },
      context: {
        playgroundId: "playground-syn-orchard",
        scope: "Public synthetic cross-team decision scenario",
        perspectiveId: "perspective-syn-analyst",
        question: "Which response best improves decision clarity without unnecessary escalation?",
        horizon,
        evidenceCutoff: String(position.evidence_cutoff),
        riskPolicy: "balanced-synthetic-risk",
        evaluationProfile: "organizational-synthetic@1.0.0",
        objectives: objectives.map((item) => ({ ...item, partyLabel: label(item.partyNodeId) })),
      },
      positions: allPositions.map((row) => ({
        id: String(row.id), mode: String(row.mode), asOf: String(row.as_of), evidenceCutoff: String(row.evidence_cutoff),
        profileSnapshotId: String(row.profile_snapshot_id), projectionIdentity: String(row.projection_identity),
        projection: parse(String(row.projection_json)),
      })),
      selectedPositionId: String(position.id),
      timeline: [...events.map((row) => {
        const claimRefs = parse<string[]>(String(row.claim_refs_json));
        const utterance = utterances.find((item) => item.claim_ref === claimRefs[0]);
        const mode = String(row.mode);
        const recordedAt = row.recorded_at === null ? undefined : String(row.recorded_at);
        const occurredAt = String(row.occurred_time);
        const cutoffStatus: WorkbenchSnapshot["timeline"][number]["cutoffStatus"] = mode === "predicted" || mode === "hypothetical"
          ? "variation"
          : recordedAt && Date.parse(occurredAt) <= Date.parse(String(position.as_of)) && Date.parse(recordedAt) <= Date.parse(String(position.evidence_cutoff)) ? "available" : "hindsight";
        const participantNodeIds = [...new Set([
          ...(utterance ? [String(utterance.speaker_node_id), ...parse<string[]>(String(utterance.audience_node_ids_json))] : []),
          ...claimRefs.map((claimId) => subjectByClaim.get(claimId)).filter((id): id is string => Boolean(id?.startsWith("node-"))),
        ])];
        return {
          id: String(row.id), type: String(row.event_type), mode, occurredAt,
          ...(recordedAt ? { recordedAt } : {}), cutoffStatus, participantNodeIds, claimRefs,
          evidenceRefs: [...new Set(claimRefs.flatMap((claimId) => evidenceRefsByClaim.get(claimId) ?? []))],
          summary: utterance ? String(utterance.text) : `${label(String(row.event_type))} event`,
          ...(row.resulting_position_id === null ? {} : { resultingPositionId: String(row.resulting_position_id) }),
        };
      }), ...branches.map((row) => {
        const proposal = parse<{ title: string }>(String(row.proposal_json));
        return {
          id: `timeline-${String(row.id)}`,
          type: "modeled-transition",
          mode: String(row.transition_mode),
          occurredAt: String(row.evaluation_horizon),
          cutoffStatus: "variation" as const,
          participantNodeIds: [],
          claimRefs: [],
          evidenceRefs: [],
          summary: proposal.title,
          resultingPositionId: String(row.position_id),
        };
      })].sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt) || left.id.localeCompare(right.id)),
      graph: {
        nodes,
        relations: (this.store.db.prepare("SELECT * FROM relations ORDER BY id").all() as Array<Record<string, unknown>>)
          .filter((row) => projection.relation_ids.includes(String(row.id)))
          .map((row) => { const claimRefs = parse<string[]>(String(row.claim_refs_json)); return { id: String(row.id), type: String(row.relation_type), source: String(row.subject_id), target: String(row.object_id), claimRefs, evidenceRefs: [...new Set(claimRefs.flatMap((claimId) => evidenceRefsByClaim.get(claimId) ?? []))] }; }),
        flows: (this.store.db.prepare("SELECT * FROM flows ORDER BY id").all() as Array<Record<string, unknown>>)
          .filter((row) => projection.flow_ids.includes(String(row.id)))
          .map((row) => { const claimRefs = parse<string[]>(String(row.claim_refs_json)); return { id: String(row.id), type: String(row.flow_type), path: parse<string[]>(String(row.path_json)), claimRefs, evidenceRefs: [...new Set(claimRefs.flatMap((claimId) => evidenceRefsByClaim.get(claimId) ?? []))] }; }),
      },
      trace: {
        evidence: (this.store.db.prepare("SELECT id, source_kind, authority, acquired_at, integrity, sensitivity FROM evidence_items WHERE acquired_at <= ? ORDER BY acquired_at, id").all(String(position.evidence_cutoff)) as Array<Record<string, unknown>>)
          .map((row) => ({ id: String(row.id), sourceKind: String(row.source_kind), authority: String(row.authority), acquiredAt: String(row.acquired_at), integrity: String(row.integrity), sensitivity: String(row.sensitivity) })),
        methods: (this.store.db.prepare(`SELECT r.id, r.method_id, r.method_version, r.status, x.output_json, x.caveats_json FROM method_runs r JOIN method_results x ON x.run_id = r.id WHERE r.position_id = ? ORDER BY r.started_at`).all(String(position.id)) as Array<Record<string, unknown>>)
          .map((row) => ({ runId: String(row.id), methodId: String(row.method_id), version: String(row.method_version), status: String(row.status), output: parse(String(row.output_json)), caveats: parse(String(row.caveats_json)) })),
        analyses: (this.store.db.prepare(`SELECT r.id, r.provider, r.model, r.configuration_identity, r.status, r.context_snapshot_id, r.usage_tokens, r.usage_cost
          FROM analysis_runs r JOIN context_snapshots c ON c.id = r.context_snapshot_id WHERE c.position_id = ? ORDER BY r.started_at DESC`).all(String(position.id)) as Array<Record<string, unknown>>)
          .map((row) => ({ id: String(row.id), provider: String(row.provider), model: String(row.model), configurationIdentity: String(row.configuration_identity), status: String(row.status), contextSnapshotId: String(row.context_snapshot_id), tokens: Number(row.usage_tokens), cost: Number(row.usage_cost) })),
      },
      branches: branches.map((row) => {
        const proposal = parse<{ title: string; uncertainty: unknown }>(String(row.proposal_json));
        const purpose = String(row.purpose) as "forecast" | "counterfactual" | "exploratory";
        const assessmentHistory = (assessmentsByVariation.get(String(row.id)) ?? []).map((item) => ({
          id: String(item.id), status: String(item.status), assessedAt: String(item.assessed_at), rationale: String(item.rationale),
        }));
        const assessment = assessmentHistory.at(-1)?.status;
        const action = parse<{ description?: string; summary?: string } | string>(String(row.action_json));
        return {
          id: String(row.id), ...(row.parent_variation_id === null ? {} : { parentId: String(row.parent_variation_id) }),
          positionId: String(row.position_id), anchorPositionId: String(row.anchor_position_id), title: proposal.title, purpose,
          realization: purpose !== "forecast" ? "not-applicable" : assessment === "partially-matched" ? "partial" : (assessment ?? "pending") as WorkbenchSnapshot["branches"][number]["realization"],
          state: String(row.state), depth: Number(row.depth), action: typeof action === "string" ? action : action.description ?? action.summary ?? JSON.stringify(action),
          modeledResponse: String(row.modeled_response), assumptions: parse(String(row.transition_assumptions_json)), replanTrigger: String(row.replan_trigger),
          uncertainty: proposal.uncertainty,
          evaluation: {
            partyScorecards: parse(String(row.party_scorecards_json)), horizon: String(row.evaluation_horizon),
            riskPolicy: String(row.risk_policy), evidenceCutoff: String(row.evaluation_evidence_cutoff),
            evaluationProfile: String(row.evaluation_profile), uncertainty: parse(String(row.evaluation_uncertainty_json)),
          },
          contextSnapshotId: String(row.root_context_snapshot_id),
          assessmentHistory,
        };
      }),
      searchRuns: (this.store.db.prepare(`SELECT * FROM search_runs WHERE root_position_id IN (${branchPlaceholders}) ORDER BY started_at DESC`).all(...branchRootIds) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id), status: String(row.status), ...(row.stop_reason === null ? {} : { stopReason: String(row.stop_reason) }),
        budgets: parse(String(row.budgets_json)), usage: parse(String(row.usage_json)), rationale: parse(String(row.selection_rationale_json)),
      })),
      staging: (this.store.db.prepare("SELECT id, status, authority, payload_json, submitted_at, reviewed_at, review_decision, review_reason FROM staging_items ORDER BY submitted_at DESC").all() as Array<Record<string, unknown>>).map((row) => {
        const payload = parse<{ sensitivity?: string; preview?: string }>(String(row.payload_json));
        return {
        id: String(row.id), status: String(row.status), authority: String(row.authority), submittedAt: String(row.submitted_at),
        ...(payload.sensitivity === "synthetic" && payload.preview ? { preview: payload.preview } : {}),
        ...(row.reviewed_at === null ? {} : { reviewedAt: String(row.reviewed_at) }), ...(row.review_decision === null ? {} : { decision: String(row.review_decision) }),
        ...(row.review_reason === null ? {} : { reason: String(row.review_reason) }),
      }; }),
      revisionProposals: (this.store.db.prepare("SELECT * FROM profile_claim_revision_proposals ORDER BY id").all() as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id), subjectNodeId: String(row.subject_node_id), subjectLabel: label(String(row.subject_node_id)), interpretation: String(row.interpretation),
        priorClaimRefs: parse(String(row.prior_claim_refs_json)), proposedClaimId: String(row.proposed_claim_id), evidenceRefs: parse(String(row.evidence_refs_json)),
        reviewStatus: String(row.review_status), applied: Boolean(this.store.db.prepare("SELECT 1 FROM claims WHERE id = ?").get(String(row.proposed_claim_id))),
      })),
      profileHistory: (this.store.db.prepare("SELECT * FROM profile_snapshots ORDER BY as_of, id").all() as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id), asOf: String(row.as_of), evidenceCutoff: String(row.evidence_cutoff), claimRefs: parse(String(row.claim_refs_json)), version: String(row.profile_version),
      })),
    };
  }

  stageEvidence(input: StageEvidenceCommand): string {
    if (!input.text.trim()) throw new Error("Evidence text is required");
    if (!Number.isFinite(Date.parse(input.observedAt))) throw new Error("Evidence time is invalid");
    const identity = hash(`${input.observedAt}\n${input.text.trim()}`);
    const evidenceId = `evidence-web-${identity.slice(0, 16)}`;
    const stageId = `stage-${evidenceId}`;
    const payload = {
      id: evidenceId, source_kind: "synthetic-user-note", content_identity: identity,
      authority: "user-reviewed-synthetic", acquired_at: input.observedAt, integrity: `sha256:${identity}`,
      sensitivity: "synthetic", locator: null, preview: input.text.trim(),
    };
    this.app.stageEvidence({
      id: stageId,
      contentIdentity: identity,
      authority: "user-reviewed-synthetic",
      payload,
    });
    return stageId;
  }

  reviewEvidence(stageId: string, decision: "accept" | "reject"): void {
    const staged = this.store.db.prepare("SELECT payload_json FROM staging_items WHERE id = ?").get(stageId) as { payload_json: string } | undefined;
    if (!staged) throw new Error(`staging item not found: ${stageId}`);
    const evidence = parse<{ id: string; acquired_at: string; preview: string }>(staged.payload_json);
    if (decision === "reject") {
      this.app.reviewEvidence(stageId, decision, "p4-web-user", `Synthetic evidence ${decision}ed in P4 workbench`);
      return;
    }
    const step = this.buildReviewedRealityStep(evidence);
    this.app.reviewEvidenceAndAppend(stageId, decision, "p4-web-user", `Synthetic evidence ${decision}ed in P4 workbench`, step);
    this.ensureFoundationMethod(step.position.id);
  }

  private buildReviewedRealityStep(evidence: { id: string; acquired_at: string; preview: string }): {
    claim: Claim;
    profileSnapshot: ProfileSnapshot;
    position: PositionInput;
    event: EventRecord;
  } {
    const current = this.position(this.currentPositionId());
    if (!current) throw new Error("Position not found: current");
    if (Date.parse(evidence.acquired_at) < Date.parse(String(current.as_of))) throw new Error("Evidence time must not precede current Position");
    const currentProfile = this.store.db.prepare("SELECT * FROM profile_snapshots WHERE id = ?").get(String(current.profile_snapshot_id)) as Record<string, unknown>;
    const identity = hash(`${evidence.id}\n${evidence.acquired_at}\n${evidence.preview}`);
    const claim: Claim = {
      id: `claim-web-${identity.slice(0, 16)}`,
      subject_ref: String(current.playground_id),
      claim_kind: "situation-observation",
      epistemic_status: "observation",
      proposition: evidence.preview,
      valid_time: { from: evidence.acquired_at, to: null },
      observed_at: evidence.acquired_at,
      recorded_at: evidence.acquired_at,
      evidence_refs: [evidence.id],
      author: "p4-web-user",
      revision: 1,
    };
    const claimRefs = [...new Set([...parse<string[]>(String(currentProfile.claim_refs_json)), claim.id])].sort();
    const profileSnapshot: ProfileSnapshot = {
      id: `profile-web-${identity.slice(0, 16)}`,
      profile_id: String(currentProfile.profile_id),
      as_of: evidence.acquired_at,
      evidence_cutoff: evidence.acquired_at,
      claim_refs: claimRefs,
      profile_version: String(currentProfile.profile_version),
      snapshot_identity: hash(JSON.stringify({ claimRefs, asOf: evidence.acquired_at, previous: String(current.profile_snapshot_id) })),
    };
    const positionId = `position-web-observed-${identity.slice(0, 16)}`;
    const positionInput: PositionInput = {
      id: positionId,
      mode: "actual",
      playgroundId: String(current.playground_id),
      asOf: evidence.acquired_at,
      evidenceCutoff: evidence.acquired_at,
      profileSnapshotId: profileSnapshot.id,
      ...(current.perspective_id === null ? {} : { perspectiveId: String(current.perspective_id) }),
      ...(current.question === null ? {} : { question: String(current.question) }),
    };
    const event: EventRecord = {
      id: `event-web-observed-${identity.slice(0, 16)}`,
      event_type: "observed-note",
      mode: "actual",
      occurred_time: evidence.acquired_at,
      observed_at: evidence.acquired_at,
      recorded_at: evidence.acquired_at,
      claim_refs: [claim.id],
      resulting_position_id: positionId,
    };
    return { claim, profileSnapshot, position: positionInput, event };
  }

  async analyze(positionId: string): Promise<string> {
    const position = this.position(positionId);
    if (!position) throw new Error(`Position not found: ${positionId}`);
    const existing = this.store.db.prepare("SELECT id FROM search_runs WHERE root_position_id = ? ORDER BY started_at LIMIT 1").get(positionId) as { id: string } | undefined;
    if (existing) return existing.id;
    const methodId = this.ensureFoundationMethod(positionId);
    const variation = this.store.db.prepare("SELECT id FROM variations WHERE position_id = ?").get(positionId) as { id: string } | undefined;
    const branchPath = variation ? this.possibilities.checkout(variation.id).lineage : [];
    const run = this.search.start({
      runKey: `p4-web-analysis:${positionId}`,
      positionId,
      branchPath,
      objectives,
      horizon: this.horizonFor(String(position.as_of)),
      riskPolicy: "balanced-synthetic-risk",
      evaluationProfile: "organizational-synthetic@1.0.0",
      methodRunIds: [methodId],
      unknowns: ["No private context is available."],
      contextManifest: { client: "p4-web", fixture: "public-synthetic" },
      budgets,
    });
    await this.search.execute(run.id);
    return run.id;
  }

  pin(variationId: string): void {
    this.possibilities.pin(variationId);
  }

  replay(variationId: string): string {
    return this.possibilities.replay(variationId).position.id;
  }

  async fork(variationId: string): Promise<string> {
    const run = this.search.fork({ variationId, runKey: `p4-fork-${hash(variationId).slice(0, 8)}`, budgets: { ...budgets, maxDepth: 3 } });
    await this.search.execute(run.id);
    return run.id;
  }

  async resume(searchRunId: string): Promise<void> {
    const run = this.search.getRun(searchRunId);
    if (!run) throw new Error(`search run not found: ${searchRunId}`);
    await this.search.resume(searchRunId, { ...run.budgets, maxDepth: (run.budgets.maxDepth ?? 2) + 1, maxMaterializedPositions: (run.budgets.maxMaterializedPositions ?? 10) + 6 });
  }

  applyRevision(proposalId: string): void {
    const current = this.position(this.currentPositionId());
    if (!current) throw new Error("Position not found: current");
    const proposal = this.store.db.prepare("SELECT * FROM profile_claim_revision_proposals WHERE id = ?").get(proposalId) as Record<string, unknown> | undefined;
    if (!proposal) throw new Error(`Profile revision not found: ${proposalId}`);
    const nextProfile = parse<ProfileSnapshot>(String(proposal.next_profile_snapshot_json));
    const currentProfile = this.store.db.prepare("SELECT * FROM profile_snapshots WHERE id = ?").get(String(current.profile_snapshot_id)) as Record<string, unknown>;
    const priorClaimRefs = new Set(parse<string[]>(String(proposal.prior_claim_refs_json)));
    const claimRefs = [...new Set([
      ...parse<string[]>(String(currentProfile.claim_refs_json)).filter((id) => !priorClaimRefs.has(id)),
      ...nextProfile.claim_refs,
    ])].sort();
    const asOf = Date.parse(String(current.as_of)) > Date.parse(nextProfile.as_of) ? String(current.as_of) : nextProfile.as_of;
    const evidenceCutoff = Date.parse(String(current.evidence_cutoff)) > Date.parse(nextProfile.evidence_cutoff) ? String(current.evidence_cutoff) : nextProfile.evidence_cutoff;
    const usesDeclaredSnapshot = asOf === nextProfile.as_of && evidenceCutoff === nextProfile.evidence_cutoff
      && JSON.stringify(claimRefs) === JSON.stringify([...nextProfile.claim_refs].sort());
    const mergedProfile: ProfileSnapshot = usesDeclaredSnapshot ? nextProfile : {
      id: `profile-web-revised-${hash(JSON.stringify({ proposalId, current: current.id, claimRefs, asOf, evidenceCutoff })).slice(0, 16)}`,
      profile_id: nextProfile.profile_id,
      as_of: asOf,
      evidence_cutoff: evidenceCutoff,
      claim_refs: claimRefs,
      profile_version: nextProfile.profile_version,
      snapshot_identity: hash(JSON.stringify({ proposalId, claimRefs, asOf, evidenceCutoff })),
    };
    const declared = this.fixture.positions.find((item) => item.id === "position-syn-005");
    const positionId = usesDeclaredSnapshot && declared ? declared.id : `position-web-revised-${hash(`${proposalId}\n${current.id}`).slice(0, 16)}`;
    const positionInput: PositionInput = {
      id: positionId,
      mode: "reconstructed",
      playgroundId: String(current.playground_id),
      asOf,
      evidenceCutoff,
      profileSnapshotId: mergedProfile.id,
      ...(current.perspective_id === null ? {} : { perspectiveId: String(current.perspective_id) }),
      ...(current.question === null ? {} : { question: String(current.question) }),
    };
    const proposedClaimId = String(proposal.proposed_claim_id);
    const event: EventRecord = {
      id: usesDeclaredSnapshot ? "event-syn-profile-review" : `event-web-revision-${hash(`${proposalId}\n${positionId}`).slice(0, 16)}`,
      event_type: "profile-review",
      mode: "reconstructed",
      occurred_time: asOf,
      recorded_at: evidenceCutoff,
      claim_refs: [proposedClaimId],
      resulting_position_id: positionId,
    };
    this.app.acceptProfileClaimRevision(proposalId, "p4-web-user", { profileSnapshot: mergedProfile, position: positionInput, event });
    this.ensureFoundationMethod(positionId);
  }

  private currentPositionId(): string {
    const row = this.store.db.prepare("SELECT id FROM positions WHERE mode IN ('actual', 'reconstructed') ORDER BY as_of DESC, evidence_cutoff DESC, created_at DESC, id DESC LIMIT 1").get() as { id: string } | undefined;
    if (!row) throw new Error("Position not found: current");
    return row.id;
  }

  private ensureFoundationMethod(positionId: string): string {
    const existing = this.store.db.prepare("SELECT id FROM method_runs WHERE position_id = ? AND method_id = 'sna.foundation' AND status = 'succeeded' ORDER BY started_at LIMIT 1").get(positionId) as { id: string } | undefined;
    return existing?.id ?? this.methods.run({ positionId, methodId: "sna.foundation" }).id;
  }

  private horizonFor(asOf: string): string {
    const minimum = Date.parse(asOf) + 90 * 60 * 1000;
    return new Date(Math.max(Date.parse(defaultHorizon), minimum)).toISOString();
  }

  private position(id: string): Record<string, unknown> | undefined {
    return this.store.db.prepare("SELECT * FROM positions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  }
}
