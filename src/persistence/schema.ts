import type Database from "better-sqlite3";

export const SCHEMA_VERSION = 3;

const migrationV1Sql = `
CREATE TABLE IF NOT EXISTS staging_items (
  id TEXT PRIMARY KEY,
  content_identity TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('staged', 'accepted', 'rejected')),
  authority TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_decision TEXT,
  review_reason TEXT
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  content_identity TEXT NOT NULL UNIQUE,
  authority TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  integrity TEXT NOT NULL,
  sensitivity TEXT NOT NULL,
  locator TEXT,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS playgrounds (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  time_basis_json TEXT NOT NULL,
  evidence_policy TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  identity_scope TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  relation_type TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES nodes(id),
  object_id TEXT NOT NULL REFERENCES nodes(id),
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  claim_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  flow_type TEXT NOT NULL,
  path_json TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  claim_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  subject_ref TEXT NOT NULL,
  claim_kind TEXT NOT NULL,
  epistemic_status TEXT NOT NULL,
  proposition TEXT,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  observed_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  author TEXT NOT NULL,
  revision INTEGER NOT NULL,
  revision_of TEXT,
  competes_with_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_decisions (
  id TEXT PRIMARY KEY,
  target_ref TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'reject', 'leave-unresolved')),
  reviewer TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  rationale TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_snapshots (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  as_of TEXT NOT NULL,
  evidence_cutoff TEXT NOT NULL,
  claim_refs_json TEXT NOT NULL,
  profile_version TEXT NOT NULL,
  snapshot_identity TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES nodes(id),
  state_type TEXT NOT NULL,
  value_json TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  claim_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('actual', 'reconstructed', 'hypothetical', 'predicted', 'human-proposed')),
  occurred_time TEXT NOT NULL,
  observed_at TEXT,
  recorded_at TEXT,
  claim_refs_json TEXT NOT NULL,
  resulting_position_id TEXT
);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  actor_node_id TEXT NOT NULL REFERENCES nodes(id),
  mode TEXT NOT NULL,
  target_position_id TEXT NOT NULL,
  constraints_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transitions (
  id TEXT PRIMARY KEY,
  from_position_id TEXT NOT NULL,
  to_position_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  cause_refs_json TEXT NOT NULL,
  effect_summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS utterances (
  id TEXT PRIMARY KEY,
  speaker_node_id TEXT NOT NULL REFERENCES nodes(id),
  audience_node_ids_json TEXT NOT NULL,
  occurred_time TEXT NOT NULL,
  text TEXT NOT NULL,
  evidence_ref TEXT NOT NULL REFERENCES evidence_items(id),
  claim_ref TEXT NOT NULL REFERENCES claims(id)
);

CREATE TABLE IF NOT EXISTS strategy_steps (
  id TEXT PRIMARY KEY,
  before_position_id TEXT NOT NULL,
  input_refs_json TEXT NOT NULL,
  event_refs_json TEXT NOT NULL,
  action_refs_json TEXT NOT NULL,
  transition_id TEXT NOT NULL REFERENCES transitions(id),
  after_position_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  branch_membership TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_claim_revision_proposals (
  id TEXT PRIMARY KEY,
  subject_node_id TEXT NOT NULL REFERENCES nodes(id),
  prior_claim_refs_json TEXT NOT NULL,
  proposed_claim_id TEXT NOT NULL,
  proposed_claim_json TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  review_status TEXT NOT NULL,
  review_decision_ref TEXT NOT NULL REFERENCES review_decisions(id),
  next_profile_snapshot_json TEXT,
  next_states_json TEXT
);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('actual', 'reconstructed', 'hypothetical', 'predicted', 'human-proposed')),
  playground_id TEXT NOT NULL REFERENCES playgrounds(id),
  as_of TEXT NOT NULL,
  evidence_cutoff TEXT NOT NULL,
  profile_snapshot_id TEXT NOT NULL REFERENCES profile_snapshots(id),
  perspective_id TEXT,
  question TEXT,
  projector_version TEXT NOT NULL,
  projection_identity TEXT NOT NULL,
  projection_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (projection_identity)
);

CREATE TABLE IF NOT EXISTS change_journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  writer TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  UNIQUE (operation_id, entity_type, entity_id, operation)
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;

const migrationV2Sql = `
CREATE TABLE IF NOT EXISTS method_definitions (
  method_id TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  executor TEXT NOT NULL,
  implementation_identity TEXT NOT NULL,
  output_schema TEXT NOT NULL,
  caveats_json TEXT NOT NULL,
  definition_identity TEXT NOT NULL UNIQUE,
  registered_at TEXT NOT NULL,
  PRIMARY KEY (method_id, version)
);

