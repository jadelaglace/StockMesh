import { UndirectedGraph } from "graphology";
import { connectedComponents, stronglyConnectedComponents } from "graphology-components";
import * as louvainModule from "graphology-communities-louvain";
import * as betweennessModule from "graphology-metrics/centrality/betweenness.js";
import * as pagerankModule from "graphology-metrics/centrality/pagerank.js";
import { directedDensity } from "graphology-metrics/graph/density.js";
import { singleSourceLength } from "graphology-shortest-path/unweighted.js";
import type {
  AnalysisGraph,
  GraphAdapterConfiguration,
  PartyScoreVector,
  StoredPosition,
} from "./types.js";

const louvain = louvainModule.default as unknown as {
  detailed(graph: UndirectedGraph<{ nodeType: string }, { weight: number }>, options: Record<string, unknown>): {
    communities: Record<string, number>;
    count: number;
    modularity: number;
  };
};
const betweennessCentrality = betweennessModule.default as unknown as (
  graph: AnalysisGraph,
  options: { getEdgeWeight: null; normalized: boolean },
) => Record<string, number>;
const pagerank = pagerankModule.default as unknown as (
  graph: AnalysisGraph,
  options: { getEdgeWeight: "weight"; alpha: number; maxIterations: number; tolerance: number },
) => Record<string, number>;

export interface FoundationConfiguration {
  graph: GraphAdapterConfiguration;
  egoRootNodeId: string | null;
  egoMaxHops: number;
}

export interface FoundationOutput {
  graph: {
    directed: true;
    order: number;
    size: number;
    density: number;
    reciprocity: number;
    weakComponents: string[][];
    strongComponents: string[][];
    weightSemantics: "unit-observed-edge-count";
  };
  nodes: Record<string, {
    inDegree: number;
    outDegree: number;
    totalDegree: number;
    inStrength: number;
    outStrength: number;
    totalStrength: number;
    localClustering: number;
    betweenness: number;
    shortestPathLengths: Record<string, number>;
  }>;
  egoNetwork: null | { rootNodeId: string; maxHops: number; traversal: "outbound"; nodeIds: string[] };
  mixing: {
    attribute: "nodeType";
    categories: string[];
    matrix: Record<string, Record<string, number>>;
    assortativity: number | null;
  };
}

export interface PageRankConfiguration {
  graph: GraphAdapterConfiguration;
  alpha: number;
  maxIterations: number;
  tolerance: number;
}

export interface PageRankOutput {
  graphSemantics: {
    direction: "source-to-target";
    weightSemantics: "unit-observed-edge-count";
  };
  parameters: {
    damping: number;
    maxIterations: number;
    tolerance: number;
  };
  scores: Record<string, number>;
}

export interface CommunityConfiguration {
  graph: GraphAdapterConfiguration;
  resolutions: number[];
  seeds: number[];
}

export interface CommunityOutput {
  projection: "undirected-weighted";
  runs: Array<{
    resolution: number;
    seed: number;
    modularity: number;
    communityCount: number;
    communities: Record<string, number>;
  }>;
}

interface PositionTimeReference {
  positionId: string;
  asOf: string;
  evidenceCutoff: string;
  profileSnapshotId: string;
  projectionIdentity: string;
}

interface IdentifierDelta {
  added: string[];
  removed: string[];
}

interface MetricDelta {
  before: number;
  after: number;
  delta: number;
}

export interface TemporalDeltaOutput {
  before: PositionTimeReference;
  after: PositionTimeReference;
  structural: {
    nodes: IdentifierDelta;
    relations: IdentifierDelta;
    flows: IdentifierDelta;
    states: IdentifierDelta;
  };
  metrics: {
    density: MetricDelta;
    reciprocity: MetricDelta;
    weakComponentCount: MetricDelta;
  };
  nodeMetricDeltas: Record<string, {
    totalDegree: number;
    totalStrength: number;
    betweenness: number;
  }>;
}

