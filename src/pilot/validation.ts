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

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new PilotInputError(`${label} must be an array`);
  const result = value.map((item, index) => string(item, `${label}[${index}]`));
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
  const root = record(value, "bundle", ["schema", "authorization", "expectedRoles", "expectedSteps", "sourceRefs", "roles", "steps", "unresolvedItems", "branches", "humanRatings"]);
  if (root.schema !== "stockmesh.private-pilot-bundle/v1") throw new PilotInputError("unsupported pilot bundle schema");
  const authorization = record(root.authorization, "authorization", ["explicitlyAuthorized", "purpose", "authorizedAt", "retentionRule", "deletionRule", "publication"]);
  if (authorization.explicitlyAuthorized !== true) throw new PilotInputError("pilot must be explicitly authorized");
  if (authorization.publication !== "private-only") throw new PilotInputError("pilot publication must be private-only");
  const sourceRefs = strings(root.sourceRefs, "sourceRefs");
  if (sourceRefs.length === 0) throw new PilotInputError("sourceRefs must not be empty");
  const sourceSet = new Set(sourceRefs);
  const rolesInput = root.roles;
  if (!Array.isArray(rolesInput)) throw new PilotInputError("roles must be an array");
  const roles = rolesInput.map((value, index) => {
    const item = record(value, `roles[${index}]`, ["id", "sourceRefs", "claimCount"]);
    return { id: string(item.id, `roles[${index}].id`), sourceRefs: strings(item.sourceRefs, `roles[${index}].sourceRefs`), claimCount: count(item.claimCount, `roles[${index}].claimCount`) };
  });
  const stepsInput = root.steps;
  if (!Array.isArray(stepsInput)) throw new PilotInputError("steps must be an array");
  const steps = stepsInput.map((value, index) => {
    const item = record(value, `steps[${index}]`, ["id", "sourceRefs"]);
    return { id: string(item.id, `steps[${index}].id`), sourceRefs: strings(item.sourceRefs, `steps[${index}].sourceRefs`) };
  });
  for (const [label, identities] of [["roles", roles.map((item) => item.id)], ["steps", steps.map((item) => item.id)]] as const) {
    if (new Set(identities).size !== identities.length) throw new PilotInputError(`${label} must contain unique identities`);
  }
  const branchesInput = root.branches;
  if (!Array.isArray(branchesInput)) throw new PilotInputError("branches must be an array");
  const branches = branchesInput.map((value, index) => {
    const item = record(value, `branches[${index}]`, ["id", "sourceRefs", "purpose", "criteriaCount", "horizonDeclared", "assessment"]);
    if (item.purpose !== "forecast" && item.purpose !== "counterfactual" && item.purpose !== "exploratory") throw new PilotInputError(`branches[${index}].purpose is invalid`);
    if (typeof item.horizonDeclared !== "boolean") throw new PilotInputError(`branches[${index}].horizonDeclared must be boolean`);
    const allowedAssessments = ["matched", "partial", "diverged", "expired-unobserved", "pending", "unknown"];
    if (item.assessment !== undefined && !allowedAssessments.includes(String(item.assessment))) throw new PilotInputError(`branches[${index}].assessment is invalid`);
    if (item.purpose !== "forecast" && item.assessment !== undefined) throw new PilotInputError("only forecasts may carry realization assessments");
    return {
      id: string(item.id, `branches[${index}].id`),
      sourceRefs: strings(item.sourceRefs, `branches[${index}].sourceRefs`),
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
  const ratings = root.humanRatings === undefined ? undefined : record(root.humanRatings, "humanRatings", ["contextualUsefulness", "profileRevisionUsefulness", "userLearning"]);
  const humanRatings = ratings === undefined ? undefined : {
    ...(ratings.contextualUsefulness === undefined ? {} : { contextualUsefulness: rating(ratings.contextualUsefulness, "humanRatings.contextualUsefulness") }),
    ...(ratings.profileRevisionUsefulness === undefined ? {} : { profileRevisionUsefulness: rating(ratings.profileRevisionUsefulness, "humanRatings.profileRevisionUsefulness") }),
    ...(ratings.userLearning === undefined ? {} : { userLearning: rating(ratings.userLearning, "humanRatings.userLearning") }),
  };
  const expectedRoles = positiveCount(root.expectedRoles, "expectedRoles");
  const expectedSteps = positiveCount(root.expectedSteps, "expectedSteps");
  if (roles.length > expectedRoles) throw new PilotInputError("roles exceed the declared expectedRoles denominator");
  if (steps.length > expectedSteps) throw new PilotInputError("steps exceed the declared expectedSteps denominator");
  return {
    schema: "stockmesh.private-pilot-bundle/v1",
    authorization: {
      explicitlyAuthorized: true,
      purpose: string(authorization.purpose, "authorization.purpose"),
      authorizedAt: instant(authorization.authorizedAt, "authorization.authorizedAt"),
      retentionRule: string(authorization.retentionRule, "authorization.retentionRule"),
      deletionRule: string(authorization.deletionRule, "authorization.deletionRule"),
      publication: "private-only",
    },
    expectedRoles,
    expectedSteps,
    sourceRefs,
    roles,
    steps,
    unresolvedItems: strings(root.unresolvedItems, "unresolvedItems"),
    branches,
    ...(humanRatings === undefined ? {} : { humanRatings }),
  };
}
