import { describe, expect, it } from "vitest";
import { evaluatePrivatePilot, validatePrivatePilotBundle } from "../src/pilot/index.js";

function bundle(): Record<string, unknown> {
  return {
    schema: "stockmesh.private-pilot-bundle/v1",
    authorization: {
      explicitlyAuthorized: true,
      purpose: "Synthetic private-pilot contract test",
      authorizedAt: "2026-08-22T00:00:00Z",
      retentionRule: "Retain only for the test run",
      deletionRule: "Delete after verification",
      publication: "private-only",
    },
    expectedRoles: 3,
    expectedSteps: 3,
    sourceRefs: ["source-1", "source-2", "source-3"],
    roles: [
      { id: "role-1", sourceRefs: ["source-1"], claimCount: 2 },
      { id: "role-2", sourceRefs: ["source-2"], claimCount: 0 },
    ],
    steps: [
      { id: "step-1", sourceRefs: ["source-1", "source-2"] },
      { id: "step-2", sourceRefs: ["source-3"] },
    ],
    unresolvedItems: ["unresolved-1"],
    branches: [
      { id: "forecast-1", sourceRefs: ["source-1"], purpose: "forecast", criteriaCount: 2, horizonDeclared: true, assessment: "matched" },
      { id: "branch-2", sourceRefs: ["source-2"], purpose: "exploratory", criteriaCount: 0, horizonDeclared: false },
    ],
  };
}

describe("P6 private pilot evaluator", () => {
  it("produces deterministic transparent measurements without claiming human outcomes", () => {
    const first = evaluatePrivatePilot(bundle());
    const second = evaluatePrivatePilot(bundle());

    expect(first).toEqual(second);
    expect(first.privacy).toEqual({ bodyFree: true, privateOnly: true, canonicalWrites: 0, possibilityWrites: 0 });
    expect(first.metrics.sourceReferenceIntegrity).toMatchObject({ status: "observed", numerator: 7, denominator: 7, value: 1 });
    expect(first.metrics.reconstructionCoverage).toMatchObject({ numerator: 2, denominator: 3, value: 2 / 3 });
    expect(first.metrics.profileCoverage).toMatchObject({ numerator: 1, denominator: 3, value: 1 / 3 });
    expect(first.metrics.correctionBurden).toMatchObject({ numerator: 1, denominator: 2, unit: "unresolved-items-per-step" });
    expect(first.metrics.forecastSpecificity).toMatchObject({ numerator: 1, denominator: 1, value: 1 });
    expect(first.metrics.forecastCalibration).toMatchObject({ numerator: 1, denominator: 1, value: 1 });
    expect(first.metrics.contextualUsefulness.status).toBe("not-observed");
    expect(first.metrics.profileRevisionUsefulness.status).toBe("not-observed");
    expect(first.metrics.userLearning.status).toBe("not-observed");
    expect(first.gaps).toEqual(["contextualUsefulness", "profileRevisionUsefulness", "userLearning"]);
    expect(JSON.stringify(first)).not.toContain("Synthetic private-pilot contract test");

    const rated = bundle();
    rated.humanRatings = { contextualUsefulness: { score: 4, assessor: "user", observedAt: "2026-08-22T01:00:00Z" } };
    expect(evaluatePrivatePilot(rated).metrics.contextualUsefulness).toMatchObject({ status: "observed", value: 4, denominator: 5 });
  });

  it("fails closed on bodies, missing authorization, dangling sources, and ineligible assessments", () => {
    const withBody = { ...bundle(), text: "must not enter the body-free contract" };
    expect(() => validatePrivatePilotBundle(withBody)).toThrow("unsupported field");

    const unauthorized = bundle();
    unauthorized.authorization = { ...(unauthorized.authorization as object), explicitlyAuthorized: false };
    expect(() => validatePrivatePilotBundle(unauthorized)).toThrow("explicitly authorized");

    const dangling = bundle();
    dangling.steps = [{ id: "step-1", sourceRefs: ["missing-source"] }];
    expect(() => validatePrivatePilotBundle(dangling)).toThrow("unresolved source reference");

    const assessedCounterfactual = bundle();
    assessedCounterfactual.branches = [{ id: "branch-1", sourceRefs: ["source-1"], purpose: "counterfactual", criteriaCount: 1, horizonDeclared: true, assessment: "diverged" }];
    expect(() => validatePrivatePilotBundle(assessedCounterfactual)).toThrow("only forecasts");

    const invalidDenominator = bundle();
    invalidDenominator.expectedSteps = 1;
    expect(() => validatePrivatePilotBundle(invalidDenominator)).toThrow("exceed");
  });
});
