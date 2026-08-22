import { stableHash } from "../methods/identity.js";
import type { PilotHumanRating, PilotMetric, PrivatePilotBundle, PrivatePilotReport } from "./types.js";
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
  const sourceSet = new Set(bundle.sourceRefs);
  const resolved = referenced.filter((id) => sourceSet.has(id)).length;
  const forecastOnly = bundle.branches.filter((item) => item.purpose === "forecast");
  const specificForecasts = forecastOnly.filter((item) => item.criteriaCount > 0 && item.horizonDeclared);
  const assessedForecasts = forecastOnly.filter((item) => item.assessment !== undefined && item.assessment !== "pending" && item.assessment !== "unknown");
  const ratings = bundle.humanRatings;
  const metrics = {
    sourceReferenceIntegrity: ratio(resolved, referenced.length, "Measures structural reference resolution, not source-body truth."),
    reconstructionCoverage: ratio(bundle.steps.length, bundle.expectedSteps, "Expected-step denominator is supplied by the authorized private preparation boundary."),
    profileCoverage: ratio(bundle.roles.filter((item) => item.claimCount > 0).length, bundle.expectedRoles, "A role with a claim is covered structurally; claim correctness still requires review."),
    correctionBurden: bundle.steps.length === 0
      ? { status: "not-observed" as const, limitation: "No reconstructed steps exist for a correction-burden denominator." }
      : { status: "observed" as const, numerator: bundle.unresolvedItems.length, denominator: bundle.steps.length, value: bundle.unresolvedItems.length / bundle.steps.length, unit: "unresolved-items-per-step", limitation: "Counts unresolved structural items; it does not estimate correction time or cognitive effort." },
    forecastSpecificity: ratio(specificForecasts.length, forecastOnly.length, "Only purpose-typed forecasts with explicit criteria and horizon are eligible."),
    forecastCalibration: ratio(assessedForecasts.length, forecastOnly.length, "Coverage of eligible terminal assessments only; no accuracy score is inferred from missing or pending outcomes."),
    contextualUsefulness: human(ratings?.contextualUsefulness, "Requires an attributed user rating after using the reconstructed context."),
    profileRevisionUsefulness: human(ratings?.profileRevisionUsefulness, "Requires an attributed user rating after reviewing profile revisions."),
    userLearning: human(ratings?.userLearning, "Requires an attributed user judgment; record volume cannot prove learning."),
  };
  const gaps = Object.entries(metrics).filter(([, metric]) => metric.status === "not-observed").map(([name]) => name).sort();
  return {
    schema: "stockmesh.private-pilot-report/v1",
    inputIdentity: stableHash(bundle),
    privacy: { bodyFree: true, privateOnly: true, canonicalWrites: 0, possibilityWrites: 0 },
    inventory: {
      sourceRefs: bundle.sourceRefs.length,
      roles: bundle.roles.length,
      steps: bundle.steps.length,
      unresolvedItems: bundle.unresolvedItems.length,
      branches: bundle.branches.length,
    },
    metrics,
    gaps,
  };
}
