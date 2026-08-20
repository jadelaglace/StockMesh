import type {
  AdaptedGraph,
  MethodDefinition,
  MethodExecutionContext,
  PartyScoreOutput,
  PartyScoreVector,
  StoredPosition,
} from "./types.js";
import {
  buildPartyScoreVectors,
  computeCommunities,
  computeFoundation,
  computePageRank,
  normalizeCommunityConfiguration,
  normalizeFoundationConfiguration,
  normalizeGraphConfiguration,
  normalizePageRankConfiguration,
  type CommunityConfiguration,
  type CommunityOutput,
  type FoundationConfiguration,
  type FoundationOutput,
  type PageRankConfiguration,
  type PageRankOutput,
  type TemporalDeltaOutput,
  type TemporalDeltaOutputV1,
} from "./metrics.js";

const executor = "graphology@0.26.0";

export const foundationMethod: MethodDefinition<FoundationConfiguration, FoundationOutput> = {
  id: "sna.foundation",
  version: "1.0.0",
  title: "Transparent directed-network foundation pack",
  category: "foundation",
  executor,
  implementationIdentity: "stockmesh.sna.foundation@1|graphology@0.26.0|components@1.5.4|shortest-path@2.1.0|metrics@2.4.0",
  outputSchema: "stockmesh.method.sna-foundation-output@1",
  caveats: [
    "Degree and strength measure scoped connection or observed volume, not influence, support, or worth.",
    "Topological reachability and shortest paths do not prove that information, trust, or action will travel.",
    "Density, reciprocity, clustering, and category mixing are sensitive to scope and missing edges.",
    "Betweenness is a structural brokerage hypothesis under unweighted shortest paths, not proof of control.",
  ],
  normalizeConfiguration: normalizeFoundationConfiguration,
  execute: (context, configuration) => computeFoundation(context.adaptedGraph.graph, configuration),
};

export const pageRankMethod: MethodDefinition<PageRankConfiguration, PageRankOutput> = {
  id: "sna.pagerank",
  version: "1.0.0",
  title: "Exploratory directed weighted PageRank",
  category: "exploratory",
  executor,
  implementationIdentity: "stockmesh.sna.pagerank@1|graphology@0.26.0|metrics@2.4.0",
  outputSchema: "stockmesh.method.pagerank-output@1",
  caveats: [
    "PageRank reflects recursively weighted incoming attention or dependency under the declared direction, weights, damping, and scope.",
    "It is not a universal influence, power, loyalty, or value score.",
  ],
  normalizeConfiguration: normalizePageRankConfiguration,
  execute: (context, configuration) => ({
    graphSemantics: { direction: "source-to-target", weightSemantics: "unit-observed-edge-count" },
    parameters: { damping: configuration.alpha, maxIterations: configuration.maxIterations, tolerance: configuration.tolerance },
    scores: computePageRank(context.adaptedGraph.graph, configuration),
  }),
};

export const communityMethod: MethodDefinition<CommunityConfiguration, CommunityOutput> = {
  id: "sna.community-louvain",
  version: "1.0.0",
  title: "Exploratory Louvain sensitivity runs",
  category: "exploratory",
  executor,
  implementationIdentity: "stockmesh.sna.louvain@1|graphology@0.26.0|louvain@2.0.2",
  outputSchema: "stockmesh.method.louvain-sensitivity-output@1",
  caveats: [
    "Communities are unstable model outputs over an undirected projection, not established factions or motives.",
    "Resolution, seed, graph scope, missing edges, modularity, and disagreement across runs must remain visible.",
  ],
  normalizeConfiguration: normalizeCommunityConfiguration,
  execute: (context, configuration) => computeCommunities(context.adaptedGraph.graph, configuration),
};

interface DeltaConfiguration { graph: ReturnType<typeof normalizeGraphConfiguration>; beforePositionId: string }

function normalizeDeltaConfiguration(value: unknown): DeltaConfiguration {
  const raw = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
  if (typeof raw.beforePositionId !== "string" || raw.beforePositionId.length === 0) throw new Error("beforePositionId is required");
  return { graph: normalizeGraphConfiguration(raw.graph), beforePositionId: raw.beforePositionId };
}

function deltaInputDescriptor(context: MethodExecutionContext, configuration: DeltaConfiguration): unknown {
  return {
    before: context.loadGraph(configuration.beforePositionId, configuration.graph).inputDescriptor,
    after: context.adaptedGraph.inputDescriptor,
  };
}

