import { stableHash } from "../methods/identity.js";
import { HARDENING_METRICS } from "./types.js";
import type { ComponentIdentity, ComponentMeasurement, HardeningMetricName, HardeningScenario, HardeningScope, HardeningSuite, HardeningTarget, MetricObservation } from "./types.js";

export class HardeningInputError extends Error {}

function record(value: unknown, label: string, fields: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new HardeningInputError(`${label} must be an object`);
  const result = value as Record<string, unknown>;
  const unknown = Object.keys(result).find((key) => !fields.includes(key));
  if (unknown) throw new HardeningInputError(`${label} contains unsupported field: ${unknown}`);
  return result;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) throw new HardeningInputError(`${label} must be a non-empty string`);
  return value;
}

function version(value: unknown, label: string): string {
  const result = text(value, label);
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(result)) throw new HardeningInputError(`${label} must be a numeric semantic version`);
  return result;
}

function sha256(value: unknown, label: string): string {
  const result = text(value, label);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new HardeningInputError(`${label} must be a lowercase SHA-256 identity`);
  return result;
}

function opaqueId(value: unknown, label: string, namespace: string): string {
  const result = text(value, label);
  if (!new RegExp(`^${namespace}-[a-f0-9]{64}$`).test(result)) throw new HardeningInputError(`${label} must be an opaque ${namespace} identity`);
  return result;
}

function instant(value: unknown, label: string): string {
  const result = text(value, label);
  if (!Number.isFinite(Date.parse(result))) throw new HardeningInputError(`${label} must be a valid timestamp`);
  return result;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new HardeningInputError(`${label} must be a finite number`);
  return value;
}

function nonnegative(value: unknown, label: string): number {
  const result = finite(value, label);
  if (result < 0) throw new HardeningInputError(`${label} must be non-negative`);
  return result;
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new HardeningInputError(`${label} must be a positive integer`);
  return Number(value);
}

function component(value: unknown, label: string): ComponentIdentity {
  const item = record(value, label, ["kind", "id", "version", "configurationIdentity"]);
  const kinds = ["analysis-port", "method", "search-policy", "projector", "pilot-adapter"] as const;
  if (!kinds.includes(item.kind as typeof kinds[number])) throw new HardeningInputError(`${label}.kind is invalid`);
  return {
    kind: item.kind as ComponentIdentity["kind"],
    id: opaqueId(item.id, `${label}.id`, "component"),
    version: version(item.version, `${label}.version`),
    configurationIdentity: sha256(item.configurationIdentity, `${label}.configurationIdentity`),
  };
}

function metricName(value: unknown, label: string): HardeningMetricName {
  const result = text(value, label) as HardeningMetricName;
  if (!(result in HARDENING_METRICS)) throw new HardeningInputError(`${label} is not a supported hardening metric`);
  return result;
}

function scope(value: unknown, label: string): HardeningScope {
  if (value !== "synthetic" && value !== "authorized-private") throw new HardeningInputError(`${label} is invalid`);
  return value;
}

function target(value: unknown, index: number): HardeningTarget {
  const label = `policy.targets[${index}]`;
  const item = record(value, label, ["metric", "threshold", "minimumMeanImprovement", "maximumPerScenarioRegression", "requiredScopes", "minimumPairedScenariosPerScope"]);
  const metric = metricName(item.metric, `${label}.metric`);
  const definition = HARDENING_METRICS[metric];
  const threshold = finite(item.threshold, `${label}.threshold`);
  if (threshold < definition.minimum || (definition.maximum !== undefined && threshold > definition.maximum)) throw new HardeningInputError(`${label}.threshold is outside the metric range`);
  if (!Array.isArray(item.requiredScopes) || item.requiredScopes.length === 0) throw new HardeningInputError(`${label}.requiredScopes must be a non-empty array`);
  const requiredScopes = item.requiredScopes.map((entry, scopeIndex) => scope(entry, `${label}.requiredScopes[${scopeIndex}]`)).sort();
  if (new Set(requiredScopes).size !== requiredScopes.length) throw new HardeningInputError(`${label}.requiredScopes must be unique`);
  return {
    metric,
    threshold,
    minimumMeanImprovement: nonnegative(item.minimumMeanImprovement, `${label}.minimumMeanImprovement`),
    maximumPerScenarioRegression: nonnegative(item.maximumPerScenarioRegression, `${label}.maximumPerScenarioRegression`),
    requiredScopes,
    minimumPairedScenariosPerScope: positiveInteger(item.minimumPairedScenariosPerScope, `${label}.minimumPairedScenariosPerScope`),
  };
}

function observation(value: unknown, label: string): MetricObservation {
  const item = record(value, label, ["metric", "status", "value", "unit", "assessor"]);
  const metric = metricName(item.metric, `${label}.metric`);
  const definition = HARDENING_METRICS[metric];
  if (item.status === "not-observed") {
    if (item.value !== undefined || item.unit !== undefined || item.assessor !== undefined) throw new HardeningInputError(`${label} not-observed metrics cannot carry a value, unit, or assessor`);
    return { metric, status: "not-observed" };
  }
  if (item.status !== "observed") throw new HardeningInputError(`${label}.status is invalid`);
  const valueNumber = finite(item.value, `${label}.value`);
  if (valueNumber < definition.minimum || (definition.maximum !== undefined && valueNumber > definition.maximum)) throw new HardeningInputError(`${label}.value is outside the metric range`);
  if (item.unit !== definition.unit) throw new HardeningInputError(`${label}.unit must be ${definition.unit}`);
  if (definition.humanAttributed && item.assessor !== "user") throw new HardeningInputError(`${label}.assessor must be user`);
  if (!definition.humanAttributed && item.assessor !== undefined) throw new HardeningInputError(`${label} cannot carry a human assessor`);
  return { metric, status: "observed", value: valueNumber, unit: definition.unit, ...(definition.humanAttributed ? { assessor: "user" as const } : {}) };
}