export function normalizeGraphConfiguration(value: unknown): GraphAdapterConfiguration {
  if (value !== undefined && value !== null && (typeof value !== "object" || Array.isArray(value))) {
    throw new Error("graph configuration must be an object");
  }
  const raw = value === undefined || value === null ? {} : value as Record<string, unknown>;
  if (raw.includeRelations !== undefined && typeof raw.includeRelations !== "boolean") throw new Error("includeRelations must be boolean");
  if (raw.includeFlows !== undefined && typeof raw.includeFlows !== "boolean") throw new Error("includeFlows must be boolean");
  if (raw.relationTypes !== undefined && !Array.isArray(raw.relationTypes)) throw new Error("relationTypes must be an array");
  if (raw.flowTypes !== undefined && !Array.isArray(raw.flowTypes)) throw new Error("flowTypes must be an array");
  return {
    includeRelations: (raw.includeRelations as boolean | undefined) ?? true,
    includeFlows: (raw.includeFlows as boolean | undefined) ?? true,
    relationTypes: [...((raw.relationTypes as unknown[] | undefined) ?? [])].map(String).sort(),
    flowTypes: [...((raw.flowTypes as unknown[] | undefined) ?? [])].map(String).sort(),
  };
}

export function normalizeFoundationConfiguration(value: unknown): FoundationConfiguration {
  const raw = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
  const maxHops = Number(raw.egoMaxHops ?? 2);
  if (!Number.isInteger(maxHops) || maxHops < 0) throw new Error("egoMaxHops must be a non-negative integer");
  return {
    graph: normalizeGraphConfiguration(raw.graph),
    egoRootNodeId: raw.egoRootNodeId === undefined || raw.egoRootNodeId === null ? null : String(raw.egoRootNodeId),
    egoMaxHops: maxHops,
  };
}

export function normalizePageRankConfiguration(value: unknown): PageRankConfiguration {
  const raw = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
  const alpha = Number(raw.alpha ?? 0.85);
  const maxIterations = Number(raw.maxIterations ?? 100);
  const tolerance = Number(raw.tolerance ?? 1e-6);
  if (!(alpha > 0 && alpha < 1)) throw new Error("PageRank alpha must be between 0 and 1");
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new Error("PageRank maxIterations must be a positive integer");
  if (!Number.isFinite(tolerance) || !(tolerance > 0)) throw new Error("PageRank tolerance must be positive and finite");
  return { graph: normalizeGraphConfiguration(raw.graph), alpha, maxIterations, tolerance };
}

export function normalizeCommunityConfiguration(value: unknown): CommunityConfiguration {
  const raw = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
  const resolutions = [...new Set((Array.isArray(raw.resolutions) ? raw.resolutions : [0.5, 1, 1.5]).map(Number))].sort((a, b) => a - b);
  const seeds = [...new Set((Array.isArray(raw.seeds) ? raw.seeds : [1, 2, 3]).map(Number))].sort((a, b) => a - b);
  if (resolutions.some((resolution) => !Number.isFinite(resolution) || !(resolution > 0))) throw new Error("Louvain resolutions must be positive and finite");
  if (seeds.some((seed) => !Number.isInteger(seed))) throw new Error("Louvain seeds must be integers");
  if (resolutions.length === 0 || seeds.length === 0) throw new Error("Louvain resolutions and seeds must not be empty");
  return { graph: normalizeGraphConfiguration(raw.graph), resolutions, seeds };
}

function sortedComponents(components: string[][]): string[][] {
  return components.map((component) => [...component].sort()).sort((left, right) => left[0]!.localeCompare(right[0]!));
}

function strength(graph: AnalysisGraph, edges: string[]): number {
  return edges.reduce((sum, edge) => sum + graph.getEdgeAttribute(edge, "weight"), 0);
}

function reciprocity(graph: AnalysisGraph): number {
  const eligible = graph.edges().filter((edge) => graph.source(edge) !== graph.target(edge));
  if (eligible.length === 0) return 0;
  const reciprocal = eligible.filter((edge) => graph.hasDirectedEdge(graph.target(edge), graph.source(edge))).length;
  return reciprocal / eligible.length;
}

function localClustering(graph: AnalysisGraph, node: string): number {
  const neighbors = [...new Set(graph.neighbors(node))].sort();
  if (neighbors.length < 2) return 0;
  let closed = 0;
  for (let left = 0; left < neighbors.length; left += 1) {
    for (let right = left + 1; right < neighbors.length; right += 1) {
      const a = neighbors[left]!;
      const b = neighbors[right]!;
      if (graph.hasDirectedEdge(a, b) || graph.hasDirectedEdge(b, a)) closed += 1;
    }
  }
  return closed / (neighbors.length * (neighbors.length - 1) / 2);
}

