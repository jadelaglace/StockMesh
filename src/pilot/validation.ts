import type { PilotHumanRating, PrivatePilotBundle } from "./types.js";

export class PilotInputError extends Error {}

function record(value: unknown, label: string, fields: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new PilotInputError(`${label} must be an object`);
  const result = value as Record<string, unknown>;
  const unknown = Object.keys(result).find((key) => !fields.includes(key));
  if (unknown) throw new PilotInputError(`${label} contains unsupported field: ${unknown}`);
  return result;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new PilotInputError(`${label} must be a non-empty string`);
  return value;
}

function opaqueId(value: unknown, label: string, namespace: string): string {
  const result = string(value, label);
  const pattern = new RegExp(`^${namespace}-[a-f0-9]{64}$`);
  if (!pattern.test(result)) throw new PilotInputError(`${label} must be an opaque ${namespace} identity`);
  return result;
}

function sha256(value: unknown, label: string): string {
  const result = string(value, label);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new PilotInputError(`${label} must be a lowercase SHA-256 identity`);
  return result;
}

function instant(value: unknown, label: string): string {
  const result = string(value, label);
  if (!Number.isFinite(Date.parse(result))) throw new PilotInputError(`${label} must be a valid timestamp`);
  return result;
}

function count(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new PilotInputError(`${label} must be a non-negative integer`);
  return Number(value);
}

function positiveCount(value: unknown, label: string): number {
  const result = count(value, label);
  if (result === 0) throw new PilotInputError(`${label} must be greater than zero`);
  return result;
}

function probability(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new PilotInputError(`${label} must be a finite number from 0 to 1`);
  return value;
}

function opaqueIds(value: unknown, label: string, namespace: string): string[] {
  if (!Array.isArray(value)) throw new PilotInputError(`${label} must be an array`);
  const result = value.map((item, index) => opaqueId(item, `${label}[${index}]`, namespace));
  if (new Set(result).size !== result.length) throw new PilotInputError(`${label} must contain unique identities`);
  return result;
}

function rating(value: unknown, label: string): PilotHumanRating {
  const item = record(value, label, ["score", "assessor", "observedAt"]);
  const score = Number(item.score);
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new PilotInputError(`${label}.score must be an integer from 1 to 5`);
  if (item.assessor !== "user") throw new PilotInputError(`${label}.assessor must be user`);
  return { score, assessor: "user", observedAt: instant(item.observedAt, `${label}.observedAt`) };
}

