import { stableHash } from "../methods/identity.js";
import type { PilotHumanRating, PilotMetric, PrivatePilotReport } from "./types.js";
import { validatePrivatePilotBundle } from "./validation.js";

function ratio(numerator: number, denominator: number, limitation: string): PilotMetric {
  return denominator === 0
    ? { status: "not-observed", limitation }
    : { status: "observed", numerator, denominator, value: numerator / denominator, unit: "ratio", limitation };
}

function human(rating: PilotHumanRating | undefined, limitation: string): PilotMetric {
  return rating === undefined
    ? { status: "not-observed", limitation }
    : { status: "observed", numerator: rating.score, denominator: 5, value: rating.score, unit: "user-rating-1-to-5", limitation: "One attributed user observation; not a population estimate." };
}

export function evaluatePrivatePilot(input: unknown): PrivatePilotReport {
  const bundle = validatePrivatePilotBundle(input);
  const referenced = [...bundle.roles.flatMap((item) => item.sourceRefs), ...bundle.steps.flatMap((item) => item.sourceRefs), ...bundle.branches.flatMap((item) => item.sourceRefs)];
  const forecastOnly = bundle.branches.filter((item) => item.purpose === "forecast");
  const scorableForecasts = forecastOnly.filter((item) => item.criteriaCount > 0 && item.horizonDeclared);
  const assessedForecasts = forecastOnly.filter((item) => item.assessment !== undefined && item.assessment !== "pending" && item.assessment !== "unknown");
  const samples = bundle.calibrationSamples ?? [];
  const brierSum = samples.reduce((sum, sample) => sum + ((sample.predictedProbability - sample.observedOutcome) ** 2), 0);
  const ratings = bundle.humanRatings;
  const metrics = {
    sourceReferenceClosure: ratio(referenced.length, referenced.length, "Validation invariant over reference occurrences; it does not measure source truth or extraction completeness."),
    preparedStepCoverage: ratio(bundle.steps.length, bundle.coverageBasis.expectedSteps, "Denominator is frozen before preparation and traced to an authorized private inventory; the evaluator cannot inspect source bodies to prove extraction quality."),
    preparedRoleCoverage: ratio(bundle.roles.filter((item) => item.claimCount > 0).length, bundle.coverageBasis.expectedRoles, "A role with at least one claim is structurally covered; claim correctness and completeness still require review."),
    unresolvedItemDensity: bundle.steps.length === 0
      ? { status: "not-observed" as const, limitation: "No prepared steps exist for an unresolved-item denominator." }
      : { status: "observed" as const, numerator: bundle.unresolvedItems.length, denominator: bundle.steps.length, value: bundle.unresolvedItems.length / bundle.steps.length, unit: "unresolved-items-per-prepared-step", limitation: "Counts opaque unresolved-item identities; it does not estimate correction time or cognitive effort." },
    forecastScorableCoverage: ratio(scorableForecasts.length, forecastOnly.length, "Structural readiness only: criteria count and horizon are declared without exposing forecast bodies or proving semantic specificity."),
    forecastAssessmentCoverage: ratio(assessedForecasts.length, forecastOnly.length, "Coverage of eligible terminal assessments; this is not forecast quality or calibration."),
    forecastCalibration: samples.length === 0
      ? { status: "not-observed" as const, limitation: "Requires criterion-level predicted probabilities and covered binary outcomes; categorical assessment coverage is not calibration." }
      : { status: "observed" as const, numerator: brierSum, denominator: samples.length, value: brierSum / samples.length, unit: "brier-score-0-best", limitation: "Criterion-level Brier score over supplied covered outcomes; sample size and representativeness remain visible." },
    contextualUsefulness: human(ratings?.contextualUsefulness, "Requires an attributed user rating after using the reconstructed context."),
    profileRevisionUsefulness: human(ratings?.profileRevisionUsefulness, "Requires an attributed user rating after reviewing profile revisions."),
    userLearning: human(ratings?.userLearning, "Requires an attributed user judgment; record volume cannot prove learning."),
  };
  const gaps = Object.entries(metrics).filter(([, metric]) => metric.status === "not-observed").map(([name]) => name).sort();
  return {
    schema: "stockmesh.private-pilot-report/v2",
    inputIdentity: stableHash(bundle),
    coverageBasis: {
      identity: bundle.coverageBasis.identity,
      authority: bundle.coverageBasis.authority,
      expectedRoles: bundle.coverageBasis.expectedRoles,
      expectedSteps: bundle.coverageBasis.expectedSteps,
    },
    privacy: { bodyFree: true, privateOnly: true, canonicalWrites: 0, possibilityWrites: 0 },
    inventory: {
      sourceRefs: bundle.sourceRefs.length,
      roles: bundle.roles.length,
      steps: bundle.steps.length,
      unresolvedItems: bundle.unresolvedItems.length,
      branches: bundle.branches.length,
      calibrationSamples: samples.length,
    },
    metrics,
    gaps,
  };
}
