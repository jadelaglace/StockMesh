import type { SqliteStore } from "../persistence/database.js";
import type {
  AnalysisPortDescriptor,
  AnalysisResult,
  ContextSnapshot,
  ContextSnapshotInput,
  ObjectiveSpec,
  SearchBudget,
  SearchPolicyIdentity,
  VariationState,
} from "../analysis/types.js";
import { stableHash, stableJson } from "../methods/identity.js";
import type {
  BranchCheckout,
  EvaluationRecord,
  MaterializeCandidateInput,
  PositionView,
  StoredAnalysisRun,
  StoredCandidate,
  VariationRecord,
} from "./types.js";

interface PositionRow {
  id: string;
  mode: PositionView["mode"];
  playground_id: string;
  as_of: string;
  evidence_cutoff: string;
  profile_snapshot_id: string;
  perspective_id: string | null;
  question: string | null;
  projector_version: string;
  projection_identity: string;
  projection_json: string;
}

function now(): string {
  return new Date().toISOString();
}

function parse<T>(value: string): T {
  return JSON.parse(value) as T;
}

function requireUniqueObjectives(objectives: ObjectiveSpec[]): void {
  if (objectives.length === 0) throw new Error("at least one Party objective is required");
  if (new Set(objectives.map((item) => item.partyNodeId)).size !== objectives.length) throw new Error("Party objectives must be unique by Party");
  for (const objective of objectives) {
    if (!objective.partyNodeId || !objective.objective || !Number.isFinite(objective.weight) || objective.weight < 0) throw new Error("invalid Party objective");
  }
}

export class PossibilityStore {
  constructor(private readonly store: SqliteStore) {}

