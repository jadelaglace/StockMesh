import type { ContextSnapshotInput, SearchBudget, SearchPolicyIdentity } from "../analysis/types.js";

export type SearchRunStatus = "running" | "paused-budget" | "paused-user" | "completed" | "cancelled" | "failed";

export interface StartSearchInput extends ContextSnapshotInput {
  runKey: string;
  budgets: SearchBudget;
  policy?: SearchPolicyIdentity;
}

export interface SearchRunRecord {
  id: string;
  rootPositionId: string;
  rootContextSnapshotId: string;
  policy: SearchPolicyIdentity;
  budgets: SearchBudget;
  usage: {
    materializedPositions: number;
    analysisCalls: number;
    elapsedMs: number;
    tokens: number;
    cost: number;
  };
  status: SearchRunStatus;
  stopReason?: string;
  selectionRationale: string[];
}

export interface ForkSearchInput {
  runKey: string;
  variationId: string;
  budgets: SearchBudget;
  policy?: SearchPolicyIdentity;
  horizon?: string;
}
