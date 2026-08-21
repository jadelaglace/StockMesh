import type { AnalysisCandidate, AnalysisProposal, AnalysisRequest, BranchPurpose, ContextSnapshot } from "../analysis/types.js";
import { ANALYSIS_PROPOSAL_SCHEMA } from "../analysis/index.js";

function candidate(
  context: ContextSnapshot,
  key: string,
  purpose: BranchPurpose,
  priority: number,
  action: string,
  response: string,
): AnalysisCandidate {
  const resultingProjection = structuredClone(context.positionProjection);
  if (key === "clarify") {
    resultingProjection.state_ids = resultingProjection.state_ids.filter((id) => id !== "state-syn-decision-open");
  } else if (key === "private-check") {
    resultingProjection.state_ids = resultingProjection.state_ids.filter((id) => id !== "state-syn-style-root" && id !== "state-syn-style-current");
  } else if (key === "broaden" && Date.parse(context.evidenceCutoff) >= Date.parse("2026-08-17T10:21:00Z")) {
    resultingProjection.flow_ids = [...new Set([...resultingProjection.flow_ids, "flow-syn-shared-channel"])].sort();
  } else if (key === "broaden") {
    resultingProjection.relation_ids = resultingProjection.relation_ids.filter((id) => id !== "relation-syn-authority");
  } else if (resultingProjection.state_ids.length > 0) {
    resultingProjection.state_ids = resultingProjection.state_ids.slice(1);
  } else if (resultingProjection.relation_ids.length > 0) {
    resultingProjection.relation_ids = resultingProjection.relation_ids.slice(1);
  } else {
    resultingProjection.flow_ids = resultingProjection.flow_ids.slice(1);
  }
  return {
    key,
    purpose,
    title: action,
    action,
    modeledResponse: response,
    resultingProjection,
    evaluation: {
      riskPolicy: context.riskPolicy,
      evaluationProfile: context.evaluationProfile,
      partyScorecards: context.objectives.map((objective, index) => ({
        partyNodeId: objective.partyNodeId,
        objective: objective.objective,
        dimensions: [
          {
            id: "decision-clarity",
            label: "Decision clarity",
            value: Number(Math.max(0, priority - index * 0.08).toFixed(2)),
            unit: "normalized synthetic score",
            interpretation: "Deterministic demo estimate, not a social fact.",
          },
          {
            id: "escalation-risk",
            label: "Escalation risk",
            value: Number(Math.min(1, 1 - priority + index * 0.06).toFixed(2)),
            unit: "normalized synthetic risk",
            interpretation: "Higher values indicate more modeled escalation risk.",
          },
        ],
        uncertainty: { level: "medium", basis: ["public synthetic fixture"] },
        methodRefs: [...context.methodRunIds],
      })),
      uncertainty: { level: "medium", basis: ["No real-world evidence is used."] },
    },
    assumptions: ["Profile Claims remain frozen at the branch root.", "The projection delta is hypothetical until separately observed and reviewed.", "No unrecorded private context is available."],
    uncertainty: { level: "medium", basis: ["Deterministic P4 demonstration"] },
    replanTrigger: "A reviewed actual Event contradicts the modeled response.",
    horizon: context.horizon,
    priority,
  };
}

export function syntheticWorkbenchProposal(request: AnalysisRequest): AnalysisProposal {
  const depth = request.context.branchPath.length;
  const candidates = depth === 0
    ? [
        candidate(request.context, "clarify", "forecast", 0.88, "Clarify the decision boundary", "The sponsor asks for one explicit owner and deadline."),
        candidate(request.context, "private-check", "counterfactual", 0.67, "Check privately before escalating", "The coordinator shares constraints with a smaller audience."),
        candidate(request.context, "broaden", "exploratory", 0.49, "Broaden the consultation", "Additional perspectives appear, with slower convergence."),
      ]
    : depth === 1
      ? [candidate(request.context, `follow-${request.context.branchPath.at(-1)}`, "forecast", 0.73, "Confirm the next commitment", "The network converges on a review checkpoint.")]
      : [];
  return {
    schema: ANALYSIS_PROPOSAL_SCHEMA,
    summary: `Synthetic organizational analysis at branch depth ${depth}.`,
    candidates,
  };
}
