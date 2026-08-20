import type { SqliteStore } from "../persistence/database.js";
import type { AnalysisPort, AnalysisResult, ContextSnapshot, SearchBudget, SearchPolicyIdentity } from "../analysis/types.js";
import { validateAnalysisResult, validateSearchBudget } from "../analysis/validation.js";
import { stableHash, stableJson } from "../methods/identity.js";
import { PossibilityStore } from "../possibilities/store.js";
import type { ForkSearchInput, SearchRunRecord, StartSearchInput } from "./types.js";

interface FrontierRow {
  search_run_id: string;
  position_id: string;
  variation_id: string | null;
  depth: number;
  branch_path_json: string;
  state: "queued" | "partial" | "expanded" | "depth-limited" | "pruned";
  priority: number;
  rationale: string;
  context_snapshot_id: string | null;
  analysis_run_id: string | null;
}

const DEFAULT_POLICY: SearchPolicyIdentity = { id: "stockmesh.priority-frontier", version: "1.0.0" };

function now(): string {
  return new Date().toISOString();
}

function parse<T>(value: string): T {
  return JSON.parse(value) as T;
}

export class SearchCoordinator {
  constructor(
    private readonly store: SqliteStore,
    private readonly possibilities: PossibilityStore,
    private readonly analysis: AnalysisPort,
  ) {}

  start(input: StartSearchInput): SearchRunRecord {
    const budgets = validateSearchBudget(input.budgets);
    const policy = input.policy ?? DEFAULT_POLICY;
    const context = this.possibilities.createContext(input);
    const id = `search-${stableHash({ runKey: input.runKey, rootContext: context.snapshotIdentity, policy })}`;
    const existing = this.getRun(id);
    if (existing) {
      if (stableJson(existing.budgets) !== stableJson(budgets)) throw new Error(`search run identity conflict: ${id}`);
      return existing;
    }
    const usage = { materializedPositions: 0, analysisCalls: 0, elapsedMs: 0, tokens: 0, cost: 0 };
    this.store.transaction(() => {
      this.store.db.prepare(`
        INSERT INTO search_runs (
          id, root_position_id, root_context_snapshot_id, policy_id, policy_version,
          budgets_json, usage_json, status, selection_rationale_json, started_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paused-user', '[]', ?, ?)
      `).run(id, input.positionId, context.id, policy.id, policy.version, stableJson(budgets), stableJson(usage), now(), now());
      this.store.db.prepare(`
        INSERT INTO search_frontier (
          search_run_id, position_id, variation_id, depth, branch_path_json,
          state, priority, rationale, context_snapshot_id
        ) VALUES (?, ?, ?, 0, ?, 'queued', 1, 'root Position', ?)
      `).run(id, input.positionId, input.branchPath.at(-1) ?? null, stableJson(input.branchPath), context.id);
    });
    return this.requireRun(id);
  }

