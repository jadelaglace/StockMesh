import type { DirectedGraph } from "graphology";

export type MethodCategory = "foundation" | "exploratory" | "profile" | "wrapper";
export type MethodRunStatus = "running" | "succeeded" | "failed";

export interface EdgeProvenance {
  sourceKind: "relation" | "flow";
  sourceId: string;
  sourceType: string;
}

export interface AnalysisNodeAttributes {
  nodeType: string;
}

export interface AnalysisEdgeAttributes {
  weight: number;
  weightSemantics: "unit-observed-edge-count";
  provenance: EdgeProvenance[];
}

export type AnalysisGraph = DirectedGraph<AnalysisNodeAttributes, AnalysisEdgeAttributes>;

export interface GraphAdapterConfiguration {
  includeRelations: boolean;
  includeFlows: boolean;
  relationTypes: string[];
  flowTypes: string[];
}

export interface StoredPosition {
  id: string;
  playgroundId: string;
  asOf: string;
  evidenceCutoff: string;
  profileSnapshotId: string;
  projectionIdentity: string;
  projection: {
    active_node_ids: string[];
    relation_ids: string[];
    flow_ids: string[];
    state_ids: string[];
  };
}

export interface AdaptedGraph {
  graph: AnalysisGraph;
  configuration: GraphAdapterConfiguration;
  inputIdentity: string;
  inputDescriptor: Record<string, unknown>;
}

export interface MethodExecutionContext {
  position: StoredPosition;
  adaptedGraph: AdaptedGraph;
  loadPosition(positionId: string): StoredPosition;
  loadGraph(positionId: string, configuration?: Partial<GraphAdapterConfiguration>): AdaptedGraph;
}

export interface MethodDefinition<Configuration = unknown, Output = unknown> {
  id: string;
  version: string;
  title: string;
  category: MethodCategory;
  executor: string;
  implementationIdentity: string;
  outputSchema: string;
  caveats: string[];
  normalizeConfiguration(configuration: unknown): Configuration;
  inputDescriptor?(context: MethodExecutionContext, configuration: Configuration): unknown;
  execute(context: MethodExecutionContext, configuration: Configuration): Output;
}

export interface MethodRunRequest {
  positionId: string;
  methodId: string;
  methodVersion?: string;
  configuration?: unknown;
}

export interface MethodRunRecord<Output = unknown> {
  id: string;
  methodId: string;
  methodVersion: string;
  positionId: string;
  positionProjectionIdentity: string;
  inputIdentity: string;
  configurationIdentity: string;
  configuration: unknown;
  executor: string;
  implementationIdentity: string;
  status: MethodRunStatus;
  outputIdentity: string;
  outputSchema: string;
  output: Output;
  caveats: string[];
}

export interface ScoreDimension {
  id: string;
  label: string;
  value: number;
  unit: string;
  interpretation: string;
}

export interface PartyScoreVector {
  partyNodeId: string;
  objective: string;
  horizon: string;
  dimensions: ScoreDimension[];
  uncertainty: {
    level: "low" | "medium" | "high";
    basis: string[];
  };
  positionRef: {
    positionId: string;
    projectionIdentity: string;
    evidenceCutoff: string;
    profileSnapshotId: string;
  };
  methodRefs: string[];
}

export interface PartyScoreOutput {
  vectors: PartyScoreVector[];
  aggregateScore: null;
}
