import { describe, expect, it } from "vitest";
import { evaluatePrivatePilot, validatePrivatePilotBundle } from "../src/pilot/index.js";

function opaque(namespace: string, digit: string): string {
  return `${namespace}-${digit.repeat(64)}`;
}

const ids = {
  purpose: opaque("purpose", "1"), retention: opaque("retention", "2"), deletion: opaque("deletion", "3"),
  source1: opaque("source", "1"), source2: opaque("source", "2"), source3: opaque("source", "3"), missingSource: opaque("source", "4"),
  role1: opaque("role", "1"), role2: opaque("role", "2"), step1: opaque("step", "1"), step2: opaque("step", "2"),
  forecast: opaque("branch", "1"), exploratory: opaque("branch", "2"), issue: opaque("issue", "1"),
  sample1: opaque("sample", "1"), sample2: opaque("sample", "2"), criterion1: opaque("criterion", "1"), criterion2: opaque("criterion", "2"), assessment: opaque("assessment", "1"),
};

function bundle(): Record<string, unknown> {
  return {
    schema: "stockmesh.private-pilot-bundle/v2",
    authorization: {
      explicitlyAuthorized: true,
      purposeRef: ids.purpose,
      authorizedAt: "2026-08-22T00:00:00Z",
      retentionPolicyRef: ids.retention,
      deletionPolicyRef: ids.deletion,
      publication: "private-only",
    },
    coverageBasis: {
      identity: "a".repeat(64),
      authority: "authorized-source-inventory",
      establishedAt: "2026-08-22T00:10:00Z",
      expectedRoles: 3,
      expectedSteps: 3,
    },
    preparedAt: "2026-08-22T00:20:00Z",
    sourceRefs: [ids.source1, ids.source2, ids.source3],
    roles: [
      { id: ids.role1, sourceRefs: [ids.source1], claimCount: 2 },
      { id: ids.role2, sourceRefs: [ids.source2], claimCount: 0 },
    ],
    steps: [
      { id: ids.step1, sourceRefs: [ids.source1, ids.source2] },
      { id: ids.step2, sourceRefs: [ids.source3] },
    ],
    unresolvedItems: [ids.issue],
    branches: [
      { id: ids.forecast, sourceRefs: [ids.source1], purpose: "forecast", criteriaCount: 2, horizonDeclared: true, assessment: "diverged" },
      { id: ids.exploratory, sourceRefs: [ids.source2], purpose: "exploratory", criteriaCount: 0, horizonDeclared: false },
    ],
  };
}

