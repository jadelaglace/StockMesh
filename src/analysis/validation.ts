import { ANALYSIS_PROPOSAL_SCHEMA } from "./types.js";
import type {
  AnalysisCandidate,
  AnalysisProposal,
  AnalysisResult,
  EvaluationProposal,
  SearchBudget,
} from "./types.js";

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${path} must be a non-empty string`);
  return value;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} must be a finite number`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => string(item, `${path}[${index}]`));
}

function uncertainty(value: unknown, path: string): { level: "low" | "medium" | "high"; basis: string[] } {
  const item = record(value, path);
  if (item.level !== "low" && item.level !== "medium" && item.level !== "high") throw new Error(`${path}.level is invalid`);
  return { level: item.level, basis: stringArray(item.basis, `${path}.basis`) };
}

function projection(value: unknown, path: string): AnalysisCandidate["resultingProjection"] {
  const item = record(value, path);
  const result = {
    active_node_ids: stringArray(item.active_node_ids, `${path}.active_node_ids`),
    relation_ids: stringArray(item.relation_ids, `${path}.relation_ids`),
    flow_ids: stringArray(item.flow_ids, `${path}.flow_ids`),
    state_ids: stringArray(item.state_ids, `${path}.state_ids`),
  };
  for (const [key, values] of Object.entries(result)) {
    if (new Set(values).size !== values.length) throw new Error(`${path}.${key} contains duplicate identities`);
  }
  return result;
}

function evaluation(value: unknown, path: string): EvaluationProposal {
  const item = record(value, path);
  if (!Array.isArray(item.partyScorecards) || item.partyScorecards.length === 0) throw new Error(`${path}.partyScorecards must not be empty`);
  const partyScorecards = item.partyScorecards.map((raw, partyIndex) => {
    const party = record(raw, `${path}.partyScorecards[${partyIndex}]`);
    if (!Array.isArray(party.dimensions) || party.dimensions.length === 0) throw new Error(`${path}.partyScorecards[${partyIndex}].dimensions must not be empty`);
    return {
      partyNodeId: string(party.partyNodeId, `${path}.partyScorecards[${partyIndex}].partyNodeId`),
      objective: string(party.objective, `${path}.partyScorecards[${partyIndex}].objective`),
      dimensions: party.dimensions.map((rawDimension, dimensionIndex) => {
        const dimension = record(rawDimension, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}]`);
        return {
          id: string(dimension.id, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}].id`),
          label: string(dimension.label, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}].label`),
          value: finiteNumber(dimension.value, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}].value`),
          unit: string(dimension.unit, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}].unit`),
          interpretation: string(dimension.interpretation, `${path}.partyScorecards[${partyIndex}].dimensions[${dimensionIndex}].interpretation`),
        };
      }),
      uncertainty: uncertainty(party.uncertainty, `${path}.partyScorecards[${partyIndex}].uncertainty`),
      methodRefs: stringArray(party.methodRefs, `${path}.partyScorecards[${partyIndex}].methodRefs`),
    };
  });
  if (new Set(partyScorecards.map((item) => item.partyNodeId)).size !== partyScorecards.length) throw new Error(`${path}.partyScorecards contains duplicate parties`);
  return {
    riskPolicy: string(item.riskPolicy, `${path}.riskPolicy`),
    evaluationProfile: string(item.evaluationProfile, `${path}.evaluationProfile`),
    partyScorecards,
    uncertainty: uncertainty(item.uncertainty, `${path}.uncertainty`),
  };
}

function candidate(value: unknown, path: string): AnalysisCandidate {
  const item = record(value, path);
  if (item.purpose !== "forecast" && item.purpose !== "counterfactual" && item.purpose !== "exploratory") throw new Error(`${path}.purpose is invalid`);
  const priority = finiteNumber(item.priority, `${path}.priority`);
  if (priority < 0 || priority > 1) throw new Error(`${path}.priority must be between 0 and 1`);
  return {
    key: string(item.key, `${path}.key`),
    purpose: item.purpose,
    title: string(item.title, `${path}.title`),
    action: string(item.action, `${path}.action`),
    modeledResponse: string(item.modeledResponse, `${path}.modeledResponse`),
    resultingProjection: projection(item.resultingProjection, `${path}.resultingProjection`),
    evaluation: evaluation(item.evaluation, `${path}.evaluation`),
    assumptions: stringArray(item.assumptions, `${path}.assumptions`),
    uncertainty: uncertainty(item.uncertainty, `${path}.uncertainty`),
    replanTrigger: string(item.replanTrigger, `${path}.replanTrigger`),
    horizon: string(item.horizon, `${path}.horizon`),
    priority,
  };
}

export function validateAnalysisProposal(value: unknown): AnalysisProposal {
  const item = record(value, "proposal");
  if (item.schema !== ANALYSIS_PROPOSAL_SCHEMA) throw new Error(`proposal.schema must be ${ANALYSIS_PROPOSAL_SCHEMA}`);
  if (!Array.isArray(item.candidates)) throw new Error("proposal.candidates must be an array");
  const candidates = item.candidates.map((raw, index) => candidate(raw, `proposal.candidates[${index}]`));
  if (new Set(candidates.map((item) => item.key)).size !== candidates.length) throw new Error("proposal candidate keys must be unique");
  return { schema: ANALYSIS_PROPOSAL_SCHEMA, summary: string(item.summary, "proposal.summary"), candidates };
}

export function validateAnalysisResult(value: unknown): AnalysisResult {
  const item = record(value, "analysis result");
  const usage = record(item.usage, "analysis result.usage");
  const tokens = finiteNumber(usage.tokens, "analysis result.usage.tokens");
  const cost = finiteNumber(usage.cost, "analysis result.usage.cost");
  if (!Number.isInteger(tokens) || tokens < 0 || cost < 0) throw new Error("analysis usage cannot be negative or fractional tokens");
  return { proposal: validateAnalysisProposal(item.proposal), usage: { tokens, cost } };
}

export function validateSearchBudget(budget: SearchBudget): SearchBudget {
  const entries = Object.entries(budget);
  if (entries.length === 0) throw new Error("at least one finite search budget is required");
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a finite non-negative number`);
    if (key !== "maxCost" && !Number.isInteger(value)) throw new Error(`${key} must be an integer`);
  }
  if (!entries.some(([, value]) => value !== undefined)) throw new Error("at least one finite search budget is required");
  return { ...budget };
}