  createContext(input: ContextSnapshotInput): ContextSnapshot {
    requireUniqueObjectives(input.objectives);
    const position = this.positionRow(input.positionId);
    const perspectiveId = input.perspectiveId ?? position.perspective_id;
    if (!perspectiveId) throw new Error("context requires a perspective");
    if (!input.horizon || !input.riskPolicy || !input.evaluationProfile) throw new Error("context horizon, risk policy, and evaluation profile are required");
    if (!Number.isFinite(Date.parse(input.horizon)) || Date.parse(input.horizon) < Date.parse(position.as_of)) throw new Error("context horizon must be an instant at or after the Position");
    for (const objective of input.objectives) {
      if (!this.store.db.prepare("SELECT 1 FROM nodes WHERE id = ?").get(objective.partyNodeId)) throw new Error(`objective Party not found: ${objective.partyNodeId}`);
    }
    this.validateBranchPath(input.positionId, input.branchPath);
    const methodRunIds = [...(input.methodRunIds ?? [])].sort();
    const methodRuns = methodRunIds.map((id) => {
      const row = this.store.db.prepare(`
        SELECT r.id, r.position_id, r.method_id, r.method_version, r.input_identity,
          r.configuration_identity, x.output_identity, x.output_schema, x.output_json
        FROM method_runs r JOIN method_results x ON x.run_id = r.id
        WHERE r.id = ? AND r.status = 'succeeded'
      `).get(id) as {
        id: string; position_id: string; method_id: string; method_version: string;
        input_identity: string; configuration_identity: string; output_identity: string;
        output_schema: string; output_json: string;
      } | undefined;
      if (!row) throw new Error(`succeeded Method run not found: ${id}`);
      if (row.position_id !== input.positionId) throw new Error(`Method run ${id} belongs to another Position`);
      return { ...row, output: parse<unknown>(row.output_json) };
    });
    const manifest = {
      positionProjectionIdentity: position.projection_identity,
      positionProjection: parse(position.projection_json),
      evidenceCutoff: position.evidence_cutoff,
      profileSnapshotId: position.profile_snapshot_id,
      branchPath: input.branchPath,
      perspectiveId,
      objectives: input.objectives,
      horizon: input.horizon,
      riskPolicy: input.riskPolicy,
      evaluationProfile: input.evaluationProfile,
      unknowns: input.unknowns ?? [],
      projectorVersion: position.projector_version,
      methodRuns,
      caller: input.contextManifest ?? {},
    };
    const snapshotIdentity = stableHash(manifest);
    const id = `context-${snapshotIdentity}`;
    this.store.db.prepare(`
      INSERT OR IGNORE INTO context_snapshots (
        id, position_id, position_projection_identity, position_projection_json, evidence_cutoff, branch_path_json,
        profile_snapshot_id, perspective_id, objectives_json, horizon, risk_policy,
        evaluation_profile, method_run_ids_json, unknowns_json, context_manifest_json,
        projector_version, snapshot_identity, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.positionId, position.projection_identity, position.projection_json, position.evidence_cutoff,
      stableJson(input.branchPath), position.profile_snapshot_id, perspectiveId,
      stableJson(input.objectives), input.horizon, input.riskPolicy, input.evaluationProfile,
      stableJson(methodRunIds), stableJson(input.unknowns ?? []), stableJson(manifest),
      position.projector_version, snapshotIdentity, now(),
    );
    return this.requireContext(id);
  }

  getContext(id: string): ContextSnapshot | undefined {
    const row = this.store.db.prepare("SELECT * FROM context_snapshots WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id),
      positionId: String(row.position_id),
      positionProjectionIdentity: String(row.position_projection_identity),
      positionProjection: parse(String(row.position_projection_json)),
      evidenceCutoff: String(row.evidence_cutoff),
      branchPath: parse<string[]>(String(row.branch_path_json)),
      profileSnapshotId: String(row.profile_snapshot_id),
      perspectiveId: String(row.perspective_id),
      objectives: parse<ObjectiveSpec[]>(String(row.objectives_json)),
      horizon: String(row.horizon),
      riskPolicy: String(row.risk_policy),
      evaluationProfile: String(row.evaluation_profile),
      methodRunIds: parse<string[]>(String(row.method_run_ids_json)),
      unknowns: parse<string[]>(String(row.unknowns_json)),
      contextManifest: parse<Record<string, unknown>>(String(row.context_manifest_json)),
      projectorVersion: String(row.projector_version),
      snapshotIdentity: String(row.snapshot_identity),
    };
  }

  analysisCacheIdentity(
    context: ContextSnapshot,
    descriptor: AnalysisPortDescriptor,
    policy: SearchPolicyIdentity,
    budget: SearchBudget,
  ): string {
    return stableHash({
      contextSnapshotIdentity: context.snapshotIdentity,
      profileSnapshotId: context.profileSnapshotId,
      provider: descriptor.provider,
      model: descriptor.model,
      adapterVersion: descriptor.adapterVersion,
      configurationIdentity: descriptor.configurationIdentity,
      methodRunIds: context.methodRunIds,
      objectives: context.objectives,
      evaluationProfile: context.evaluationProfile,
      searchPolicy: policy,
      budget,
    });
  }

  getCachedAnalysis(cacheIdentity: string): StoredAnalysisRun | undefined {
    const row = this.store.db.prepare(`
      SELECT r.* FROM cache_records c JOIN analysis_runs r ON r.id = c.analysis_run_id
      WHERE c.cache_identity = ? AND c.state = 'active' AND r.status = 'succeeded'
    `).get(cacheIdentity) as Record<string, unknown> | undefined;
    return row ? this.analysisRow(row) : undefined;
  }

  beginAnalysis(context: ContextSnapshot, descriptor: AnalysisPortDescriptor, requestIdentity: string): string {
    const id = `analysis-${stableHash({ context: context.snapshotIdentity, descriptor, requestIdentity })}`;
    this.store.db.prepare(`
      INSERT INTO analysis_runs (
        id, context_snapshot_id, provider, model, adapter_version, configuration_identity,
        request_schema, request_identity, status, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'stockmesh.analysis-request@0.1.0', ?, 'running', ?)
      ON CONFLICT(id) DO UPDATE SET status = 'running', started_at = excluded.started_at,
        completed_at = NULL, usage_tokens = 0, usage_cost = 0, output_identity = NULL,
        output_json = NULL, error_json = NULL
    `).run(id, context.id, descriptor.provider, descriptor.model, descriptor.adapterVersion, descriptor.configurationIdentity, requestIdentity, now());
    return id;
  }

  succeedAnalysis(runId: string, result: AnalysisResult, cache: {
    identity: string;
    context: ContextSnapshot;
    policy: SearchPolicyIdentity;
  }): StoredAnalysisRun {
    const outputIdentity = stableHash(result);
    this.store.transaction(() => {
      this.store.db.prepare(`
        UPDATE analysis_runs SET status = 'succeeded', completed_at = ?, usage_tokens = ?,
          usage_cost = ?, output_identity = ?, output_json = ?, error_json = NULL WHERE id = ?
      `).run(now(), result.usage.tokens, result.usage.cost, outputIdentity, stableJson(result), runId);
      for (const candidate of result.proposal.candidates) {
        const candidateIdentity = stableHash({ analysisRunId: runId, candidate });
        const candidateId = `candidate-${candidateIdentity}`;
        this.store.db.prepare(`
          INSERT OR IGNORE INTO variation_candidates (
            id, analysis_run_id, candidate_key, candidate_identity, purpose, proposal_json, retained_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(candidateId, runId, candidate.key, candidateIdentity, candidate.purpose, stableJson(candidate), now());
        const retained = this.store.db.prepare("SELECT candidate_identity FROM variation_candidates WHERE analysis_run_id = ? AND candidate_key = ?")
          .get(runId, candidate.key) as { candidate_identity: string } | undefined;
        if (retained?.candidate_identity !== candidateIdentity) throw new Error(`candidate identity conflict: ${runId}/${candidate.key}`);
      }
      const cacheId = `cache-${cache.identity}`;
      this.store.db.prepare(`
        INSERT OR IGNORE INTO cache_records (
          id, cache_identity, context_snapshot_id, profile_snapshot_id, analysis_run_id,
          objective_refs_json, evaluation_profile, search_policy_id, search_policy_version,
          created_at, state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(
        cacheId, cache.identity, cache.context.id, cache.context.profileSnapshotId, runId,
        stableJson(cache.context.objectives), cache.context.evaluationProfile,
        cache.policy.id, cache.policy.version, now(),
      );
    });
    return this.requireAnalysis(runId);
  }

  failAnalysis(runId: string, error: unknown): void {
    const detail = { name: error instanceof Error ? error.name : "Error", message: error instanceof Error ? error.message : String(error) };
    this.store.db.prepare("UPDATE analysis_runs SET status = 'failed', completed_at = ?, error_json = ? WHERE id = ?")
      .run(now(), stableJson(detail), runId);
  }

  getCandidates(analysisRunId: string, onlyUnmaterialized = false): StoredCandidate[] {
    const rows = this.store.db.prepare(`
      SELECT * FROM variation_candidates WHERE analysis_run_id = ?
      ${onlyUnmaterialized ? "AND materialized_variation_id IS NULL" : ""}
      ORDER BY candidate_key
    `).all(analysisRunId) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      analysisRunId: String(row.analysis_run_id),
      candidateIdentity: String(row.candidate_identity),
      proposal: parse(String(row.proposal_json)),
      ...(row.materialized_variation_id === null ? {} : { materializedVariationId: String(row.materialized_variation_id) }),
    }));
  }

  materializeCandidate(input: MaterializeCandidateInput): BranchCheckout {
    const searchRun = this.store.db.prepare("SELECT root_context_snapshot_id FROM search_runs WHERE id = ?").get(input.searchRunId) as { root_context_snapshot_id: string } | undefined;
    if (!searchRun || searchRun.root_context_snapshot_id !== input.rootContextSnapshotId) throw new Error("candidate materialization does not belong to the declared search run");
    if (!this.store.db.prepare("SELECT 1 FROM search_frontier WHERE search_run_id = ? AND position_id = ?").get(input.searchRunId, input.parentPositionId)) {
      throw new Error("candidate parent is not on the declared search frontier");
    }
    const candidate = this.requireCandidate(input.candidateId);
    const analysis = this.requireAnalysis(candidate.analysisRunId);
    if (analysis.status !== "succeeded") throw new Error(`analysis run is not successful: ${analysis.id}`);
    const context = this.requireContext(analysis.contextSnapshotId);
    if (context.positionId !== input.parentPositionId) throw new Error("candidate parent Position does not match its frozen context");
    if (candidate.materializedVariationId) return this.checkout(candidate.materializedVariationId);
    this.validateEvaluation(candidate.proposal.evaluation, context);
    const variationDepth = input.parentVariationId === undefined
      ? 1
      : this.requireVariation(input.parentVariationId).depth + 1;
    if (input.depth < 1) throw new Error("search-relative Variation depth must be positive");
    const mode = candidate.proposal.purpose === "forecast" ? "predicted" : "hypothetical";
    this.validateProjection(candidate.proposal.resultingProjection);
    const parentPosition = this.positionRow(input.parentPositionId);
    const candidateHorizon = Date.parse(candidate.proposal.horizon);
    if (!Number.isFinite(candidateHorizon)) throw new Error("candidate horizon must be an ISO-compatible instant");
    if (candidateHorizon < Date.parse(parentPosition.as_of) || candidateHorizon > Date.parse(context.horizon)) {
      throw new Error("candidate horizon must be between the parent Position and frozen search horizon");
    }
    const projectionIdentity = stableHash({
      parentProjectionIdentity: context.positionProjectionIdentity,
      candidateIdentity: candidate.candidateIdentity,
      projection: candidate.proposal.resultingProjection,
      mode,
      evidenceCutoff: context.evidenceCutoff,
      profileSnapshotId: context.profileSnapshotId,
    });
    const positionId = `position-poss-${projectionIdentity}`;
    const variationId = `variation-${stableHash({ candidate: candidate.candidateIdentity, parentVariationId: input.parentVariationId ?? null, positionId })}`;
    const transitionIdentity = stableHash({
      candidateIdentity: candidate.candidateIdentity,
      fromPositionId: input.parentPositionId,
      toPositionId: positionId,
      mode,
      action: candidate.proposal.action,
      modeledResponse: candidate.proposal.modeledResponse,
      assumptions: candidate.proposal.assumptions,
      replanTrigger: candidate.proposal.replanTrigger,
    });
    const transitionId = `possibility-transition-${transitionIdentity}`;
    const trajectoryIdentity = stableHash({
      parentVariationId: input.parentVariationId ?? null,
      positions: [input.parentPositionId, positionId],
      transitions: [transitionId],
      mode,
      assumptions: candidate.proposal.assumptions,
    });
    const trajectoryId = `trajectory-${trajectoryIdentity}`;
    const evaluationIdentity = stableHash({
      targetPositionId: positionId,
      perspectiveId: context.perspectiveId,
      proposal: candidate.proposal.evaluation,
      horizon: candidate.proposal.horizon,
      evidenceCutoff: context.evidenceCutoff,
      analysisRunId: analysis.id,
      methodRunIds: context.methodRunIds,
    });
    const evaluationId = `evaluation-${evaluationIdentity}`;
    const parent = parentPosition;

    this.store.transaction(() => {
      this.store.db.prepare(`
        INSERT INTO positions (
          id, mode, playground_id, as_of, evidence_cutoff, profile_snapshot_id,
          perspective_id, question, projector_version, projection_identity,
          projection_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'possibility-v1', ?, ?, ?)
      `).run(
        positionId, mode, parent.playground_id, candidate.proposal.horizon,
        context.evidenceCutoff, context.profileSnapshotId, context.perspectiveId,
        parent.question, projectionIdentity, stableJson(candidate.proposal.resultingProjection), now(),
      );
      this.store.db.prepare(`
        INSERT INTO possibility_transitions (
          id, candidate_id, from_position_id, to_position_id, mode, action_json,
          modeled_response, assumptions_json, replan_trigger, analysis_run_id,
          transition_identity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transitionId, candidate.id, input.parentPositionId, positionId, mode,
        stableJson({ description: candidate.proposal.action }), candidate.proposal.modeledResponse,
        stableJson(candidate.proposal.assumptions), candidate.proposal.replanTrigger,
        analysis.id, transitionIdentity, now(),
      );
      this.store.db.prepare(`
        INSERT INTO trajectories (
          id, mode, position_ids_json, transition_ids_json, assumptions_json,
          trajectory_identity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        trajectoryId, mode, stableJson([input.parentPositionId, positionId]),
        stableJson([transitionId]), stableJson(candidate.proposal.assumptions),
        trajectoryIdentity, now(),
      );
      this.store.db.prepare(`
        INSERT INTO variations (
          id, candidate_id, parent_variation_id, anchor_position_id, position_id, trajectory_id,
          purpose, state, root_context_snapshot_id, root_profile_snapshot_id,
          horizon, assumptions_json, created_by_analysis_run_id, depth, mode, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'candidate', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        variationId, candidate.id, input.parentVariationId ?? null, input.parentPositionId,
        positionId, trajectoryId, candidate.proposal.purpose, input.rootContextSnapshotId,
        context.profileSnapshotId, candidate.proposal.horizon,
        stableJson(candidate.proposal.assumptions), analysis.id, variationDepth, mode, now(),
      );
      this.store.db.prepare(`
        INSERT INTO evaluations (
          id, target_position_id, perspective_id, party_scorecards_json, horizon,
          risk_policy, evidence_cutoff, evaluation_profile, uncertainty_json,
          analysis_run_id, method_run_ids_json, evaluation_identity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        evaluationId, positionId, context.perspectiveId,
        stableJson(candidate.proposal.evaluation.partyScorecards), candidate.proposal.horizon,
        context.riskPolicy, context.evidenceCutoff, context.evaluationProfile,
        stableJson(candidate.proposal.evaluation.uncertainty), analysis.id,
        stableJson(context.methodRunIds), evaluationIdentity, now(),
      );
      this.store.db.prepare("UPDATE variation_candidates SET materialized_variation_id = ? WHERE id = ?")
        .run(variationId, candidate.id);
    });
    return this.checkout(variationId);
  }

  pin(variationId: string): VariationRecord {
    const variation = this.requireVariation(variationId);
    if (variation.state === "archived" || variation.state === "invalidated") throw new Error(`cannot pin ${variation.state} Variation`);
    this.store.db.prepare("UPDATE variations SET state = 'pinned' WHERE id = ?").run(variationId);
    return this.requireVariation(variationId);
  }

  checkout(variationId: string): BranchCheckout {
    const variation = this.requireVariation(variationId);
    const rootContext = this.requireContext(variation.rootContextSnapshotId);
    return {
      variation,
      position: this.projectedPosition(variation.positionId),
      evaluation: this.requireEvaluation(variation.positionId),
      rootContext,
      lineage: this.lineage(variationId),
    };
  }

  replay(variationId: string): BranchCheckout {
    const checkout = this.checkout(variationId);
    const candidate = this.requireCandidate(checkout.variation.candidateId);
    const analysis = this.requireAnalysis(candidate.analysisRunId);
    const context = this.requireContext(analysis.contextSnapshotId);
    const expected = stableHash({
      parentProjectionIdentity: context.positionProjectionIdentity,
      candidateIdentity: candidate.candidateIdentity,
      projection: candidate.proposal.resultingProjection,
      mode: checkout.variation.mode,
      evidenceCutoff: context.evidenceCutoff,
      profileSnapshotId: context.profileSnapshotId,
    });
    if (expected !== checkout.position.projectionIdentity) throw new Error(`Variation replay mismatch: ${variationId}`);
    const expectedEvaluation = stableHash({
      targetPositionId: checkout.position.id,
      perspectiveId: context.perspectiveId,
      proposal: candidate.proposal.evaluation,
      horizon: candidate.proposal.horizon,
      evidenceCutoff: context.evidenceCutoff,
      analysisRunId: analysis.id,
      methodRunIds: context.methodRunIds,
    });
    if (expectedEvaluation !== checkout.evaluation.evaluationIdentity) throw new Error(`Evaluation replay mismatch: ${variationId}`);
    const transition = this.store.db.prepare("SELECT * FROM possibility_transitions WHERE candidate_id = ?").get(candidate.id) as Record<string, unknown> | undefined;
    if (!transition) throw new Error(`possibility Transition not found: ${variationId}`);
    const expectedTransition = stableHash({
      candidateIdentity: candidate.candidateIdentity,
      fromPositionId: checkout.variation.anchorPositionId,
      toPositionId: checkout.position.id,
      mode: checkout.variation.mode,
      action: candidate.proposal.action,
      modeledResponse: candidate.proposal.modeledResponse,
      assumptions: candidate.proposal.assumptions,
      replanTrigger: candidate.proposal.replanTrigger,
    });
    if (String(transition.transition_identity) !== expectedTransition) throw new Error(`Transition replay mismatch: ${variationId}`);
    const trajectory = this.store.db.prepare("SELECT * FROM trajectories WHERE id = ?").get(checkout.variation.trajectoryId) as Record<string, unknown> | undefined;
    if (!trajectory) throw new Error(`Trajectory not found: ${variationId}`);
    const expectedTrajectory = stableHash({
      parentVariationId: checkout.variation.parentVariationId ?? null,
      positions: [checkout.variation.anchorPositionId, checkout.position.id],
      transitions: [String(transition.id)],
      mode: checkout.variation.mode,
      assumptions: candidate.proposal.assumptions,
    });
    if (String(trajectory.trajectory_identity) !== expectedTrajectory) throw new Error(`Trajectory replay mismatch: ${variationId}`);
    return checkout;
  }

  getVariation(id: string): VariationRecord | undefined {
    const row = this.store.db.prepare("SELECT * FROM variations WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.variationRow(row) : undefined;
  }

  private validateBranchPath(positionId: string, branchPath: string[]): void {
    if (branchPath.length === 0) return;
    let previous: string | undefined;
    for (const variationId of branchPath) {
      const variation = this.requireVariation(variationId);
      if (variation.parentVariationId !== previous) throw new Error("branch path is not contiguous");
      previous = variationId;
    }
    if (this.requireVariation(branchPath.at(-1)!).positionId !== positionId) throw new Error("branch path does not end at the context Position");
  }

  private validateEvaluation(evaluation: StoredCandidate["proposal"]["evaluation"], context: ContextSnapshot): void {
    if (evaluation.riskPolicy !== context.riskPolicy || evaluation.evaluationProfile !== context.evaluationProfile) {
      throw new Error("Evaluation policy does not match the frozen context");
    }
    const expected = new Map(context.objectives.map((item) => [item.partyNodeId, item.objective]));
    if (evaluation.partyScorecards.length !== expected.size) throw new Error("Evaluation must cover every declared Party exactly once");
    for (const scorecard of evaluation.partyScorecards) {
      if (expected.get(scorecard.partyNodeId) !== scorecard.objective) throw new Error(`Evaluation objective mismatch for Party ${scorecard.partyNodeId}`);
      if (scorecard.methodRefs.some((id) => !context.methodRunIds.includes(id))) throw new Error(`Evaluation cites a Method outside the frozen context for Party ${scorecard.partyNodeId}`);
    }
  }

  private validateProjection(projection: StoredCandidate["proposal"]["resultingProjection"]): void {
    const groups: Array<[string, string[]]> = [
      ["nodes", projection.active_node_ids],
      ["relations", projection.relation_ids],
      ["flows", projection.flow_ids],
      ["states", projection.state_ids],
    ];
    for (const [table, ids] of groups) {
      for (const id of ids) {
        if (!this.store.db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id)) throw new Error(`resulting projection has dangling ${table} identity: ${id}`);
      }
    }
    const activeNodes = new Set(projection.active_node_ids);
    for (const relationId of projection.relation_ids) {
      const relation = this.store.db.prepare("SELECT subject_id, object_id FROM relations WHERE id = ?").get(relationId) as { subject_id: string; object_id: string };
      if (!activeNodes.has(relation.subject_id) || !activeNodes.has(relation.object_id)) throw new Error(`projected Relation endpoints are not active: ${relationId}`);
    }
    for (const stateId of projection.state_ids) {
      const state = this.store.db.prepare("SELECT subject_id FROM states WHERE id = ?").get(stateId) as { subject_id: string };
      if (!activeNodes.has(state.subject_id)) throw new Error(`projected State subject is not active: ${stateId}`);
    }
    for (const flowId of projection.flow_ids) {
      const flow = this.store.db.prepare("SELECT path_json FROM flows WHERE id = ?").get(flowId) as { path_json: string };
      if (parse<string[]>(flow.path_json).some((nodeId) => !activeNodes.has(nodeId))) throw new Error(`projected Flow path is not active: ${flowId}`);
    }
  }

  private positionRow(id: string): PositionRow {
    const row = this.store.db.prepare("SELECT * FROM positions WHERE id = ?").get(id) as PositionRow | undefined;
    if (!row) throw new Error(`Position not found: ${id}`);
    return row;
  }

  private projectedPosition(id: string): PositionView {
    const row = this.positionRow(id);
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
      projection: parse(row.projection_json),
    };
  }

  private requireContext(id: string): ContextSnapshot {
    const context = this.getContext(id);
    if (!context) throw new Error(`Context snapshot not found: ${id}`);
    return context;
  }

  private requireAnalysis(id: string): StoredAnalysisRun {
    const row = this.store.db.prepare("SELECT * FROM analysis_runs WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Analysis run not found: ${id}`);
    return this.analysisRow(row);
  }

  private analysisRow(row: Record<string, unknown>): StoredAnalysisRun {
    const result = row.output_json === null ? undefined : parse<AnalysisResult>(String(row.output_json));
    return {
      id: String(row.id),
      contextSnapshotId: String(row.context_snapshot_id),
      provider: String(row.provider),
      model: String(row.model),
      adapterVersion: String(row.adapter_version),
      configurationIdentity: String(row.configuration_identity),
      requestIdentity: String(row.request_identity),
      status: String(row.status) as StoredAnalysisRun["status"],
      ...(result === undefined ? {} : { result }),
    };
  }

  private requireCandidate(id: string): StoredCandidate {
    const row = this.store.db.prepare("SELECT * FROM variation_candidates WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Variation candidate not found: ${id}`);
    return {
      id: String(row.id), analysisRunId: String(row.analysis_run_id), candidateIdentity: String(row.candidate_identity),
      proposal: parse(String(row.proposal_json)),
      ...(row.materialized_variation_id === null ? {} : { materializedVariationId: String(row.materialized_variation_id) }),
    };
  }

  private requireVariation(id: string): VariationRecord {
    const variation = this.getVariation(id);
    if (!variation) throw new Error(`Variation not found: ${id}`);
    return variation;
  }

  private variationRow(row: Record<string, unknown>): VariationRecord {
    return {
      id: String(row.id), candidateId: String(row.candidate_id),
      ...(row.parent_variation_id === null ? {} : { parentVariationId: String(row.parent_variation_id) }),
      anchorPositionId: String(row.anchor_position_id), positionId: String(row.position_id),
      trajectoryId: String(row.trajectory_id),
      purpose: String(row.purpose) as VariationRecord["purpose"], state: String(row.state) as VariationState,
      rootContextSnapshotId: String(row.root_context_snapshot_id), rootProfileSnapshotId: String(row.root_profile_snapshot_id),
      horizon: String(row.horizon), assumptions: parse(String(row.assumptions_json)),
      createdByAnalysisRunId: String(row.created_by_analysis_run_id), depth: Number(row.depth),
      mode: String(row.mode) as VariationRecord["mode"],
    };
  }

  private requireEvaluation(positionId: string): EvaluationRecord {
    const row = this.store.db.prepare("SELECT * FROM evaluations WHERE target_position_id = ?").get(positionId) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Evaluation not found for Position: ${positionId}`);
    return {
      id: String(row.id), targetPositionId: String(row.target_position_id), perspectiveId: String(row.perspective_id),
      partyScorecards: parse(String(row.party_scorecards_json)), horizon: String(row.horizon), riskPolicy: String(row.risk_policy),
      evidenceCutoff: String(row.evidence_cutoff), evaluationProfile: String(row.evaluation_profile),
      uncertainty: parse(String(row.uncertainty_json)), analysisRunId: String(row.analysis_run_id),
      methodRunIds: parse(String(row.method_run_ids_json)), evaluationIdentity: String(row.evaluation_identity),
    };
  }

  private lineage(variationId: string): string[] {
    const reversed: string[] = [];
    let current: string | undefined = variationId;
    while (current) {
      reversed.push(current);
      current = this.requireVariation(current).parentVariationId;
    }
    return reversed.reverse();
  }
}
