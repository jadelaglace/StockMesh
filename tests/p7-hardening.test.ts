import { describe, expect, it } from "vitest";
import { computeHardeningComponentIdentity, computeHardeningPolicyIdentity, evaluateHardeningSuite, HARDENING_METRICS, validateHardeningSuite } from "../src/hardening/index.js";
import type { ComponentIdentity, HardeningMetricName, HardeningSuite, HardeningTarget, MetricObservation } from "../src/hardening/index.js";

function hash(digit: string): string {
  return digit.repeat(64);
}

function component(id: string, digit: string): ComponentIdentity {
  return { kind: "analysis-port", id: `component-${hash(id === "baseline-analysis" ? "1" : "2")}`, version: "1.0.0", configurationIdentity: hash(digit) };
}

function observed(metric: HardeningMetricName, value: number): MetricObservation {
  const definition = HARDENING_METRICS[metric];
  return { metric, status: "observed", value, unit: definition.unit, ...(definition.humanAttributed ? { assessor: "user" as const } : {}) };
}

function suite(): HardeningSuite {
  const baseline = component("baseline-analysis", "1");
  const candidate = component("candidate-analysis", "2");
  const targets: HardeningTarget[] = [
    { metric: "latencyMs", threshold: 95, minimumMeanImprovement: 10, maximumPerScenarioRegression: 5, requiredScopes: ["synthetic"], minimumPairedScenariosPerScope: 2 },
    { metric: "contextualUsefulness", threshold: 4, minimumMeanImprovement: 1, maximumPerScenarioRegression: 0, requiredScopes: ["authorized-private"], minimumPairedScenariosPerScope: 1 },
  ];
  const establishedAt = "2026-08-22T00:00:00Z";
  const currencyCode = "CNY";
  const identity = computeHardeningPolicyIdentity({ currencyCode, baseline, candidate, establishedAt, targets });
  return {
    schema: "stockmesh.hardening-suite/v1",
    currencyCode,
    baseline,
    candidate,
    policy: { identity, establishedAt, targets },
    scenarios: [
      {
        id: `scenario-${hash("1")}`, scope: "synthetic",
        baseline: { componentIdentity: computeHardeningComponentIdentity(baseline), runIdentity: hash("1"), observedAt: "2026-08-22T01:00:00Z", metrics: [observed("latencyMs", 100)] },
        candidate: { componentIdentity: computeHardeningComponentIdentity(candidate), runIdentity: hash("2"), observedAt: "2026-08-22T01:01:00Z", metrics: [observed("latencyMs", 80)] },
      },
      {
        id: `scenario-${hash("2")}`, scope: "synthetic",
        baseline: { componentIdentity: computeHardeningComponentIdentity(baseline), runIdentity: hash("3"), observedAt: "2026-08-22T01:02:00Z", metrics: [observed("latencyMs", 110)] },
        candidate: { componentIdentity: computeHardeningComponentIdentity(candidate), runIdentity: hash("4"), observedAt: "2026-08-22T01:03:00Z", metrics: [observed("latencyMs", 90)] },
      },
      {
        id: `scenario-${hash("3")}`, scope: "authorized-private",
        baseline: { componentIdentity: computeHardeningComponentIdentity(baseline), runIdentity: hash("5"), observedAt: "2026-08-22T01:04:00Z", metrics: [observed("contextualUsefulness", 3)] },
        candidate: { componentIdentity: computeHardeningComponentIdentity(candidate), runIdentity: hash("6"), observedAt: "2026-08-22T01:05:00Z", metrics: [observed("contextualUsefulness", 4.5)] },
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("P7 measured hardening", () => {
  it("recommends replacement only when every frozen target and guard passes", () => {
    const input = suite();
    const first = evaluateHardeningSuite(input);
    const second = evaluateHardeningSuite(clone(input));
    expect(first).toEqual(second);
    expect(first.decision).toBe("replace-candidate");
    expect(first.targets).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: "latencyMs", status: "passed", requiredPairs: 2, pairedScenarios: 2, baselineMean: 105, candidateMean: 85, meanImprovement: 20, maximumObservedRegression: 0, limitation: expect.stringContaining("external validity") }),
      expect.objectContaining({ metric: "contextualUsefulness", status: "passed", pairedByScope: { "authorized-private": 1 }, meanImprovement: 1.5 }),
    ]));
    expect(first.effects).toEqual({ componentReplacements: 0, canonicalWrites: 0, possibilityWrites: 0, providerCalls: 0, packageWrites: 0 });
  });

  it("retains the baseline when complete paired evidence fails a target", () => {
    const input = suite();
    input.scenarios[0]!.candidate!.metrics = [observed("latencyMs", 106)];
    input.scenarios[1]!.candidate!.metrics = [observed("latencyMs", 54)];
    const report = evaluateHardeningSuite(input);
    expect(report.decision).toBe("retain-baseline");
    expect(report.targets.find((target) => target.metric === "latencyMs")).toMatchObject({
      status: "failed", thresholdPassed: true, improvementPassed: true, regressionPassed: false, maximumObservedRegression: 6,
    });
  });

  it("defers replacement when required human or scope evidence is not observed", () => {
    const input = suite();
    input.scenarios[2]!.candidate!.metrics = [{ metric: "contextualUsefulness", status: "not-observed" }];
    const report = evaluateHardeningSuite(input);
    expect(report.decision).toBe("defer-replacement");
    expect(report.targets.find((target) => target.metric === "contextualUsefulness")).toMatchObject({
      status: "not-observed", requiredPairs: 1, pairedScenarios: 0,
    });
    expect(report.gaps).toContain("contextualUsefulness: authorized-private has 0/1 required paired scenarios");
  });

  it("defers the current baseline when no concrete candidate is declared", () => {
    const input = suite();
    delete input.candidate;
    for (const scenario of input.scenarios) delete scenario.candidate;
    input.policy.identity = computeHardeningPolicyIdentity({
      currencyCode: input.currencyCode, baseline: input.baseline,
      establishedAt: input.policy.establishedAt, targets: input.policy.targets,
    });
    const report = evaluateHardeningSuite(input);
    expect(report.decision).toBe("defer-replacement");
    expect(report.candidate).toBeUndefined();
    expect(report.gaps).toEqual(expect.arrayContaining([
      "contextualUsefulness: candidate component is not declared",
      "latencyMs: candidate component is not declared",
    ]));
  });

  it("fails closed on body-capable fields, post-hoc policy drift, invalid metrics, and unpaired identity", () => {
    const withPrompt = clone(suite()) as unknown as Record<string, unknown>;
    (withPrompt.baseline as Record<string, unknown>).prompt = "private prompt body";
    expect(() => validateHardeningSuite(withPrompt)).toThrow("unsupported field");

    const endpointId = clone(suite());
    endpointId.baseline.id = "https://private.invalid/model";
    expect(() => validateHardeningSuite(endpointId)).toThrow("opaque component identity");

    const policyDrift = clone(suite());
    policyDrift.policy.targets[0]!.threshold = 200;
    expect(() => validateHardeningSuite(policyDrift)).toThrow("policy.identity");

    const latePolicy = clone(suite());
    latePolicy.policy.establishedAt = "2026-08-23T00:00:00Z";
    latePolicy.policy.identity = computeHardeningPolicyIdentity({
      currencyCode: latePolicy.currencyCode, baseline: latePolicy.baseline, candidate: latePolicy.candidate,
      establishedAt: latePolicy.policy.establishedAt, targets: latePolicy.policy.targets,
    });
    expect(() => validateHardeningSuite(latePolicy)).toThrow("must follow the frozen target policy");

    const missingAssessor = clone(suite());
    delete missingAssessor.scenarios[2]!.candidate!.metrics[0]!.assessor;
    expect(() => validateHardeningSuite(missingAssessor)).toThrow("assessor must be user");

    const wrongUnit = clone(suite());
    wrongUnit.scenarios[0]!.candidate!.metrics[0]!.unit = "seconds";
    expect(() => validateHardeningSuite(wrongUnit)).toThrow("unit must be milliseconds");

    const duplicateMetric = clone(suite());
    duplicateMetric.scenarios[0]!.candidate!.metrics.push(observed("latencyMs", 70));
    expect(() => validateHardeningSuite(duplicateMetric)).toThrow("metrics must be unique");

    const noCandidate = clone(suite());
    delete noCandidate.candidate;
    noCandidate.policy.identity = computeHardeningPolicyIdentity({
      currencyCode: noCandidate.currencyCode, baseline: noCandidate.baseline,
      establishedAt: noCandidate.policy.establishedAt, targets: noCandidate.policy.targets,
    });
    expect(() => validateHardeningSuite(noCandidate)).toThrow("without a candidate component");

    const reusedRun = clone(suite());
    reusedRun.scenarios[0]!.candidate!.runIdentity = reusedRun.scenarios[0]!.baseline.runIdentity;
    expect(() => validateHardeningSuite(reusedRun)).toThrow("distinct runs");

    const duplicatedRun = clone(suite());
    duplicatedRun.scenarios[1]!.baseline.runIdentity = duplicatedRun.scenarios[0]!.baseline.runIdentity;
    expect(() => validateHardeningSuite(duplicatedRun)).toThrow("unique identities");
  });

  it("binds every measurement to the exact declared component", () => {
    const swapped = suite();
    swapped.scenarios[0]!.baseline.componentIdentity = computeHardeningComponentIdentity(swapped.candidate!);
    expect(() => validateHardeningSuite(swapped)).toThrow("does not match the declared component");

    const missing = clone(suite()) as unknown as Record<string, unknown>;
    const firstScenario = (missing.scenarios as Array<Record<string, unknown>>)[0]!;
    delete (firstScenario.baseline as Record<string, unknown>).componentIdentity;
    expect(() => validateHardeningSuite(missing)).toThrow("componentIdentity");
  });

  it("requires the frozen policy to strictly precede every observation", () => {
    const input = suite();
    input.scenarios[0]!.baseline.observedAt = input.policy.establishedAt;
    expect(() => validateHardeningSuite(input)).toThrow("must follow the frozen target policy");
  });

  it("canonicalizes required scope order when computing policy identity", () => {
    const input = suite();
    const target = input.policy.targets[0]!;
    const first = computeHardeningPolicyIdentity({
      currencyCode: input.currencyCode,
      baseline: input.baseline,
      candidate: input.candidate,
      establishedAt: input.policy.establishedAt,
      targets: [{ ...target, requiredScopes: ["synthetic", "authorized-private"] }],
    });
    const second = computeHardeningPolicyIdentity({
      currencyCode: input.currencyCode,
      baseline: input.baseline,
      candidate: input.candidate,
      establishedAt: input.policy.establishedAt,
      targets: [{ ...target, requiredScopes: ["authorized-private", "synthetic"] }],
    });
    expect(first).toBe(second);
  });
});