export function validatePrivatePilotBundle(value: unknown): PrivatePilotBundle {
  const root = record(value, "bundle", ["schema", "authorization", "coverageBasis", "preparedAt", "sourceRefs", "roles", "steps", "unresolvedItems", "branches", "calibrationSamples", "humanRatings"]);
  if (root.schema !== "stockmesh.private-pilot-bundle/v2") throw new PilotInputError("unsupported pilot bundle schema");
  const authorization = record(root.authorization, "authorization", ["explicitlyAuthorized", "purposeRef", "authorizedAt", "retentionPolicyRef", "deletionPolicyRef", "publication"]);
  if (authorization.explicitlyAuthorized !== true) throw new PilotInputError("pilot must be explicitly authorized");
  if (authorization.publication !== "private-only") throw new PilotInputError("pilot publication must be private-only");
  const authorizedAt = instant(authorization.authorizedAt, "authorization.authorizedAt");
  const coverageInput = record(root.coverageBasis, "coverageBasis", ["identity", "authority", "establishedAt", "expectedRoles", "expectedSteps"]);
  if (coverageInput.authority !== "authorized-source-inventory") throw new PilotInputError("coverageBasis.authority must be authorized-source-inventory");
  const establishedAt = instant(coverageInput.establishedAt, "coverageBasis.establishedAt");
  const preparedAt = instant(root.preparedAt, "preparedAt");
  if (Date.parse(authorizedAt) > Date.parse(establishedAt) || Date.parse(establishedAt) > Date.parse(preparedAt)) {
    throw new PilotInputError("authorization and coverage basis must precede private preparation");
  }
  const coverageBasis = {
    identity: sha256(coverageInput.identity, "coverageBasis.identity"),
    authority: "authorized-source-inventory" as const,
    establishedAt,
    expectedRoles: positiveCount(coverageInput.expectedRoles, "coverageBasis.expectedRoles"),
    expectedSteps: positiveCount(coverageInput.expectedSteps, "coverageBasis.expectedSteps"),
  };
  const sourceRefs = opaqueIds(root.sourceRefs, "sourceRefs", "source");
  if (sourceRefs.length === 0) throw new PilotInputError("sourceRefs must not be empty");
  const sourceSet = new Set(sourceRefs);
  if (!Array.isArray(root.roles)) throw new PilotInputError("roles must be an array");
  const roles = root.roles.map((value, index) => {
    const item = record(value, `roles[${index}]`, ["id", "sourceRefs", "claimCount"]);
    return { id: opaqueId(item.id, `roles[${index}].id`, "role"), sourceRefs: opaqueIds(item.sourceRefs, `roles[${index}].sourceRefs`, "source"), claimCount: count(item.claimCount, `roles[${index}].claimCount`) };
  });
  if (!Array.isArray(root.steps)) throw new PilotInputError("steps must be an array");
  const steps = root.steps.map((value, index) => {
    const item = record(value, `steps[${index}]`, ["id", "sourceRefs"]);
    return { id: opaqueId(item.id, `steps[${index}].id`, "step"), sourceRefs: opaqueIds(item.sourceRefs, `steps[${index}].sourceRefs`, "source") };
  });
  for (const [label, identities] of [["roles", roles.map((item) => item.id)], ["steps", steps.map((item) => item.id)]] as const) {
    if (new Set(identities).size !== identities.length) throw new PilotInputError(`${label} must contain unique identities`);
  }
  if (!Array.isArray(root.branches)) throw new PilotInputError("branches must be an array");
  const branches = root.branches.map((value, index) => {
    const item = record(value, `branches[${index}]`, ["id", "sourceRefs", "purpose", "criteriaCount", "horizonDeclared", "assessment"]);
    if (item.purpose !== "forecast" && item.purpose !== "counterfactual" && item.purpose !== "exploratory") throw new PilotInputError(`branches[${index}].purpose is invalid`);
    if (typeof item.horizonDeclared !== "boolean") throw new PilotInputError(`branches[${index}].horizonDeclared must be boolean`);
    const allowedAssessments = ["matched", "partial", "diverged", "expired-unobserved", "pending", "unknown"];
    if (item.assessment !== undefined && !allowedAssessments.includes(String(item.assessment))) throw new PilotInputError(`branches[${index}].assessment is invalid`);
    if (item.purpose !== "forecast" && item.assessment !== undefined) throw new PilotInputError("only forecasts may carry realization assessments");
    return {
      id: opaqueId(item.id, `branches[${index}].id`, "branch"),
      sourceRefs: opaqueIds(item.sourceRefs, `branches[${index}].sourceRefs`, "source"),
      purpose: item.purpose as PrivatePilotBundle["branches"][number]["purpose"],
      criteriaCount: count(item.criteriaCount, `branches[${index}].criteriaCount`),
      horizonDeclared: item.horizonDeclared,
      ...(item.assessment === undefined ? {} : { assessment: item.assessment as NonNullable<PrivatePilotBundle["branches"][number]["assessment"]> }),
    };
  });
  for (const reference of [...roles.flatMap((item) => item.sourceRefs), ...steps.flatMap((item) => item.sourceRefs), ...branches.flatMap((item) => item.sourceRefs)]) {
    if (!sourceSet.has(reference)) throw new PilotInputError("pilot contains an unresolved source reference");
  }
  if (new Set(branches.map((item) => item.id)).size !== branches.length) throw new PilotInputError("branches must contain unique identities");
  if (roles.length > coverageBasis.expectedRoles) throw new PilotInputError("roles exceed the frozen coverage-basis denominator");
  if (steps.length > coverageBasis.expectedSteps) throw new PilotInputError("steps exceed the frozen coverage-basis denominator");
  const forecasts = new Map(branches.filter((item) => item.purpose === "forecast").map((item) => [item.id, item]));
  const calibrationInput = root.calibrationSamples ?? [];
  if (!Array.isArray(calibrationInput)) throw new PilotInputError("calibrationSamples must be an array");
  const calibrationSamples: NonNullable<PrivatePilotBundle["calibrationSamples"]> = calibrationInput.map((value, index) => {
    const item = record(value, `calibrationSamples[${index}]`, ["id", "forecastId", "criterionId", "assessmentId", "predictedProbability", "observedOutcome"]);
    const forecastId = opaqueId(item.forecastId, `calibrationSamples[${index}].forecastId`, "branch");
    const forecast = forecasts.get(forecastId);
    if (!forecast) throw new PilotInputError("calibration samples must reference a forecast branch");
    if (forecast.criteriaCount === 0 || !forecast.horizonDeclared || forecast.assessment === undefined || forecast.assessment === "pending" || forecast.assessment === "unknown") {
      throw new PilotInputError("calibration samples require a scorable forecast with a terminal assessment");
    }
    if (item.observedOutcome !== 0 && item.observedOutcome !== 1) throw new PilotInputError(`calibrationSamples[${index}].observedOutcome must be 0 or 1`);
    return {
      id: opaqueId(item.id, `calibrationSamples[${index}].id`, "sample"),
      forecastId,
      criterionId: opaqueId(item.criterionId, `calibrationSamples[${index}].criterionId`, "criterion"),
      assessmentId: opaqueId(item.assessmentId, `calibrationSamples[${index}].assessmentId`, "assessment"),
      predictedProbability: probability(item.predictedProbability, `calibrationSamples[${index}].predictedProbability`),
      observedOutcome: item.observedOutcome,
    };
  });
  if (new Set(calibrationSamples.map((item) => item.id)).size !== calibrationSamples.length) throw new PilotInputError("calibrationSamples must contain unique identities");
  if (new Set(calibrationSamples.map((item) => `${item.forecastId}:${item.criterionId}`)).size !== calibrationSamples.length) throw new PilotInputError("calibrationSamples must contain unique forecast criteria");
  const ratings = root.humanRatings === undefined ? undefined : record(root.humanRatings, "humanRatings", ["contextualUsefulness", "profileRevisionUsefulness", "userLearning"]);
  const humanRatings = ratings === undefined ? undefined : {
    ...(ratings.contextualUsefulness === undefined ? {} : { contextualUsefulness: rating(ratings.contextualUsefulness, "humanRatings.contextualUsefulness") }),
    ...(ratings.profileRevisionUsefulness === undefined ? {} : { profileRevisionUsefulness: rating(ratings.profileRevisionUsefulness, "humanRatings.profileRevisionUsefulness") }),
    ...(ratings.userLearning === undefined ? {} : { userLearning: rating(ratings.userLearning, "humanRatings.userLearning") }),
  };
  return {
    schema: "stockmesh.private-pilot-bundle/v2",
    authorization: {
      explicitlyAuthorized: true,
      purposeRef: opaqueId(authorization.purposeRef, "authorization.purposeRef", "purpose"),
      authorizedAt,
      retentionPolicyRef: opaqueId(authorization.retentionPolicyRef, "authorization.retentionPolicyRef", "retention"),
      deletionPolicyRef: opaqueId(authorization.deletionPolicyRef, "authorization.deletionPolicyRef", "deletion"),
      publication: "private-only",
    },
    coverageBasis,
    preparedAt,
    sourceRefs,
    roles,
    steps,
    unresolvedItems: opaqueIds(root.unresolvedItems, "unresolvedItems", "issue"),
    branches,
    ...(calibrationSamples.length === 0 ? {} : { calibrationSamples }),
    ...(humanRatings === undefined ? {} : { humanRatings }),
  };
}