function identifierDiff(left: string[], right: string[]): { added: string[]; removed: string[] } {
  return {
    added: right.filter((item) => !left.includes(item)).sort(),
    removed: left.filter((item) => !right.includes(item)).sort(),
  };
}

function graphSourceIds(adapted: AdaptedGraph, sourceKind: "relation" | "flow"): string[] {
  const ids = new Set<string>();
  for (const edge of adapted.graph.edges()) {
    for (const source of adapted.graph.getEdgeAttribute(edge, "provenance")) {
      if (source.sourceKind === sourceKind) ids.add(source.sourceId);
    }
  }
  return [...ids].sort();
}

function temporalParts(context: MethodExecutionContext, configuration: DeltaConfiguration): {
  beforePosition: StoredPosition;
  beforeGraph: AdaptedGraph;
  before: FoundationOutput;
  after: FoundationOutput;
  commonNodes: string[];
} {
  const beforePosition = context.loadPosition(configuration.beforePositionId);
  const beforeGraph = context.loadGraph(configuration.beforePositionId, configuration.graph);
  const before = computeFoundation(beforeGraph.graph, { graph: configuration.graph, egoRootNodeId: null, egoMaxHops: 2 });
  const after = computeFoundation(context.adaptedGraph.graph, { graph: configuration.graph, egoRootNodeId: null, egoMaxHops: 2 });
  return {
    beforePosition,
    beforeGraph,
    before,
    after,
    commonNodes: Object.keys(before.nodes).filter((node) => node in after.nodes).sort(),
  };
}

function temporalReferences(context: MethodExecutionContext, beforePosition: StoredPosition) {
  return {
    before: { positionId: beforePosition.id, asOf: beforePosition.asOf, evidenceCutoff: beforePosition.evidenceCutoff, profileSnapshotId: beforePosition.profileSnapshotId, projectionIdentity: beforePosition.projectionIdentity },
    after: { positionId: context.position.id, asOf: context.position.asOf, evidenceCutoff: context.position.evidenceCutoff, profileSnapshotId: context.position.profileSnapshotId, projectionIdentity: context.position.projectionIdentity },
  };
}

function temporalMetrics(before: FoundationOutput, after: FoundationOutput, commonNodes: string[]) {
  return {
    metrics: {
      density: { before: before.graph.density, after: after.graph.density, delta: after.graph.density - before.graph.density },
      reciprocity: { before: before.graph.reciprocity, after: after.graph.reciprocity, delta: after.graph.reciprocity - before.graph.reciprocity },
      weakComponentCount: { before: before.graph.weakComponents.length, after: after.graph.weakComponents.length, delta: after.graph.weakComponents.length - before.graph.weakComponents.length },
    },
    nodeMetricDeltas: Object.fromEntries(commonNodes.map((node) => [node, {
      totalDegree: after.nodes[node]!.totalDegree - before.nodes[node]!.totalDegree,
      totalStrength: after.nodes[node]!.totalStrength - before.nodes[node]!.totalStrength,
      betweenness: after.nodes[node]!.betweenness - before.nodes[node]!.betweenness,
    }])),
  };
}

const temporalCaveats = [
  "A metric change may reflect valid-time change, newly acquired evidence, a profile revision, scope change, or correction rather than a real-world change.",
  "Both Position time axes and profile snapshot identities must be inspected before interpretation.",
];

export const temporalDeltaMethodV1: MethodDefinition<DeltaConfiguration, TemporalDeltaOutputV1> = {
  id: "sna.temporal-delta",
  version: "1.0.0",
  title: "Position-to-Position structural delta (legacy output)",
  category: "wrapper",
  executor,
  implementationIdentity: "stockmesh.sna.temporal-delta@1|foundation@1.0.0",
  outputSchema: "stockmesh.method.temporal-delta-output@1",
  caveats: temporalCaveats,
  normalizeConfiguration: normalizeDeltaConfiguration,
  inputDescriptor: deltaInputDescriptor,
  execute: (context, configuration) => {
    const { beforePosition, before, after, commonNodes } = temporalParts(context, configuration);
    return {
      ...temporalReferences(context, beforePosition),
      structural: {
        nodes: identifierDiff(beforePosition.projection.active_node_ids, context.position.projection.active_node_ids),
        relations: identifierDiff(beforePosition.projection.relation_ids, context.position.projection.relation_ids),
        flows: identifierDiff(beforePosition.projection.flow_ids, context.position.projection.flow_ids),
        states: identifierDiff(beforePosition.projection.state_ids, context.position.projection.state_ids),
      },
      ...temporalMetrics(before, after, commonNodes),
    };
  },
};