function mixing(graph: AnalysisGraph): FoundationOutput["mixing"] {
  const categories = [...new Set(graph.nodes().map((node) => graph.getNodeAttribute(node, "nodeType")))].sort();
  const matrix = Object.fromEntries(categories.map((source) => [source, Object.fromEntries(categories.map((target) => [target, 0]))])) as Record<string, Record<string, number>>;
  let total = 0;
  for (const edge of graph.edges()) {
    const sourceType = graph.getNodeAttribute(graph.source(edge), "nodeType");
    const targetType = graph.getNodeAttribute(graph.target(edge), "nodeType");
    const weight = graph.getEdgeAttribute(edge, "weight");
    matrix[sourceType]![targetType] = (matrix[sourceType]![targetType] ?? 0) + weight;
    total += weight;
  }
  if (total === 0) return { attribute: "nodeType", categories, matrix, assortativity: null };
  const rowShares = Object.fromEntries(categories.map((category) => [category, categories.reduce((sum, target) => sum + matrix[category]![target]!, 0) / total]));
  const columnShares = Object.fromEntries(categories.map((category) => [category, categories.reduce((sum, source) => sum + matrix[source]![category]!, 0) / total]));
  const trace = categories.reduce((sum, category) => sum + matrix[category]![category]! / total, 0);
  const expected = categories.reduce((sum, category) => sum + rowShares[category]! * columnShares[category]!, 0);
  const assortativity = Math.abs(1 - expected) < Number.EPSILON ? null : (trace - expected) / (1 - expected);
  return { attribute: "nodeType", categories, matrix, assortativity };
}

export function computeFoundation(graph: AnalysisGraph, configuration: FoundationConfiguration): FoundationOutput {
  if (configuration.egoRootNodeId !== null && !graph.hasNode(configuration.egoRootNodeId)) throw new Error(`ego root not found: ${configuration.egoRootNodeId}`);
  const betweenness = graph.order < 2 ? Object.fromEntries(graph.nodes().map((node) => [node, 0])) : betweennessCentrality(graph, { getEdgeWeight: null, normalized: true });
  const nodes: FoundationOutput["nodes"] = {};
  for (const node of graph.nodes().sort()) {
    const lengths = singleSourceLength(graph, node);
    nodes[node] = {
      inDegree: graph.inDegree(node),
      outDegree: graph.outDegree(node),
      totalDegree: graph.degree(node),
      inStrength: strength(graph, graph.inEdges(node)),
      outStrength: strength(graph, graph.outEdges(node)),
      totalStrength: strength(graph, graph.edges(node)),
      localClustering: localClustering(graph, node),
      betweenness: betweenness[node] ?? 0,
      shortestPathLengths: Object.fromEntries(Object.entries(lengths).sort(([left], [right]) => left.localeCompare(right))),
    };
  }
  const egoNetwork = configuration.egoRootNodeId === null ? null : {
    rootNodeId: configuration.egoRootNodeId,
    maxHops: configuration.egoMaxHops,
    traversal: "outbound" as const,
    nodeIds: Object.entries(nodes[configuration.egoRootNodeId]!.shortestPathLengths)
      .filter(([, distance]) => distance <= configuration.egoMaxHops)
      .map(([node]) => node)
      .sort(),
  };
  return {
    graph: {
      directed: true,
      order: graph.order,
      size: graph.size,
      density: directedDensity(graph),
      reciprocity: reciprocity(graph),
      weakComponents: sortedComponents(connectedComponents(graph)),
      strongComponents: sortedComponents(stronglyConnectedComponents(graph)),
      weightSemantics: "unit-observed-edge-count",
    },
    nodes,
    egoNetwork,
    mixing: mixing(graph),
  };
}