export const analysisProposalJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["schema", "summary", "candidates"],
  properties: {
    schema: { const: ANALYSIS_PROPOSAL_SCHEMA },
    summary: { type: "string", minLength: 1 },
    candidates: { type: "array", items: { $ref: "#/$defs/candidate" } },
  },
  $defs: {
    stringArray: { type: "array", items: { type: "string", minLength: 1 } },
    uncertainty: {
      type: "object",
      additionalProperties: false,
      required: ["level", "basis"],
      properties: {
        level: { type: "string", enum: ["low", "medium", "high"] },
        basis: { $ref: "#/$defs/stringArray" },
      },
    },
    projection: {
      type: "object",
      additionalProperties: false,
      required: ["active_node_ids", "relation_ids", "flow_ids", "state_ids"],
      properties: {
        active_node_ids: { $ref: "#/$defs/stringArray" },
        relation_ids: { $ref: "#/$defs/stringArray" },
        flow_ids: { $ref: "#/$defs/stringArray" },
        state_ids: { $ref: "#/$defs/stringArray" },
      },
    },
    dimension: {
      type: "object",
      additionalProperties: false,
      required: ["id", "label", "value", "unit", "interpretation"],
      properties: {
        id: { type: "string", minLength: 1 },
        label: { type: "string", minLength: 1 },
        value: { type: "number" },
        unit: { type: "string", minLength: 1 },
        interpretation: { type: "string", minLength: 1 },
      },
    },
    partyScorecard: {
      type: "object",
      additionalProperties: false,
      required: ["partyNodeId", "objective", "dimensions", "uncertainty", "methodRefs"],
      properties: {
        partyNodeId: { type: "string", minLength: 1 },
        objective: { type: "string", minLength: 1 },
        dimensions: { type: "array", minItems: 1, items: { $ref: "#/$defs/dimension" } },
        uncertainty: { $ref: "#/$defs/uncertainty" },
        methodRefs: { $ref: "#/$defs/stringArray" },
      },
    },
    evaluation: {
      type: "object",
      additionalProperties: false,
      required: ["riskPolicy", "evaluationProfile", "partyScorecards", "uncertainty"],
      properties: {
        riskPolicy: { type: "string", minLength: 1 },
        evaluationProfile: { type: "string", minLength: 1 },
        partyScorecards: { type: "array", minItems: 1, items: { $ref: "#/$defs/partyScorecard" } },
        uncertainty: { $ref: "#/$defs/uncertainty" },
      },
    },
    candidate: {
      type: "object",
      additionalProperties: false,
      required: [
        "key", "purpose", "title", "action", "modeledResponse",
        "resultingProjection", "evaluation", "assumptions", "uncertainty",
        "replanTrigger", "horizon", "priority"
      ],
      properties: {
        key: { type: "string", minLength: 1 },
        purpose: { type: "string", enum: ["forecast", "counterfactual", "exploratory"] },
        title: { type: "string", minLength: 1 },
        action: { type: "string", minLength: 1 },
        modeledResponse: { type: "string", minLength: 1 },
        resultingProjection: { $ref: "#/$defs/projection" },
        evaluation: { $ref: "#/$defs/evaluation" },
        assumptions: { $ref: "#/$defs/stringArray" },
        uncertainty: { $ref: "#/$defs/uncertainty" },
        replanTrigger: { type: "string", minLength: 1 },
        horizon: { type: "string", minLength: 1 },
        priority: { type: "number", minimum: 0, maximum: 1 },
      },
    },
  },
} as const;