export const temporalDeltaMethod: MethodDefinition<DeltaConfiguration, TemporalDeltaOutput> = {
  id: "sna.temporal-delta",
  version: "1.1.0",
  title: "Position-to-Position structural delta with explicit scopes",
  category: "wrapper",
  executor,
  implementationIdentity: "stockmesh.sna.temporal-delta@2|foundation@1.0.0",
  outputSchema: "stockmesh.method.temporal-delta-output@2",
  caveats: [
    ...temporalCaveats,
    "Position projection deltas are complete; analysis-graph deltas and metrics honor the declared Relation/Flow filters.",
  ],
  normalizeConfiguration: normalizeDeltaConfiguration,
  inputDescriptor: deltaInputDescriptor,
  execute: (context, configuration) => {
    const { beforePosition, beforeGraph, before, after, commonNodes } = temporalParts(context, configuration);
    return {
      ...temporalReferences(context, beforePosition),
      analysisGraphConfiguration: configuration.graph,
      positionStructural: {
        nodes: identifierDiff(beforePosition.projection.active_node_ids, context.position.projection.active_node_ids),
        relations: identifierDiff(beforePosition.projection.relation_ids, context.position.projection.relation_ids),
        flows: identifierDiff(beforePosition.projection.flow_ids, context.position.projection.flow_ids),
        states: identifierDiff(beforePosition.projection.state_ids, context.position.projection.state_ids),
      },
      analysisGraphStructural: {
        nodes: identifierDiff(beforeGraph.graph.nodes().sort(), context.adaptedGraph.graph.nodes().sort()),
        relations: identifierDiff(graphSourceIds(beforeGraph, "relation"), graphSourceIds(context.adaptedGraph, "relation")),
        flows: identifierDiff(graphSourceIds(beforeGraph, "flow"), graphSourceIds(context.adaptedGraph, "flow")),
      },
      ...temporalMetrics(before, after, commonNodes),
    };
  },
};

interface PartyConfiguration {
  graph: ReturnType<typeof normalizeGraphConfiguration>;
  partyNodeIds: string[];
  objective: string;
  horizon: string;
  uncertainty: PartyScoreVector["uncertainty"];
}

export const partyScoreMethod: MethodDefinition<PartyConfiguration, PartyScoreOutput> = {
  id: "sna.party-structural-vector",
  version: "1.0.0",
  title: "Per-Party structural score vectors",
  category: "profile",
  executor,
  implementationIdentity: "stockmesh.sna.party-vector@1|foundation@1.0.0|pagerank@1.0.0",
  outputSchema: "stockmesh.method.party-score-vector-output@1",
  caveats: [
    "Dimensions remain separate and objective-bound; StockMesh does not infer a scalar winner.",
    "Structural exposure, brokerage, and PageRank do not establish motive, merit, support, or future behavior.",
  ],
  normalizeConfiguration: (value) => {
    const raw = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
    if (typeof raw.objective !== "string" || raw.objective.length === 0) throw new Error("objective is required");
    if (typeof raw.horizon !== "string" || raw.horizon.length === 0) throw new Error("horizon is required");
    const level = raw.uncertaintyLevel ?? "high";
    if (!(["low", "medium", "high"] as unknown[]).includes(level)) throw new Error("uncertaintyLevel is invalid");
    return {
      graph: normalizeGraphConfiguration(raw.graph),
      partyNodeIds: Array.isArray(raw.partyNodeIds) ? [...new Set(raw.partyNodeIds.map(String))].sort() : [],
      objective: raw.objective,
      horizon: raw.horizon,
      uncertainty: {
        level: level as "low" | "medium" | "high",
        basis: Array.isArray(raw.uncertaintyBasis) ? raw.uncertaintyBasis.map(String).sort() : ["Synthetic graph scope does not establish real-world completeness."],
      },
    };
  },
  execute: (context, configuration) => {
    const partyNodeIds = configuration.partyNodeIds.length > 0 ? configuration.partyNodeIds : context.adaptedGraph.graph.nodes().sort();
    return {
      vectors: buildPartyScoreVectors(context.adaptedGraph.graph, context.position, partyNodeIds, configuration.objective, configuration.horizon, configuration.uncertainty),
      aggregateScore: null,
    };
  },
};
