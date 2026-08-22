import { stableHash } from "../methods/identity.js";
import { HARDENING_METRICS } from "./types.js";
import type { HardeningMetricName, HardeningReport, HardeningScenario, HardeningTarget, MetricObservation, TargetResult } from "./types.js";
import { validateHardeningSuite } from "./validation.js";

function observed(scenario: HardeningScenario, side: "baseline" | "candidate", metric: HardeningMetricName): MetricObservation | undefined {
  return scenario[side]?.metrics.find((entry) => entry.metric === metric && entry.status === "observed");
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evaluateTarget(target: HardeningTarget, scenarios: HardeningScenario[], hasCandidate: boolean): TargetResult {
  const definition = HARDENING_METRICS[target.metric];
  const requiredPairs = target.requiredScopes.length * target.minimumPairedScenariosPerScope;
  const blockers: string[] = [];
  const pairedByScope: TargetResult["pairedByScope"] = {};
  const pairs: Array<{ baseline: number; candidate: number }> = [];

  if (!hasCandidate) blockers.push("candidate component is not declared");
  for (const requiredScope of target.requiredScopes) {
    const scoped = scenarios.filter((scenario) => scenario.scope === requiredScope);
    const scopedPairs = scoped.flatMap((scenario) => {
      const baseline = observed(scenario, "baseline", target.metric)?.value;
      const candidate = observed(scenario, "candidate", target.metric)?.value;
      return baseline === undefined || candidate === undefined ? [] : [{ baseline, candidate }];
    });
    pairedByScope[requiredScope] = scopedPairs.length;
    pairs.push(...scopedPairs);
    if (scopedPairs.length < target.minimumPairedScenariosPerScope) {
      blockers.push(`${requiredScope} has ${scopedPairs.length}/${target.minimumPairedScenariosPerScope} required paired scenarios`);
    }
  }

  const base: TargetResult = {
    metric: target.metric,
    status: "not-observed",
    direction: definition.direction,
    unit: definition.unit,
    requiredPairs,
    pairedScenarios: pairs.length,
    pairedByScope,
    limitation: definition.humanAttributed
      ? "Mean over paired attributed user ratings; it is not a population estimate or proof of product acceptance."
      : "Mean over declared paired scenario measurements; the evaluator does not prove source truth, scenario equivalence, or external validity.",
    blockers,
  };
  if (blockers.length > 0) return base;

  const baselineMean = mean(pairs.map((pair) => pair.baseline));
  const candidateMean = mean(pairs.map((pair) => pair.candidate));
  const improvements = pairs.map((pair) => definition.direction === "higher-is-better" ? pair.candidate - pair.baseline : pair.baseline - pair.candidate);
  const meanImprovement = mean(improvements);
  const maximumObservedRegression = Math.max(0, ...improvements.map((improvement) => -improvement));
  const thresholdPassed = definition.direction === "higher-is-better" ? candidateMean >= target.threshold : candidateMean <= target.threshold;
  const improvementPassed = meanImprovement >= target.minimumMeanImprovement;
  const regressionPassed = maximumObservedRegression <= target.maximumPerScenarioRegression;
  if (!thresholdPassed) blockers.push(`candidate mean misses threshold ${target.threshold}`);
  if (!improvementPassed) blockers.push(`mean improvement misses minimum ${target.minimumMeanImprovement}`);
  if (!regressionPassed) blockers.push(`per-scenario regression exceeds maximum ${target.maximumPerScenarioRegression}`);
  return {
    ...base,
    status: blockers.length === 0 ? "passed" : "failed",
    baselineMean,
    candidateMean,
    meanImprovement,
    maximumObservedRegression,
    thresholdPassed,
    improvementPassed,
    regressionPassed,
  };
}

export function evaluateHardeningSuite(input: unknown): HardeningReport {
  const suite = validateHardeningSuite(input);
  const targets = suite.policy.targets.map((target) => evaluateTarget(target, suite.scenarios, suite.candidate !== undefined));
  const decision = targets.some((target) => target.status === "not-observed")
    ? "defer-replacement"
    : targets.some((target) => target.status === "failed")
      ? "retain-baseline"
      : "replace-candidate";
  const gaps = targets.flatMap((target) => target.blockers.map((blocker) => `${target.metric}: ${blocker}`)).sort();
  return {
    schema: "stockmesh.hardening-report/v1",
    inputIdentity: stableHash(suite),
    policyIdentity: suite.policy.identity,
    decision,
    baseline: suite.baseline,
    ...(suite.candidate ? { candidate: suite.candidate } : {}),
    targets,
    gaps,
    effects: { componentReplacements: 0, canonicalWrites: 0, possibilityWrites: 0, providerCalls: 0, packageWrites: 0 },
  };
}
