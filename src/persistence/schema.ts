import type Database from "better-sqlite3";

export const SCHEMA_VERSION = 2;

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

const migrations = new Map<number, string>([
  [1, migrationV1Sql],
  [2, migrationV2Sql],
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
