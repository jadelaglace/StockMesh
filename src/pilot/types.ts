export type PilotMetricStatus = "observed" | "not-observed";

export interface PilotHumanRating {
  score: number;
  assessor: "user";
  observedAt: string;
}

export interface PrivatePilotBundle {
  schema: "stockmesh.private-pilot-bundle/v2";
  authorization: {
    explicitlyAuthorized: true;
    purposeRef: string;
    authorizedAt: string;
    retentionPolicyRef: string;
    deletionPolicyRef: string;
    publication: "private-only";
  };
  coverageBasis: {
    identity: string;
    authority: "authorized-source-inventory";
    establishedAt: string;
    expectedRoles: number;
    expectedSteps: number;
  };
  preparedAt: string;
  sourceRefs: string[];
  roles: Array<{ id: string; sourceRefs: string[]; claimCount: number }>;
  steps: Array<{ id: string; sourceRefs: string[] }>;
  unresolvedItems: string[];
  branches: Array<{
    id: string;
    sourceRefs: string[];
    purpose: "forecast" | "counterfactual" | "exploratory";
    criteriaCount: number;
    horizonDeclared: boolean;
    assessment?: "matched" | "partial" | "diverged" | "expired-unobserved" | "pending" | "unknown";
  }>;
  calibrationSamples?: Array<{
    id: string;
    forecastId: string;
    criterionId: string;
    assessmentId: string;
    predictedProbability: number;
    observedOutcome: 0 | 1;
  }>;
  humanRatings?: {
    contextualUsefulness?: PilotHumanRating;
    profileRevisionUsefulness?: PilotHumanRating;
    userLearning?: PilotHumanRating;
  };
}

export interface PilotMetric {
  status: PilotMetricStatus;
  numerator?: number;
  denominator?: number;
  value?: number;
  unit?: string;
  limitation: string;
}

export interface PrivatePilotReport {
  schema: "stockmesh.private-pilot-report/v2";
  inputIdentity: string;
  coverageBasis: {
    identity: string;
    authority: "authorized-source-inventory";
    expectedRoles: number;
    expectedSteps: number;
  };
  privacy: {
    bodyFree: true;
    privateOnly: true;
    canonicalWrites: 0;
    possibilityWrites: 0;
  };
  inventory: {
    sourceRefs: number;
    roles: number;
    steps: number;
    unresolvedItems: number;
    branches: number;
    calibrationSamples: number;
  };
  metrics: {
    sourceReferenceClosure: PilotMetric;
    preparedStepCoverage: PilotMetric;
    preparedRoleCoverage: PilotMetric;
    unresolvedItemDensity: PilotMetric;
    forecastScorableCoverage: PilotMetric;
    forecastAssessmentCoverage: PilotMetric;
    forecastCalibration: PilotMetric;
    contextualUsefulness: PilotMetric;
    profileRevisionUsefulness: PilotMetric;
    userLearning: PilotMetric;
  };
  gaps: string[];
}
