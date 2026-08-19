import { DirectedGraph } from "graphology";
import type Database from "better-sqlite3";
import { stableHash } from "./identity.js";
import type {
  AdaptedGraph,
  AnalysisEdgeAttributes,
  AnalysisGraph,
  EdgeProvenance,
  GraphAdapterConfiguration,
  StoredPosition,
} from "./types.js";

interface PositionRow {
  id: string;
  playground_id: string;
  as_of: string;
  evidence_cutoff: string;
  profile_snapshot_id: string;
  projection_identity: string;
  projection_json: string;
}

interface NodeRow { id: string; node_type: string }
interface RelationRow { id: string; relation_type: string; subject_id: string; object_id: string }
interface FlowRow { id: string; flow_type: string; path_json: string }

const defaultConfiguration: GraphAdapterConfiguration = {
  includeRelations: true,
  includeFlows: true,
  relationTypes: [],
  flowTypes: [],
};

function selectByIds<T>(db: Database.Database, table: string, columns: string, ids: string[]): T[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  return db.prepare(`SELECT ${columns} FROM ${table} WHERE id IN (${placeholders}) ORDER BY id`).all(...ids) as T[];
}

export class PositionGraphAdapter {
  constructor(private readonly db: Database.Database) {}

  loadPosition(positionId: string): StoredPosition {
    const row = this.db.prepare(`
      SELECT id, playground_id, as_of, evidence_cutoff, profile_snapshot_id, projection_identity, projection_json
      FROM positions WHERE id = ?
    `).get(positionId) as PositionRow | undefined;
    if (!row) throw new Error(`position not found: ${positionId}`);
    return {
      id: row.id,
      playgroundId: row.playground_id,
      asOf: row.as_of,
      evidenceCutoff: row.evidence_cutoff,
      profileSnapshotId: row.profile_snapshot_id,
      projectionIdentity: row.projection_identity,
      projection: JSON.parse(row.projection_json) as StoredPosition["projection"],
    };
  }

  adapt(position: StoredPosition, partial: Partial<GraphAdapterConfiguration> = {}): AdaptedGraph {
    const configuration: GraphAdapterConfiguration = {
      includeRelations: partial.includeRelations ?? defaultConfiguration.includeRelations,
      includeFlows: partial.includeFlows ?? defaultConfiguration.includeFlows,
      relationTypes: [...(partial.relationTypes ?? defaultConfiguration.relationTypes)].sort(),
      flowTypes: [...(partial.flowTypes ?? defaultConfiguration.flowTypes)].sort(),
    };
    const graph: AnalysisGraph = new DirectedGraph();
    const nodes = selectByIds<NodeRow>(this.db, "nodes", "id, node_type", position.projection.active_node_ids);
    if (nodes.length !== position.projection.active_node_ids.length) throw new Error(`Position ${position.id} references missing Nodes`);
    for (const node of nodes) graph.addNode(node.id, { nodeType: node.node_type });

    const aggregates = new Map<string, { source: string; target: string; provenance: EdgeProvenance[] }>();
    const add = (source: string, target: string, provenance: EdgeProvenance): void => {
      if (!graph.hasNode(source) || !graph.hasNode(target)) throw new Error(`edge endpoint is outside Position ${position.id}`);
      const key = `${source}\u0000${target}`;
      const existing = aggregates.get(key) ?? { source, target, provenance: [] };
      existing.provenance.push(provenance);
      aggregates.set(key, existing);
    };

    if (configuration.includeRelations) {
      const relations = selectByIds<RelationRow>(this.db, "relations", "id, relation_type, subject_id, object_id", position.projection.relation_ids);
      if (relations.length !== position.projection.relation_ids.length) throw new Error(`Position ${position.id} references missing Relations`);
      for (const relation of relations) {
        if (configuration.relationTypes.length > 0 && !configuration.relationTypes.includes(relation.relation_type)) continue;
        add(relation.subject_id, relation.object_id, { sourceKind: "relation", sourceId: relation.id, sourceType: relation.relation_type });
      }
    }
    if (configuration.includeFlows) {
      const flows = selectByIds<FlowRow>(this.db, "flows", "id, flow_type, path_json", position.projection.flow_ids);
      if (flows.length !== position.projection.flow_ids.length) throw new Error(`Position ${position.id} references missing Flows`);
      for (const flow of flows) {
        if (configuration.flowTypes.length > 0 && !configuration.flowTypes.includes(flow.flow_type)) continue;
        const path = JSON.parse(flow.path_json) as string[];
        for (let index = 0; index < path.length - 1; index += 1) {
          add(path[index]!, path[index + 1]!, { sourceKind: "flow", sourceId: flow.id, sourceType: flow.flow_type });
        }
      }
    }

    const edges = [...aggregates.values()]
      .map((edge) => ({ ...edge, provenance: edge.provenance.sort((left, right) => `${left.sourceKind}:${left.sourceId}`.localeCompare(`${right.sourceKind}:${right.sourceId}`)) }))
      .sort((left, right) => `${left.source}:${left.target}`.localeCompare(`${right.source}:${right.target}`));
    edges.forEach((edge, index) => {
      const attributes: AnalysisEdgeAttributes = {
        weight: edge.provenance.length,
        weightSemantics: "unit-observed-edge-count",
        provenance: edge.provenance,
      };
      graph.addDirectedEdgeWithKey(`edge-${index}`, edge.source, edge.target, attributes);
    });

    const inputDescriptor = {
      positionId: position.id,
      projectionIdentity: position.projectionIdentity,
      configuration,
      nodes: nodes.map((node) => ({ id: node.id, nodeType: node.node_type })),
      edges: edges.map((edge) => ({ source: edge.source, target: edge.target, weight: edge.provenance.length, provenance: edge.provenance })),
    };
    return { graph, configuration, inputDescriptor, inputIdentity: stableHash(inputDescriptor) };
  }
}