function measurement(value: unknown, label: string, policyTime: number): ComponentMeasurement {
  const item = record(value, label, ["runIdentity", "observedAt", "metrics"]);
  const observedAt = instant(item.observedAt, `${label}.observedAt`);
  if (Date.parse(observedAt) < policyTime) throw new HardeningInputError(`${label} predates the frozen target policy`);
  if (!Array.isArray(item.metrics)) throw new HardeningInputError(`${label}.metrics must be an array`);
  const metrics = item.metrics.map((entry, index) => observation(entry, `${label}.metrics[${index}]`)).sort((left, right) => left.metric.localeCompare(right.metric));
  if (new Set(metrics.map((entry) => entry.metric)).size !== metrics.length) throw new HardeningInputError(`${label}.metrics must be unique`);
  return { runIdentity: sha256(item.runIdentity, `${label}.runIdentity`), observedAt, metrics };
}

export interface HardeningPolicyIdentityInput {
  currencyCode: string;
  baseline: ComponentIdentity;
  candidate?: ComponentIdentity;
  establishedAt: string;
  targets: HardeningTarget[];
}

export function computeHardeningPolicyIdentity(input: HardeningPolicyIdentityInput): string {
  return stableHash({
    currencyCode: input.currencyCode,
    baseline: input.baseline,
    candidate: input.candidate ?? null,
    establishedAt: input.establishedAt,
    targets: [...input.targets].sort((left, right) => left.metric.localeCompare(right.metric)),
  });
}

export function validateHardeningSuite(value: unknown): HardeningSuite {
  const root = record(value, "suite", ["schema", "currencyCode", "baseline", "candidate", "policy", "scenarios"]);
  if (root.schema !== "stockmesh.hardening-suite/v1") throw new HardeningInputError("unsupported hardening suite schema");
  const currencyCode = text(root.currencyCode, "currencyCode");
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new HardeningInputError("currencyCode must be an ISO-style uppercase code");
  const baseline = component(root.baseline, "baseline");
  const candidate = root.candidate === undefined ? undefined : component(root.candidate, "candidate");
  if (candidate && stableHash(candidate) === stableHash(baseline)) throw new HardeningInputError("candidate must differ from baseline");
  const policyInput = record(root.policy, "policy", ["identity", "establishedAt", "targets"]);
  const establishedAt = instant(policyInput.establishedAt, "policy.establishedAt");
  if (!Array.isArray(policyInput.targets) || policyInput.targets.length === 0) throw new HardeningInputError("policy.targets must be a non-empty array");
  const targets = policyInput.targets.map(target).sort((left, right) => left.metric.localeCompare(right.metric));
  if (new Set(targets.map((entry) => entry.metric)).size !== targets.length) throw new HardeningInputError("policy.targets must contain unique metrics");
  const policyIdentity = sha256(policyInput.identity, "policy.identity");
  const expectedPolicyIdentity = computeHardeningPolicyIdentity({ currencyCode, baseline, ...(candidate ? { candidate } : {}), establishedAt, targets });
  if (policyIdentity !== expectedPolicyIdentity) throw new HardeningInputError("policy.identity does not match the frozen component and target policy");
  if (!Array.isArray(root.scenarios) || root.scenarios.length === 0) throw new HardeningInputError("scenarios must be a non-empty array");
  const policyTime = Date.parse(establishedAt);
  const scenarios: HardeningScenario[] = root.scenarios.map((value, index) => {
    const label = `scenarios[${index}]`;
    const item = record(value, label, ["id", "scope", "baseline", "candidate"]);
    if (item.candidate !== undefined && !candidate) throw new HardeningInputError(`${label} cannot contain candidate measurements without a candidate component`);
    const baselineMeasurement = measurement(item.baseline, `${label}.baseline`, policyTime);
    const candidateMeasurement = item.candidate === undefined ? undefined : measurement(item.candidate, `${label}.candidate`, policyTime);
    if (candidateMeasurement?.runIdentity === baselineMeasurement.runIdentity) throw new HardeningInputError(`${label} baseline and candidate must use distinct runs`);
    return {
      id: opaqueId(item.id, `${label}.id`, "scenario"),
      scope: scope(item.scope, `${label}.scope`),
      baseline: baselineMeasurement,
      ...(candidateMeasurement === undefined ? {} : { candidate: candidateMeasurement }),
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
  if (new Set(scenarios.map((entry) => entry.id)).size !== scenarios.length) throw new HardeningInputError("scenarios must contain unique identities");
  const runIdentities = scenarios.flatMap((entry) => [entry.baseline.runIdentity, ...(entry.candidate ? [entry.candidate.runIdentity] : [])]);
  if (new Set(runIdentities).size !== runIdentities.length) throw new HardeningInputError("scenario component runs must contain unique identities");
  return {
    schema: "stockmesh.hardening-suite/v1",
    currencyCode,
    baseline,
    ...(candidate ? { candidate } : {}),
    policy: { identity: policyIdentity, establishedAt, targets },
    scenarios,
  };
}
