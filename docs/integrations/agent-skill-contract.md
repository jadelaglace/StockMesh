# Candidate Agent Skill and CLI client contract

Status: **client role adopted; capability details remain candidate**. This is a contract, not an implemented Skill, CLI, MCP server, or API.

Purpose: give Agents and command-line users lightweight access to the same evidence-aware temporal-network, LLM-analysis, branch, and replay capabilities used by the primary Web workbench, without bypassing canonical data ownership or privacy boundaries.

## Contract principles

- Transport-neutral first: the same capabilities may later be exposed through a Codex Skill, CLI, MCP tools, or HTTP API.
- The Web workbench is the primary human route. Skill/CLI are clients, not required analysis engines or separate state owners.
- Natural-language analysis is provided through StockMesh's provider-neutral `AnalysisPort`; an Agent may add its own reasoning, but the contract does not require an autonomous Agent runtime.
- Read and analyze before write. External Agents never write canonical graph records directly.
- Inputs are scoped by Playground, authorization, time, perspective, objective, and horizon.
- Outputs carry evidence references, uncertainty, limitations, processor identity, and a stable run ID.
- Recommendation is advisory. The contract does not send messages, change employment decisions, or act on people.

## Capability surface

| Capability | Purpose | Mutation boundary |
| --- | --- | --- |
| `playground.get` | Read scope, ontology, policies, and available profiles | Read-only |
| `node.get` | Read one Node and authorized Claims, State, Relations, and Flows | Read-only |
| `timeline.query` | Query authorized Events and state changes by time, Node, or profile-defined filters | Read-only |
| `context.get` | Return the exact Position, branch path, evidence cutoff, objectives, unknowns, prior steps, and available Method results for an analysis call | Derived/read-only |
| `step.explain` | Return one Strategy Step with source input, evidence/Claims, before/after Position, Transition, mode, and branch membership | Derived/read-only |
| `position.build` | Materialize a reproducible as-of projection | Derived output only |
| `position.compare` | Explain changes between two positions | Derived output only |
| `position.evaluate` | Produce a perspective-bound scorecard | Derived output only |
| `analysis.run` | Invoke the configured LLM analysis boundary over an exact context and return validated semantic proposals with provider/model trace | Derived output only |
| `trajectory.simulate` | Generate diverse possible Trajectories within a declared model and budget | Derived output only |
| `strategy.recommend` | When supported by the profile, rank controllable Actions/Trajectories and explain assumptions | Derived output only |
| `branch.list` | Read Main Line and Variations, statuses, Evaluations, and cache validity | Read-only |
| `branch.fork` | Create a hypothetical child from any selected Position without changing its parent or siblings | Derived possibility only |
| `branch.pin` | Pin/unpin a forecast for user comparison; never promote it to history | Derived preference only |
| `search.start` / `search.continue` / `search.cancel` | Control a persisted budgeted exploration run and its frontier | Derived runtime/possibility state only |
| `decision.replay` | Checkout a historical or hypothetical Position, reconstruct its exact information set, and optionally fork | Derived output only |
| `evidence.stage` | Submit private candidate evidence for validation | Staging only; never canonical directly |
| `correction.propose` | Propose identity, event, assertion, or scoring corrections | Review queue only |
| `trace.explain` | Return evidence and processing lineage for a claim/output | Read-only |

## Common request envelope

```json
{
  "playground_id": "pg_example",
  "position_id": "pos_example",
  "branch_id": "branch_example",
  "as_of": "2026-08-16T10:00:00+08:00",
  "perspective": { "node_id": "node_a", "objective": "profile-defined" },
  "horizon": { "unit": "day", "value": 7 },
  "evidence_scope": "authorized-private",
  "evaluation_profile": "balanced",
  "request_id": "caller-generated-id"
}
```

The real transport should use opaque identifiers. Public fixtures must be synthetic unless the user explicitly authorizes a reviewed, de-identified template.

## Common response envelope

```json
{
  "run_id": "run_example",
  "status": "succeeded",
  "position_id": "pos_example",
  "result": {},
  "claims": [],
  "uncertainty": [],
  "limitations": [],
  "evidence_refs": [],
  "processor": { "name": "stockmesh", "version": "candidate" }
}
```

Object-level results distinguish `succeeded`, `partial`, `inaccessible`, `quarantined`, `retryable-failed`, and `non-retryable-failed`. Repeating an unchanged request with the same input identity must not manufacture a new canonical fact.

## Scenario request

`trajectory.simulate` and `search.start` additionally accept:

- starting `position_id`;
- allowed Action classes and excluded interventions when agency/control exists;
- optional maximum depth plus materialized-Position, time, token, cost, and scenario-diversity budgets;
- a Search Policy identifier and any policy-specific parameters, without treating candidate count as a universal constant;
- actors whose modeled responses matter;
- hard constraints and unacceptable outcomes;
- whether to include wording candidates.

The response returns a persisted branch graph and frontier, not only one answer. Each materialized Position has a per-Party Evaluation; each Transition includes its mode and cause or candidate Action, assumptions, likelihood or uncertainty representation, rationale, and replan trigger. The response identifies pruned, stopped, unevaluated, cached, and pinned state where applicable. Non-agentic profiles need not expose Actions or recommendations.

## Trust tiers

1. **Reader:** Playground, Node, timeline, Position, trace.
2. **Analyst:** evaluation, comparison, replay, simulation, recommendation.
3. **Contributor:** evidence staging and correction proposals.

There is no “canonical writer” or “autonomous actor” tier for external Agents in the initial contract.

## Candidate Codex Skill behavior

A future `stockmesh` Skill should provide a lightweight conversational route for intents such as:

```text
ingest/stage evidence
inspect current position
explain one dialogue turn / strategy step
compare before/after
analyze a Node, Relation, or Flow
evaluate a position
simulate possible trajectories or candidate actions
pin or resume a forecast branch
return to a position and fork a new variation
replay a past decision
explain evidence
propose a correction
```

It should call the narrow capability contract rather than teach an Agent to read private databases or edit graph files. The Skill may ask StockMesh's configured LLM analysis service to reason, or an Agent may contribute a separately attributed proposal. In both cases the Skill remains a client; StockMesh core owns validation, canonical records, cache identity, and readback.

## Decisions for user review

1. Should implementation ship the CLI before the StockMesh Skill, or build the Skill directly over the same CLI commands?
2. Should external Agents be allowed to stage evidence in v1, or remain read/analysis-only?
3. Which capabilities must support streaming for long scenario searches?
4. Does a recommendation require explicit human confirmation before it can be exported to another Agent?