  async execute(runId: string): Promise<SearchRunRecord> {
    let run = this.requireRun(runId);
    if (run.status === "completed" || run.status === "cancelled") return run;
    if (run.status === "running") throw new Error(`search run is already executing: ${runId}`);
    this.setStatus(runId, "running");
    const started = Date.now();
    const baseElapsed = run.usage.elapsedMs;
    try {
      while (true) {
        run = this.withElapsed(this.requireRun(runId), started, baseElapsed);
        if (run.status === "paused-user" || run.status === "cancelled") return run;
        const resourceStop = this.resourceStop(run);
        if (resourceStop) return this.pauseForBudget(runId, run, resourceStop);

        const frontier = this.nextFrontier(runId, run.budgets.maxDepth);
        if (!frontier) {
          const depthLimited = this.store.db.prepare(`
            SELECT 1 FROM search_frontier WHERE search_run_id = ? AND state = 'depth-limited' LIMIT 1
          `).get(runId);
          if (depthLimited) return this.pauseForBudget(runId, run, "maxDepth");
          this.setStatus(runId, "completed", "frontier exhausted");
          return this.requireRun(runId);
        }

        if (run.budgets.maxDepth !== undefined && frontier.depth >= run.budgets.maxDepth) {
          this.store.db.prepare("UPDATE search_frontier SET state = 'depth-limited', rationale = ? WHERE search_run_id = ? AND position_id = ?")
            .run(`depth ${frontier.depth} reached maxDepth ${run.budgets.maxDepth}`, runId, frontier.position_id);
          continue;
        }

        let analysisRunId = frontier.analysis_run_id;
        if (!analysisRunId) {
          const callStop = this.analysisCallStop(run);
          if (callStop) return this.pauseForBudget(runId, run, callStop);
          const root = this.possibilities.getContext(run.rootContextSnapshotId);
          if (!root) throw new Error(`root context not found: ${run.rootContextSnapshotId}`);
          const branchPath = parse<string[]>(frontier.branch_path_json);
          const context = frontier.context_snapshot_id
            ? this.requireContext(frontier.context_snapshot_id)
            : this.possibilities.createContext({
              positionId: frontier.position_id,
              branchPath,
              perspectiveId: root.perspectiveId,
              objectives: root.objectives,
              horizon: root.horizon,
              riskPolicy: root.riskPolicy,
              evaluationProfile: root.evaluationProfile,
              methodRunIds: frontier.depth === 0 ? root.methodRunIds : [],
              unknowns: root.unknowns,
              contextManifest: { searchRunId: run.id, depth: frontier.depth },
            });
          const cacheIdentity = this.possibilities.analysisCacheIdentity(context, this.analysis.descriptor, run.policy, run.budgets);
          const cached = this.possibilities.getCachedAnalysis(cacheIdentity);
          if (cached) {
            analysisRunId = cached.id;
          } else {
            const remainingBudget = this.remainingBudget(run, frontier.depth);
            const request = { context, remainingBudget };
            const requestIdentity = stableHash(request);
            analysisRunId = this.possibilities.beginAnalysis(context, this.analysis.descriptor, requestIdentity);
            try {
              const result = validateAnalysisResult(await this.analysis.analyze(request));
              this.validateResultAgainstContext(result, context);
              this.possibilities.succeedAnalysis(analysisRunId, result, { identity: cacheIdentity, context, policy: run.policy });
              run.usage.analysisCalls += 1;
              run.usage.tokens += result.usage.tokens;
              run.usage.cost += result.usage.cost;
              this.persistUsage(runId, run.usage);
            } catch (error) {
              this.possibilities.failAnalysis(analysisRunId, error);
              throw error;
            }
          }
          this.store.db.prepare(`
            UPDATE search_frontier SET context_snapshot_id = ?, analysis_run_id = ?, state = 'partial'
            WHERE search_run_id = ? AND position_id = ?
          `).run(context.id, analysisRunId, runId, frontier.position_id);
        }

        const candidates = this.possibilities.getCandidates(analysisRunId)
          .filter((candidate) => !this.candidateAttachedToRun(runId, candidate.materializedVariationId))
          .sort((left, right) => right.proposal.priority - left.proposal.priority || left.id.localeCompare(right.id));
        if (candidates.length === 0) {
          this.store.db.prepare("UPDATE search_frontier SET state = 'expanded' WHERE search_run_id = ? AND position_id = ?")
            .run(runId, frontier.position_id);
          continue;
        }

        for (const candidate of candidates) {
          run = this.withElapsed(this.requireRun(runId), started, baseElapsed);
          if (run.status === "paused-user" || run.status === "cancelled") {
            this.persistUsage(runId, run.usage, run.selectionRationale);
            return this.requireRun(runId);
          }
          const materializationStop = this.materializationStop(run);
          if (materializationStop) return this.pauseForBudget(runId, run, materializationStop);
          const branchPath = parse<string[]>(frontier.branch_path_json);
          const checkout = this.possibilities.materializeCandidate({
            candidateId: candidate.id,
            searchRunId: runId,
            parentPositionId: frontier.position_id,
            ...(frontier.variation_id === null ? {} : { parentVariationId: frontier.variation_id }),
            rootContextSnapshotId: run.rootContextSnapshotId,
            depth: frontier.depth + 1,
          });
          const childPath = [...branchPath, checkout.variation.id];
          this.store.db.prepare(`
            INSERT OR IGNORE INTO search_frontier (
              search_run_id, position_id, variation_id, depth, branch_path_json,
              state, priority, rationale
            ) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)
          `).run(
            runId, checkout.position.id, checkout.variation.id, frontier.depth + 1,
            stableJson(childPath), candidate.proposal.priority,
            `candidate ${candidate.proposal.key}; priority ${candidate.proposal.priority}`,
          );
          run.usage.materializedPositions += 1;
          run.selectionRationale.push(`${checkout.variation.id}: ${candidate.proposal.title}`);
          this.persistUsage(runId, run.usage, run.selectionRationale);
        }
        this.store.db.prepare("UPDATE search_frontier SET state = 'expanded' WHERE search_run_id = ? AND position_id = ?")
          .run(runId, frontier.position_id);
      }
    } catch (error) {
      const elapsedRun = this.withElapsed(this.requireRun(runId), started, baseElapsed);
      this.persistUsage(runId, elapsedRun.usage);
      this.setStatus(runId, "failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async resume(runId: string, budgets?: SearchBudget): Promise<SearchRunRecord> {
    const run = this.requireRun(runId);
    if (run.status !== "paused-budget" && run.status !== "paused-user" && run.status !== "failed") throw new Error(`search run cannot resume from ${run.status}`);
    if (budgets) {
      const validated = validateSearchBudget(budgets);
      this.store.db.prepare("UPDATE search_runs SET budgets_json = ?, updated_at = ? WHERE id = ?")
        .run(stableJson(validated), now(), runId);
      this.store.db.prepare("UPDATE search_frontier SET state = 'queued' WHERE search_run_id = ? AND state = 'depth-limited'")
        .run(runId);
    }
    return this.execute(runId);
  }

  pause(runId: string): SearchRunRecord {
    const run = this.requireRun(runId);
    if (run.status !== "running" && run.status !== "paused-budget") throw new Error(`search run cannot pause from ${run.status}`);
    this.setStatus(runId, "paused-user", "paused by caller");
    return this.requireRun(runId);
  }

  cancel(runId: string): SearchRunRecord {
    const run = this.requireRun(runId);
    if (run.status === "completed") throw new Error("completed search run cannot be cancelled");
    this.setStatus(runId, "cancelled", "cancelled by caller");
    return this.requireRun(runId);
  }

  fork(input: ForkSearchInput): SearchRunRecord {
    const checkout = this.possibilities.checkout(input.variationId);
    return this.start({
      runKey: input.runKey,
      positionId: checkout.position.id,
      branchPath: checkout.lineage,
      perspectiveId: checkout.rootContext.perspectiveId,
      objectives: checkout.rootContext.objectives,
      horizon: input.horizon ?? checkout.rootContext.horizon,
      riskPolicy: checkout.rootContext.riskPolicy,
      evaluationProfile: checkout.rootContext.evaluationProfile,
      methodRunIds: [],
      unknowns: checkout.rootContext.unknowns,
      contextManifest: { forkedFromVariationId: input.variationId },
      budgets: input.budgets,
      ...(input.policy === undefined ? {} : { policy: input.policy }),
    });
  }

  getRun(id: string): SearchRunRecord | undefined {
    const row = this.store.db.prepare("SELECT * FROM search_runs WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id), rootPositionId: String(row.root_position_id), rootContextSnapshotId: String(row.root_context_snapshot_id),
      policy: { id: String(row.policy_id), version: String(row.policy_version) },
      budgets: parse(String(row.budgets_json)), usage: parse(String(row.usage_json)),
      status: String(row.status) as SearchRunRecord["status"],
      ...(row.stop_reason === null ? {} : { stopReason: String(row.stop_reason) }),
      selectionRationale: parse(String(row.selection_rationale_json)),
    };
  }

  private validateResultAgainstContext(result: AnalysisResult, context: ContextSnapshot): void {
    const objectives = new Map(context.objectives.map((item) => [item.partyNodeId, item.objective]));
    for (const candidate of result.proposal.candidates) {
      if (candidate.evaluation.riskPolicy !== context.riskPolicy || candidate.evaluation.evaluationProfile !== context.evaluationProfile) {
        throw new Error(`candidate ${candidate.key} changed the frozen Evaluation policy`);
      }
      if (candidate.evaluation.partyScorecards.length !== objectives.size) throw new Error(`candidate ${candidate.key} does not evaluate every Party`);
      for (const scorecard of candidate.evaluation.partyScorecards) {
        if (objectives.get(scorecard.partyNodeId) !== scorecard.objective) throw new Error(`candidate ${candidate.key} has a Party objective mismatch`);
        if (scorecard.methodRefs.some((id) => !context.methodRunIds.includes(id))) throw new Error(`candidate ${candidate.key} cites an unavailable Method run`);
      }
    }
  }

  private candidateAttachedToRun(runId: string, variationId: string | undefined): boolean {
    if (!variationId) return false;
    return Boolean(this.store.db.prepare(`
      SELECT 1 FROM search_frontier f JOIN variations v ON v.position_id = f.position_id
      WHERE f.search_run_id = ? AND v.id = ?
    `).get(runId, variationId));
  }

  private nextFrontier(runId: string, maxDepth: number | undefined): FrontierRow | undefined {
    const rows = this.store.db.prepare(`
      SELECT * FROM search_frontier
      WHERE search_run_id = ? AND state IN ('partial', 'queued', 'depth-limited')
      ORDER BY CASE state WHEN 'partial' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END,
        priority DESC, depth ASC, position_id ASC
    `).all(runId) as FrontierRow[];
    return rows.find((row) => maxDepth === undefined || row.depth < maxDepth || row.state !== "depth-limited");
  }

  private remainingBudget(run: SearchRunRecord, currentDepth: number): SearchBudget {
    const result: SearchBudget = {};
    if (run.budgets.maxDepth !== undefined) result.maxDepth = Math.max(0, run.budgets.maxDepth - currentDepth);
    if (run.budgets.maxMaterializedPositions !== undefined) result.maxMaterializedPositions = Math.max(0, run.budgets.maxMaterializedPositions - run.usage.materializedPositions);
    if (run.budgets.maxAnalysisCalls !== undefined) result.maxAnalysisCalls = Math.max(0, run.budgets.maxAnalysisCalls - run.usage.analysisCalls);
    if (run.budgets.maxElapsedMs !== undefined) result.maxElapsedMs = Math.max(0, run.budgets.maxElapsedMs - run.usage.elapsedMs);
    if (run.budgets.maxTokens !== undefined) result.maxTokens = Math.max(0, run.budgets.maxTokens - run.usage.tokens);
    if (run.budgets.maxCost !== undefined) result.maxCost = Math.max(0, run.budgets.maxCost - run.usage.cost);
    return result;
  }

  private resourceStop(run: SearchRunRecord): string | undefined {
    if (run.budgets.maxMaterializedPositions !== undefined && run.usage.materializedPositions >= run.budgets.maxMaterializedPositions) return "maxMaterializedPositions";
    if (run.budgets.maxElapsedMs !== undefined && run.usage.elapsedMs >= run.budgets.maxElapsedMs) return "maxElapsedMs";
    if (run.budgets.maxTokens !== undefined && run.usage.tokens >= run.budgets.maxTokens) return "maxTokens";
    if (run.budgets.maxCost !== undefined && run.usage.cost >= run.budgets.maxCost) return "maxCost";
    return undefined;
  }

  private analysisCallStop(run: SearchRunRecord): string | undefined {
    if (run.budgets.maxAnalysisCalls !== undefined && run.usage.analysisCalls >= run.budgets.maxAnalysisCalls) return "maxAnalysisCalls";
    return this.resourceStop(run);
  }

  private materializationStop(run: SearchRunRecord): string | undefined {
    if (run.budgets.maxMaterializedPositions !== undefined && run.usage.materializedPositions >= run.budgets.maxMaterializedPositions) return "maxMaterializedPositions";
    return undefined;
  }

  private withElapsed(run: SearchRunRecord, started: number, baseElapsed: number): SearchRunRecord {
    return { ...run, usage: { ...run.usage, elapsedMs: baseElapsed + Math.max(0, Date.now() - started) } };
  }

  private pauseForBudget(runId: string, run: SearchRunRecord, reason: string): SearchRunRecord {
    this.persistUsage(runId, run.usage, run.selectionRationale);
    this.setStatus(runId, "paused-budget", reason);
    return this.requireRun(runId);
  }

  private persistUsage(runId: string, usage: SearchRunRecord["usage"], rationale?: string[]): void {
    this.store.db.prepare(`
      UPDATE search_runs SET usage_json = ?, selection_rationale_json = COALESCE(?, selection_rationale_json), updated_at = ? WHERE id = ?
    `).run(stableJson(usage), rationale === undefined ? null : stableJson(rationale), now(), runId);
  }

  private setStatus(runId: string, status: SearchRunRecord["status"], reason?: string): void {
    this.store.db.prepare("UPDATE search_runs SET status = ?, stop_reason = ?, updated_at = ? WHERE id = ?")
      .run(status, reason ?? null, now(), runId);
  }

  private requireRun(id: string): SearchRunRecord {
    const run = this.getRun(id);
    if (!run) throw new Error(`search run not found: ${id}`);
    return run;
  }

  private requireContext(id: string): ContextSnapshot {
    const context = this.possibilities.getContext(id);
    if (!context) throw new Error(`context snapshot not found: ${id}`);
    return context;
  }
}