export function computePageRank(graph: AnalysisGraph, configuration: PageRankConfiguration): Record<string, number> {
  if (graph.order === 0) return {};
  const scores = pagerank(graph, {
    getEdgeWeight: "weight",
    alpha: configuration.alpha,
    maxIterations: configuration.maxIterations,
    tolerance: configuration.tolerance,
  });
  return Object.fromEntries(Object.entries(scores).sort(([left], [right]) => left.localeCompare(right))) as Record<string, number>;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function computeCommunities(graph: AnalysisGraph, configuration: CommunityConfiguration): CommunityOutput {
  const undirected = new UndirectedGraph<{ nodeType: string }, { weight: number }>();
  for (const node of graph.nodes().sort()) undirected.addNode(node, { nodeType: graph.getNodeAttribute(node, "nodeType") });
  const aggregates = new Map<string, { source: string; target: string; weight: number }>();
  for (const edge of graph.edges()) {
    const endpoints = [graph.source(edge), graph.target(edge)].sort();
    const source = endpoints[0]!;
    const target = endpoints[1]!;
    if (source === target) continue;
    const key = `${source}\u0000${target}`;
    const current = aggregates.get(key) ?? { source, target, weight: 0 };
    current.weight += graph.getEdgeAttribute(edge, "weight");
    aggregates.set(key, current);
  }
  [...aggregates.values()].sort((left, right) => `${left.source}:${left.target}`.localeCompare(`${right.source}:${right.target}`))
    .forEach((edge, index) => undirected.addUndirectedEdgeWithKey(`community-edge-${index}`, edge.source, edge.target, { weight: edge.weight }));

  const runs: CommunityOutput["runs"] = [];
  for (const resolution of configuration.resolutions) {
    for (const seed of configuration.seeds) {
      if (undirected.size === 0) {
        runs.push({ resolution, seed, modularity: 0, communityCount: undirected.order, communities: Object.fromEntries(undirected.nodes().sort().map((node, index) => [node, index])) });
        continue;
      }
      const result = louvain.detailed(undirected, { getEdgeWeight: "weight", resolution, randomWalk: true, rng: seededRandom(seed) });
      runs.push({
        resolution,
        seed,
        modularity: result.modularity,
        communityCount: result.count,
        communities: Object.fromEntries(Object.entries(result.communities).sort(([left], [right]) => left.localeCompare(right))) as Record<string, number>,
      });
    }
  }
  return { projection: "undirected-weighted", runs };
}

export function buildPartyScoreVectors(
  graph: AnalysisGraph,
  position: StoredPosition,
  partyNodeIds: string[],
  objective: string,
  horizon: string,
  uncertainty: PartyScoreVector["uncertainty"],
): PartyScoreVector[] {
  const foundation = computeFoundation(graph, { graph: normalizeGraphConfiguration({}), egoRootNodeId: null, egoMaxHops: 2 });
  const ranks = computePageRank(graph, { graph: normalizeGraphConfiguration({}), alpha: 0.85, maxIterations: 100, tolerance: 1e-6 });
  const degreeDenominator = Math.max(1, 2 * (graph.order - 1));
  return [...partyNodeIds].sort().map((partyNodeId) => {
    const node = foundation.nodes[partyNodeId];
    if (!node) throw new Error(`party Node is outside Position: ${partyNodeId}`);
    return {
      partyNodeId,
      objective,
      horizon,
      dimensions: [
        { id: "connection-exposure", label: "Connection exposure", value: node.totalDegree / degreeDenominator, unit: "ratio", interpretation: "Observed directed connection coverage within this Position scope." },
        { id: "brokerage-potential", label: "Brokerage potential", value: node.betweenness, unit: "normalized-betweenness", interpretation: "Share of selected unweighted shortest paths passing through the Node." },
        { id: "recursive-incoming-attention", label: "Recursive incoming attention", value: ranks[partyNodeId] ?? 0, unit: "pagerank-probability", interpretation: "Recursively weighted incoming edge attention under the declared graph and damping." },
      ],
      uncertainty,
      positionRef: {
        positionId: position.id,
        projectionIdentity: position.projectionIdentity,
        evidenceCutoff: position.evidenceCutoff,
        profileSnapshotId: position.profileSnapshotId,
      },
      methodRefs: ["sna.foundation@1.0.0", "sna.pagerank@1.0.0", "sna.party-structural-vector@1.0.0"],
    };
  });
}
