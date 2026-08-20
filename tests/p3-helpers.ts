import type { AnalysisCandidate, AnalysisProposal, AnalysisRequest, BranchPurpose, ContextSnapshot } from "../src/analysis/types.js";
import { ANALYSIS_PROPOSAL_SCHEMA, DeterministicAnalysisAdapter } from "../src/analysis/index.js";
import { PossibilityStore } from "../src/possibilities/index.js";
import { SearchCoordinator } from "../src/search/index.js";
import { createMethodFixture } from "./helpers.js";

export const p3Objectives = [
  { partyNodeId: "node-syn-sponsor", objective: "improve decision clarity", weight: 0.6 },
  { partyNodeId: "node-syn-coordinator", objective: "avoid unnecessary escalation", weight: 0.4 },
];

export function candidateFor(
  context: ContextSnapshot,
  key: string,
  purpose: BranchPurpose,
  priority: number,
): AnalysisCandidate {
  return {
    key,
    purpose,
    title: `${purpose} ${key}`,
    action: `Take the synthetic ${key} action`,
    modeledResponse: `The synthetic network responds to ${key}`,
    resultingProjection: structuredClone(context.positionProjection),
    evaluation: {
      riskPolicy: context.riskPolicy,
      evaluationProfile: context.evaluationProfile,
      partyScorecards: context.objectives.map((objective, index) => ({
        partyNodeId: objective.partyNodeId,
        objective: objective.objective,
        dimensions: [{
          id: "decision-clarity",
          label: "Decision clarity",
          value: Number((priority - index * 0.1).toFixed(2)),
          unit: "normalized synthetic score",
          interpretation: "Synthetic fixture value, not a social fact.",
        }],
        uncertainty: { level: "medium", basis: ["synthetic fixture"] },
        methodRefs: [...context.methodRunIds],
      })),
      uncertainty: { level: "medium", basis: ["synthetic branch"] },
    },
    assumptions: ["Profile Claims remain frozen at the branch root."],
    uncertainty: { level: "medium", basis: ["No real-world evidence is used."] },
    replanTrigger: "A reviewed actual Event contradicts the modeled response.",
    horizon: context.horizon,
    priority,
  };
}

export function defaultProposal(request: AnalysisRequest): AnalysisProposal {
  const depth = request.context.branchPath.length;
  const candidates = depth === 0
    ? [
      candidateFor(request.context, "clarify", "forecast", 0.9),
      candidateFor(request.context, "delay", "counterfactual", 0.6),
      candidateFor(request.context, "broaden", "exploratory", 0.4),
    ]
    : depth === 1
      ? [candidateFor(request.context, `follow-${request.context.branchPath.at(-1)}`, "forecast", 0.7)]
      : [];
  return { schema: ANALYSIS_PROPOSAL_SCHEMA, summary: `Synthetic depth ${depth} analysis`, candidates };
}

export function createP3Harness(factory: (request: AnalysisRequest) => AnalysisProposal = defaultProposal) {
  const fixture = createMethodFixture();
  const methodRun = fixture.runner.run({ positionId: "position-method-after", methodId: "sna.foundation" });
  const possibilities = new PossibilityStore(fixture.store);
  const adapter = new DeterministicAnalysisAdapter(factory, "p3-fixture", { tokens: 10, cost: 0.01 });
  const search = new SearchCoordinator(fixture.store, possibilities, adapter);
  return { ...fixture, methodRun, possibilities, adapter, search };
}

export function startP3Search(
  harness: ReturnType<typeof createP3Harness>,
  runKey = "p3-run",
  budgets = {
    maxDepth: 2,
    maxMaterializedPositions: 10,
    maxAnalysisCalls: 10,
    maxElapsedMs: 60_000,
    maxTokens: 10_000,
    maxCost: 10,
  },
) {
  return harness.search.start({
    runKey,
    positionId: "position-method-after",
    branchPath: [],
    objectives: p3Objectives,
    horizon: "2026-08-17T10:30:00Z",
    riskPolicy: "balanced-synthetic-risk",
    evaluationProfile: "organizational-synthetic@1.0.0",
    methodRunIds: [harness.methodRun.id],
    unknowns: ["No private context is available."],
    contextManifest: { fixture: "p3-synthetic" },
    budgets,
  });
}