describe("P6 private pilot evaluator", () => {
  it("separates assessment coverage from criterion-level calibration", () => {
    const first = evaluatePrivatePilot(bundle());
    const second = evaluatePrivatePilot(bundle());

    expect(first).toEqual(second);
    expect(first.schema).toBe("stockmesh.private-pilot-report/v2");
    expect(first.privacy).toEqual({ bodyFree: true, privateOnly: true, canonicalWrites: 0, possibilityWrites: 0 });
    expect(first.metrics.sourceReferenceClosure).toMatchObject({ status: "observed", numerator: 7, denominator: 7, value: 1 });
    expect(first.metrics.preparedStepCoverage).toMatchObject({ numerator: 2, denominator: 3, value: 2 / 3 });
    expect(first.metrics.preparedRoleCoverage).toMatchObject({ numerator: 1, denominator: 3, value: 1 / 3 });
    expect(first.metrics.unresolvedItemDensity).toMatchObject({ numerator: 1, denominator: 2, unit: "unresolved-items-per-prepared-step" });
    expect(first.metrics.forecastScorableCoverage).toMatchObject({ numerator: 1, denominator: 1, value: 1 });
    expect(first.metrics.forecastAssessmentCoverage).toMatchObject({ numerator: 1, denominator: 1, value: 1 });
    expect(first.metrics.forecastCalibration.status).toBe("not-observed");

    const calibrated = bundle();
    calibrated.calibrationSamples = [
      { id: ids.sample1, forecastId: ids.forecast, criterionId: ids.criterion1, assessmentId: ids.assessment, predictedProbability: 0.9, observedOutcome: 1 },
      { id: ids.sample2, forecastId: ids.forecast, criterionId: ids.criterion2, assessmentId: ids.assessment, predictedProbability: 0.8, observedOutcome: 0 },
    ];
    const calibration = evaluatePrivatePilot(calibrated).metrics.forecastCalibration;
    expect(calibration).toMatchObject({ status: "observed", denominator: 2, unit: "brier-score-0-best" });
    expect(calibration.value).toBeCloseTo(0.325);
  });

  it("keeps human outcomes not-observed until an attributed rating exists", () => {
    const result = evaluatePrivatePilot(bundle());
    expect(result.metrics.contextualUsefulness.status).toBe("not-observed");
    expect(result.metrics.profileRevisionUsefulness.status).toBe("not-observed");
    expect(result.metrics.userLearning.status).toBe("not-observed");

    const rated = bundle();
    rated.humanRatings = { contextualUsefulness: { score: 4, assessor: "user", observedAt: "2026-08-22T01:00:00Z" } };
    expect(evaluatePrivatePilot(rated).metrics.contextualUsefulness).toMatchObject({ status: "observed", value: 4, denominator: 5 });
  });

  it("rejects bodies, locators, credentials, dangling sources, and ineligible assessments", () => {
    const mutations: Array<[string, (candidate: Record<string, unknown>) => void]> = [
      ["root body", (candidate) => { candidate.text = "must not enter"; }],
      ["locator as source identity", (candidate) => { candidate.sourceRefs = ["https://example.invalid/private"]; }],
      ["free-text purpose", (candidate) => { (candidate.authorization as Record<string, unknown>).purposeRef = "raw dossier text"; }],
      ["credential-like policy", (candidate) => { (candidate.authorization as Record<string, unknown>).retentionPolicyRef = "ghp_secret"; }],
      ["free-text unresolved body", (candidate) => { candidate.unresolvedItems = ["a person said something private"]; }],
    ];
    for (const [, mutate] of mutations) {
      const candidate = bundle();
      mutate(candidate);
      expect(() => validatePrivatePilotBundle(candidate)).toThrow();
    }

    const unauthorized = bundle();
    (unauthorized.authorization as Record<string, unknown>).explicitlyAuthorized = false;
    expect(() => validatePrivatePilotBundle(unauthorized)).toThrow("explicitly authorized");

    const dangling = bundle();
    dangling.steps = [{ id: ids.step1, sourceRefs: [ids.missingSource] }];
    expect(() => validatePrivatePilotBundle(dangling)).toThrow("unresolved source reference");

    const assessedCounterfactual = bundle();
    assessedCounterfactual.branches = [{ id: ids.forecast, sourceRefs: [ids.source1], purpose: "counterfactual", criteriaCount: 1, horizonDeclared: true, assessment: "diverged" }];
    expect(() => validatePrivatePilotBundle(assessedCounterfactual)).toThrow("only forecasts");
  });

  it("requires a pre-preparation coverage basis and eligible calibration samples", () => {
    const lateBasis = bundle();
    (lateBasis.coverageBasis as Record<string, unknown>).establishedAt = "2026-08-23T00:00:00Z";
    expect(() => validatePrivatePilotBundle(lateBasis)).toThrow("precede private preparation");

    const invalidDenominator = bundle();
    (invalidDenominator.coverageBasis as Record<string, unknown>).expectedSteps = 1;
    expect(() => validatePrivatePilotBundle(invalidDenominator)).toThrow("coverage-basis denominator");

    const exploratorySample = bundle();
    exploratorySample.calibrationSamples = [{ id: ids.sample1, forecastId: ids.exploratory, criterionId: ids.criterion1, assessmentId: ids.assessment, predictedProbability: 0.5, observedOutcome: 1 }];
    expect(() => validatePrivatePilotBundle(exploratorySample)).toThrow("forecast branch");
  });
});
