import type { WorkbenchService } from "../workbench/service.js";
import type { WorkbenchSnapshot } from "../workbench/types.js";

export const STOCKMESH_CAPABILITIES = [
  "workbench.get",
  "context.get",
  "position.compare",
  "analysis.run",
  "branch.list",
  "branch.pin",
  "branch.fork",
  "decision.replay",
  "search.continue",
  "evidence.stage",
] as const;

export type StockMeshCapability = typeof STOCKMESH_CAPABILITIES[number];

export interface CapabilityEnvelope<Result = unknown> {
  operation: StockMeshCapability;
  status: "succeeded";
  positionId?: string;
  result: Result;
  processor: { name: "stockmesh"; version: "p5" };
}

export interface PositionDelta {
  fromPositionId: string;
  toPositionId: string;
  nodes: { added: string[]; removed: string[] };
  relations: { added: string[]; removed: string[] };
  flows: { added: string[]; removed: string[] };
  states: { added: string[]; removed: string[] };
}

export class CapabilityInputError extends Error {}

function object(value: unknown): Record<string, unknown> {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new CapabilityInputError("input must be a JSON object");
  return value as Record<string, unknown>;
}

function optionalString(input: Record<string, unknown>, name: string): string | undefined {
  const value = input[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) throw new CapabilityInputError(`${name} must be a non-empty string`);
  return value;
}

function requiredString(input: Record<string, unknown>, name: string): string {
  const value = optionalString(input, name);
  if (!value) throw new CapabilityInputError(`${name} is required`);
  return value;
}

function requiredInstant(input: Record<string, unknown>, name: string): string {
  const value = requiredString(input, name);
  if (!Number.isFinite(Date.parse(value))) throw new CapabilityInputError(`${name} must be a valid timestamp`);
  return value;
}

function delta(left: string[], right: string[]): { added: string[]; removed: string[] } {
  return {
    added: right.filter((id) => !left.includes(id)),
    removed: left.filter((id) => !right.includes(id)),
  };
}

function compare(snapshot: WorkbenchSnapshot, fromPositionId: string, toPositionId: string): PositionDelta {
  const from = snapshot.positions.find((position) => position.id === fromPositionId);
  const to = snapshot.positions.find((position) => position.id === toPositionId);
  if (!from) throw new CapabilityInputError(`Position not found: ${fromPositionId}`);
  if (!to) throw new CapabilityInputError(`Position not found: ${toPositionId}`);
  return {
    fromPositionId,
    toPositionId,
    nodes: delta(from.projection.active_node_ids, to.projection.active_node_ids),
    relations: delta(from.projection.relation_ids, to.projection.relation_ids),
    flows: delta(from.projection.flow_ids, to.projection.flow_ids),
    states: delta(from.projection.state_ids, to.projection.state_ids),
  };
}

export class StockMeshCapabilities {
  constructor(private readonly workbench: WorkbenchService) {}

  async execute(capability: string, rawInput?: unknown): Promise<CapabilityEnvelope> {
    if (!STOCKMESH_CAPABILITIES.includes(capability as StockMeshCapability)) throw new CapabilityInputError(`unsupported capability: ${capability}`);
    const operation = capability as StockMeshCapability;
    const input = object(rawInput);
    let positionId: string | undefined;
    let result: unknown;

    switch (operation) {
      case "workbench.get":
      case "context.get": {
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = snapshot;
        break;
      }
      case "position.compare": {
        const fromPositionId = requiredString(input, "fromPositionId");
        const toPositionId = requiredString(input, "toPositionId");
        result = compare(this.workbench.snapshot(toPositionId), fromPositionId, toPositionId);
        positionId = toPositionId;
        break;
      }
      case "analysis.run": {
        positionId = requiredString(input, "positionId");
        const runId = await this.workbench.analyze(positionId);
        result = { runId, snapshot: this.workbench.snapshot(positionId) };
        break;
      }
      case "branch.list": {
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = { branches: snapshot.branches, searchRuns: snapshot.searchRuns };
        break;
      }
      case "branch.pin": {
        const variationId = requiredString(input, "variationId");
        this.workbench.pin(variationId);
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = { variationId, snapshot };
        break;
      }
      case "branch.fork": {
        const variationId = requiredString(input, "variationId");
        const runId = await this.workbench.fork(variationId);
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = { variationId, runId, snapshot };
        break;
      }
      case "decision.replay": {
        const variationId = requiredString(input, "variationId");
        positionId = this.workbench.replay(variationId);
        result = { variationId, snapshot: this.workbench.snapshot(positionId) };
        break;
      }
      case "search.continue": {
        const searchRunId = requiredString(input, "searchRunId");
        await this.workbench.resume(searchRunId);
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = { searchRunId, snapshot };
        break;
      }
      case "evidence.stage": {
        const text = requiredString(input, "text");
        const observedAt = requiredInstant(input, "observedAt");
        const stageId = this.workbench.stageEvidence({ text, observedAt });
        const snapshot = this.workbench.snapshot(optionalString(input, "positionId"));
        positionId = snapshot.selectedPositionId;
        result = { stageId, staging: snapshot.staging.find((item) => item.id === stageId), snapshot };
        break;
      }
    }

    return {
      operation,
      status: "succeeded",
      ...(positionId === undefined ? {} : { positionId }),
      result,
      processor: { name: "stockmesh", version: "p5" },
    };
  }
}
