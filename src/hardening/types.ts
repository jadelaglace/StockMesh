export type HardeningMetricName =
  | "preparedStepCoverage"
  | "preparedRoleCoverage"
  | "unresolvedItemDensity"
  | "forecastScorableCoverage"
  | "forecastAssessmentCoverage"
  | "forecastBrierScore"
  | "contextualUsefulness"
  | "profileRevisionUsefulness"
  | "userLearning"
  | "latencyMs"
  | "tokenCount"
  | "monetaryCostMicrounits";

export type HardeningScope = "synthetic" | "authorized-private";
export type HardeningDirection = "higher-is-better" | "lower-is-better";
export type HardeningDecision = "replace-candidate" | "retain-baseline" | "defer-replacement";

export interface MetricDefinition {
  unit: string;
  direction: HardeningDirection;
  humanAttributed: boolean;
  minimum: number;
  maximum?: number;
}

export const HARDENING_METRICS: Readonly<Record<HardeningMetricName, Readonly<MetricDefinition>>> = Object.freeze({
  preparedStepCoverage: Object.freeze({ unit: "ratio", direction: "higher-is-better", humanAttributed: false, minimum: 0, maximum: 1 }),
  preparedRoleCoverage: Object.freeze({ unit: "ratio", direction: "higher-is-better", humanAttributed: false, minimum: 0, maximum: 1 }),
  unresolvedItemDensity: Object.freeze({ unit: "unresolved-items-per-prepared-step", direction: "lower-is-better", humanAttributed: false, minimum: 0 }),
  forecastScorableCoverage: Object.freeze({ unit: "ratio", direction: "higher-is-better", humanAttributed: false, minimum: 0, maximum: 1 }),
  forecastAssessmentCoverage: Object.freeze({ unit: "ratio", direction: "higher-is-better", humanAttributed: false, minimum: 0, maximum: 1 }),
  forecastBrierScore: Object.freeze({ unit: "brier-score-0-best", direction: "lower-is-better", humanAttributed: false, minimum: 0, maximum: 1 }),
  contextualUsefulness: Object.freeze({ unit: "user-rating-1-to-5", direction: "higher-is-better", humanAttributed: true, minimum: 1, maximum: 5 }),
  profileRevisionUsefulness: Object.freeze({ unit: "user-rating-1-to-5", direction: "higher-is-better", humanAttributed: true, minimum: 1, maximum: 5 }),
  userLearning: Object.freeze({ unit: "user-rating-1-to-5", direction: "higher-is-better", humanAttributed: true, minimum: 1, maximum: 5 }),
  latencyMs: Object.freeze({ unit: "milliseconds", direction: "lower-is-better", humanAttributed: false, minimum: 0 }),
  tokenCount: Object.freeze({ unit: "tokens", direction: "lower-is-better", humanAttributed: false, minimum: 0 }),
  monetaryCostMicrounits: Object.freeze({ unit: "currency-microunits", direction: "lower-is-better", humanAttributed: false, minimum: 0 }),
});

export interface ComponentIdentity {
  kind: "analysis-port" | "method" | "search-policy" | "projector" | "pilot-adapter";
  id: string;
  version: string;
  configurationIdentity: string;
}

export interface HardeningTarget {
  metric: HardeningMetricName;
  threshold: number;
  minimumMeanImprovement: number;
  maximumPerScenarioRegression: number;
  requiredScopes: HardeningScope[];
  minimumPairedScenariosPerScope: number;
}

export interface MetricObservation {
  metric: HardeningMetricName;
  status: "observed" | "not-observed";
  value?: number;
  unit?: string;
  assessor?: "user";
}

export interface ComponentMeasurement {
  runIdentity: string;
  observedAt: string;
  metrics: MetricObservation[];
}

export interface HardeningScenario {
  id: string;
  scope: HardeningScope;
  baseline: ComponentMeasurement;
  candidate?: ComponentMeasurement;
}

export interface HardeningSuite {
  schema: "stockmesh.hardening-suite/v1";
  currencyCode: string;
  baseline: ComponentIdentity;
  candidate?: ComponentIdentity;
  policy: {
    identity: string;
    establishedAt: string;
    targets: HardeningTarget[];
  };
  scenarios: HardeningScenario[];
}

export interface TargetResult {
  metric: HardeningMetricName;
  status: "passed" | "failed" | "not-observed";
  direction: HardeningDirection;
  unit: string;
  requiredPairs: number;
  pairedScenarios: number;
  pairedByScope: Partial<Record<HardeningScope, number>>;
  baselineMean?: number;
  candidateMean?: number;
  meanImprovement?: number;
  maximumObservedRegression?: number;
  thresholdPassed?: boolean;
  improvementPassed?: boolean;
  regressionPassed?: boolean;
  limitation: string;
  blockers: string[];
}

export interface HardeningReport {
  schema: "stockmesh.hardening-report/v1";
  inputIdentity: string;
  policyIdentity: string;
  decision: HardeningDecision;
  baseline: ComponentIdentity;
  candidate?: ComponentIdentity;
  targets: TargetResult[];
  gaps: string[];
  effects: {
    componentReplacements: 0;
    canonicalWrites: 0;
    possibilityWrites: 0;
    providerCalls: 0;
    packageWrites: 0;
  };
}
