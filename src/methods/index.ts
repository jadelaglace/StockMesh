import { MethodRegistry } from "./registry.js";
import { communityMethod, foundationMethod, pageRankMethod, partyScoreMethod, temporalDeltaMethod } from "./builtins.js";

export function createBuiltinMethodRegistry(): MethodRegistry {
  const registry = new MethodRegistry();
  registry.register(foundationMethod);
  registry.register(pageRankMethod);
  registry.register(communityMethod);
  registry.register(temporalDeltaMethod);
  registry.register(partyScoreMethod);
  return registry;
}

export { MethodRegistry } from "./registry.js";
export { MethodRunner } from "./runner.js";
export { PositionGraphAdapter } from "./graph-adapter.js";
export type {
  CommunityOutput,
  FoundationOutput,
  PageRankOutput,
  TemporalDeltaOutput,
} from "./metrics.js";
export type * from "./types.js";
