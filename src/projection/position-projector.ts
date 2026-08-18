import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { PositionInput, PositionProjection, ProjectedPosition } from "../domain/types.js";

interface NodeRow { id: string }
interface RelationRow { id: string; valid_from: string; valid_to: string | null; claim_refs_json: string }
interface FlowRow { id: string; valid_from: string; valid_to: string | null; path_json: string; claim_refs_json: string }
interface StateRow { id: string; subject_id: string; state_type: string; valid_from: string; valid_to: string | null; claim_refs_json: string }
interface ClaimRow { evidence_refs_json: string }
interface EvidenceRow { acquired_at: string }

function activeAt(from: string, to: string | null, at: string): boolean {
  return from <= at && (to === null || to > at);
}

function stableIdentity(input: PositionInput, projection: PositionProjection, projectorVersion: string): string {
  const canonical = JSON.stringify({
    playgroundId: input.playgroundId,
    mode: input.mode,
    asOf: input.asOf,
    evidenceCutoff: input.evidenceCutoff,
    profileSnapshotId: input.profileSnapshotId,
    perspectiveId: input.perspectiveId ?? null,
    question: input.question ?? null,
    projectorVersion,
    projection,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export class PositionProjector {
  constructor(private readonly db: Database.Database, private readonly projectorVersion = "p1-projector@0.1") {}

  project(input: PositionInput): ProjectedPosition {
    const profileSnapshot = this.db.prepare("SELECT claim_refs_json FROM profile_snapshots WHERE id = ?").get(input.profileSnapshotId) as { claim_refs_json: string } | undefined;
    if (!profileSnapshot) throw new Error(`profile snapshot not found: ${input.profileSnapshotId}`);
    const visibleClaimIds = new Set(JSON.parse(profileSnapshot.claim_refs_json) as string[]);
    const nodes = this.db
      .prepare("SELECT id FROM nodes WHERE identity_scope = ? ORDER BY id")
      .all(input.playgroundId) as NodeRow[];
    const relations = this.db
      .prepare("SELECT id, valid_from, valid_to, claim_refs_json FROM relations WHERE subject_id IN (SELECT id FROM nodes WHERE identity_scope = ?) AND object_id IN (SELECT id FROM nodes WHERE identity_scope = ?) ORDER BY id")
      .all(input.playgroundId, input.playgroundId) as RelationRow[];
    const flows = this.db
      .prepare("SELECT id, valid_from, valid_to, path_json, claim_refs_json FROM flows ORDER BY id")
      .all() as FlowRow[];
    const states = this.db
      .prepare("SELECT id, subject_id, state_type, valid_from, valid_to, claim_refs_json FROM states WHERE subject_id IN (SELECT id FROM nodes WHERE identity_scope = ?) ORDER BY subject_id, state_type, valid_from DESC, id DESC")
      .all(input.playgroundId) as StateRow[];

    const latestStateBySubjectType = new Map<string, StateRow>();
    for (const state of states) {
      if (!activeAt(state.valid_from, state.valid_to, input.asOf)) continue;
      const claimRefs = JSON.parse(state.claim_refs_json) as string[];
      if (!this.claimsVisible(claimRefs, visibleClaimIds, input.evidenceCutoff)) continue;
      const key = `${state.subject_id}:${state.state_type}`;
      if (!latestStateBySubjectType.has(key)) latestStateBySubjectType.set(key, state);
    }

    const projection: PositionProjection = {
      active_node_ids: nodes.map((node) => node.id),
      relation_ids: relations
        .filter((row) => activeAt(row.valid_from, row.valid_to, input.asOf))
        .filter((row) => this.claimsVisible(JSON.parse(row.claim_refs_json) as string[], visibleClaimIds, input.evidenceCutoff))
        .map((row) => row.id),
      flow_ids: flows
        .filter((row) => activeAt(row.valid_from, row.valid_to, input.asOf))
        .filter((row) => (JSON.parse(row.path_json) as string[]).every((nodeId) => nodes.some((node) => node.id === nodeId)))
        .filter((row) => this.claimsVisible(JSON.parse(row.claim_refs_json) as string[], visibleClaimIds, input.evidenceCutoff))
        .map((row) => row.id),
      state_ids: [...latestStateBySubjectType.values()].map((state) => state.id).sort(),
    };

    return {
      ...input,
      projectorVersion: this.projectorVersion,
      projection,
      projectionIdentity: stableIdentity(input, projection, this.projectorVersion),
    };
  }

  private claimsVisible(claimIds: string[], visibleClaimIds: Set<string>, evidenceCutoff: string): boolean {
    return claimIds.every((claimId) => {
      if (!visibleClaimIds.has(claimId)) return false;
      const claim = this.db.prepare("SELECT evidence_refs_json FROM claims WHERE id = ?").get(claimId) as ClaimRow | undefined;
      if (!claim) return false;
      const evidenceRefs = JSON.parse(claim.evidence_refs_json) as string[];
      return evidenceRefs.every((evidenceId) => {
        const evidence = this.db.prepare("SELECT acquired_at FROM evidence_items WHERE id = ?").get(evidenceId) as EvidenceRow | undefined;
        return evidence !== undefined && evidence.acquired_at <= evidenceCutoff;
      });
    });
  }

  persist(position: ProjectedPosition): void {
    this.db.prepare(`
      INSERT INTO positions (
        id, mode, playground_id, as_of, evidence_cutoff, profile_snapshot_id,
        perspective_id, question, projector_version, projection_identity,
        projection_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mode = excluded.mode,
        playground_id = excluded.playground_id,
        as_of = excluded.as_of,
        evidence_cutoff = excluded.evidence_cutoff,
        profile_snapshot_id = excluded.profile_snapshot_id,
        perspective_id = excluded.perspective_id,
        question = excluded.question,
        projector_version = excluded.projector_version,
        projection_identity = excluded.projection_identity,
        projection_json = excluded.projection_json
    `).run(
      position.id,
      position.mode,
      position.playgroundId,
      position.asOf,
      position.evidenceCutoff,
      position.profileSnapshotId,
      position.perspectiveId ?? null,
      position.question ?? null,
      position.projectorVersion,
      position.projectionIdentity,
      JSON.stringify(position.projection),
      new Date().toISOString(),
    );
  }
}