CREATE TABLE IF NOT EXISTS method_runs (
  id TEXT PRIMARY KEY,
  method_id TEXT NOT NULL,
  method_version TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES positions(id),
  position_projection_identity TEXT NOT NULL,
  input_identity TEXT NOT NULL,
  configuration_identity TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  executor TEXT NOT NULL,
  implementation_identity TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_json TEXT,
  FOREIGN KEY (method_id, method_version) REFERENCES method_definitions(method_id, version)
);

CREATE TABLE IF NOT EXISTS method_results (
  run_id TEXT PRIMARY KEY REFERENCES method_runs(id) ON DELETE CASCADE,
  output_identity TEXT NOT NULL UNIQUE,
  output_schema TEXT NOT NULL,
  output_json TEXT NOT NULL,
  caveats_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

const migrationV3Sql = `
CREATE TABLE IF NOT EXISTS context_snapshots (
  id TEXT PRIMARY KEY,
  position_id TEXT NOT NULL REFERENCES positions(id),
  position_projection_identity TEXT NOT NULL,
  position_projection_json TEXT NOT NULL,
  evidence_cutoff TEXT NOT NULL,
  branch_path_json TEXT NOT NULL,
  profile_snapshot_id TEXT NOT NULL REFERENCES profile_snapshots(id),
  perspective_id TEXT NOT NULL,
  objectives_json TEXT NOT NULL,
  horizon TEXT NOT NULL,
  risk_policy TEXT NOT NULL,
  evaluation_profile TEXT NOT NULL,
  method_run_ids_json TEXT NOT NULL,
  unknowns_json TEXT NOT NULL,
  context_manifest_json TEXT NOT NULL,
  projector_version TEXT NOT NULL,
  snapshot_identity TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  context_snapshot_id TEXT NOT NULL REFERENCES context_snapshots(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  configuration_identity TEXT NOT NULL,
  request_schema TEXT NOT NULL,
  request_identity TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  usage_tokens INTEGER NOT NULL DEFAULT 0,
  usage_cost REAL NOT NULL DEFAULT 0,
  output_identity TEXT,
  output_json TEXT,
  error_json TEXT
);

CREATE TABLE IF NOT EXISTS variation_candidates (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL REFERENCES analysis_runs(id),
  candidate_key TEXT NOT NULL,
  candidate_identity TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('forecast', 'counterfactual', 'exploratory')),
  proposal_json TEXT NOT NULL,
  materialized_variation_id TEXT,
  retained_at TEXT NOT NULL,
  UNIQUE (analysis_run_id, candidate_key)
);

CREATE TABLE IF NOT EXISTS possibility_transitions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL UNIQUE REFERENCES variation_candidates(id),
  from_position_id TEXT NOT NULL REFERENCES positions(id),
  to_position_id TEXT NOT NULL REFERENCES positions(id),
  mode TEXT NOT NULL CHECK (mode IN ('hypothetical', 'predicted')),
  action_json TEXT NOT NULL,
  modeled_response TEXT NOT NULL,
  assumptions_json TEXT NOT NULL,
  replan_trigger TEXT NOT NULL,
  analysis_run_id TEXT NOT NULL REFERENCES analysis_runs(id),
  transition_identity TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trajectories (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('hypothetical', 'predicted')),
  position_ids_json TEXT NOT NULL,
  transition_ids_json TEXT NOT NULL,
  assumptions_json TEXT NOT NULL,
  trajectory_identity TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variations (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL UNIQUE REFERENCES variation_candidates(id),
  parent_variation_id TEXT REFERENCES variations(id),
  anchor_position_id TEXT NOT NULL REFERENCES positions(id),
  position_id TEXT NOT NULL UNIQUE REFERENCES positions(id),
  trajectory_id TEXT NOT NULL REFERENCES trajectories(id),
  purpose TEXT NOT NULL CHECK (purpose IN ('forecast', 'counterfactual', 'exploratory')),
  state TEXT NOT NULL CHECK (state IN ('candidate', 'pinned', 'selected', 'archived', 'invalidated')),
  root_context_snapshot_id TEXT NOT NULL REFERENCES context_snapshots(id),
  root_profile_snapshot_id TEXT NOT NULL REFERENCES profile_snapshots(id),
  horizon TEXT NOT NULL,
  assumptions_json TEXT NOT NULL,
  created_by_analysis_run_id TEXT NOT NULL REFERENCES analysis_runs(id),
  depth INTEGER NOT NULL CHECK (depth > 0),
  mode TEXT NOT NULL CHECK (mode IN ('hypothetical', 'predicted')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  target_position_id TEXT NOT NULL UNIQUE REFERENCES positions(id),
  perspective_id TEXT NOT NULL,
  party_scorecards_json TEXT NOT NULL,
  horizon TEXT NOT NULL,
  risk_policy TEXT NOT NULL,
  evidence_cutoff TEXT NOT NULL,
  evaluation_profile TEXT NOT NULL,
  uncertainty_json TEXT NOT NULL,
  analysis_run_id TEXT NOT NULL REFERENCES analysis_runs(id),
  method_run_ids_json TEXT NOT NULL,
  evaluation_identity TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_runs (
  id TEXT PRIMARY KEY,
  root_position_id TEXT NOT NULL REFERENCES positions(id),
  root_context_snapshot_id TEXT NOT NULL REFERENCES context_snapshots(id),
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  budgets_json TEXT NOT NULL,
  usage_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'paused-budget', 'paused-user', 'completed', 'cancelled', 'failed')),
  stop_reason TEXT,
  selection_rationale_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_frontier (
  search_run_id TEXT NOT NULL REFERENCES search_runs(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL REFERENCES positions(id),
  variation_id TEXT REFERENCES variations(id),
  depth INTEGER NOT NULL CHECK (depth >= 0),
  branch_path_json TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued', 'partial', 'expanded', 'depth-limited', 'pruned')),
  priority REAL NOT NULL,
  rationale TEXT NOT NULL,
  context_snapshot_id TEXT REFERENCES context_snapshots(id),
  analysis_run_id TEXT REFERENCES analysis_runs(id),
  PRIMARY KEY (search_run_id, position_id)
);

CREATE TABLE IF NOT EXISTS cache_records (
  id TEXT PRIMARY KEY,
  cache_identity TEXT NOT NULL UNIQUE,
  context_snapshot_id TEXT NOT NULL REFERENCES context_snapshots(id),
  profile_snapshot_id TEXT NOT NULL REFERENCES profile_snapshots(id),
  analysis_run_id TEXT NOT NULL REFERENCES analysis_runs(id),
  objective_refs_json TEXT NOT NULL,
  evaluation_profile TEXT NOT NULL,
  search_policy_id TEXT NOT NULL,
  search_policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'superseded', 'invalidated'))
);

CREATE TABLE IF NOT EXISTS observation_coverages (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  interval_from TEXT NOT NULL,
  interval_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('adequate', 'inadequate', 'unknown')),
  evidence_refs_json TEXT NOT NULL,
  limitations_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  coverage_identity TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS forecast_assessments (
  id TEXT PRIMARY KEY,
  forecast_variation_id TEXT NOT NULL REFERENCES variations(id),
  forecast_transition_refs_json TEXT NOT NULL,
  actual_event_refs_json TEXT NOT NULL,
  actual_transition_refs_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'matched', 'partially-matched', 'diverged', 'expired-unobserved', 'unknown')),
  horizon TEXT NOT NULL,
  rubric_id TEXT NOT NULL,
  observation_coverage_id TEXT REFERENCES observation_coverages(id),
  assessor TEXT NOT NULL,
  assessed_at TEXT NOT NULL,
  rationale TEXT NOT NULL,
  assessment_identity TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_variations_parent ON variations(parent_variation_id);
CREATE INDEX IF NOT EXISTS idx_frontier_state ON search_frontier(search_run_id, state, priority DESC);
CREATE INDEX IF NOT EXISTS idx_forecast_assessments_variation ON forecast_assessments(forecast_variation_id);
`;

const migrations = new Map<number, string>([
  [1, migrationV1Sql],
  [2, migrationV2Sql],
  [3, migrationV3Sql],
]);

export function migrateDatabase(db: Database.Database): void {
  // The migration ledger must exist before its version can be queried on a new database.
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
  const current = db
    .prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations")
    .get() as { version: number };
  for (let version = current.version + 1; version <= SCHEMA_VERSION; version += 1) {
    const sql = migrations.get(version);
    if (!sql) throw new Error(`missing migration: ${version}`);
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        version,
        new Date().toISOString(),
      );
    })();
  }
}
