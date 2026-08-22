export type PilotMetricStatus = "observed" | "not-observed";

export interface PilotHumanRating {
  score: number;
  assessor: "user";
  observedAt: string;
}

export interface PrivatePilotBundle {
  schema: "stockmesh.private-pilot-bundle/v1";
  authorization: {
    explicitlyAuthorized: true;
    purpose: string;
    authorizedAt: string;
    retentionRule: string;
    deletionRule: string;
    publication: "private-only";
  };
  expectedRoles: number;
  expectedSteps: number;
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
  schema: "stockmesh.private-pilot-report/v1";
  inputIdentity: string;
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
  };
  metrics: {
    sourceReferenceIntegrity: PilotMetric;
    reconstructionCoverage: PilotMetric;
    profileCoverage: PilotMetric;
    correctionBurden: PilotMetric;
    forecastSpecificity: PilotMetric;
    forecastCalibration: PilotMetric;
    contextualUsefulness: PilotMetric;
    profileRevisionUsefulness: PilotMetric;
    userLearning: PilotMetric;
  };
  gaps: string[];
}
