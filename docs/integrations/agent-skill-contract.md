# Candidate external Agent Skill contract

Status: **candidate for user review**. This is a capability contract, not an implemented Skill, CLI, MCP server, or API.

Purpose: let external Agents use StockMesh as an evidence-aware temporal-network analysis service, with optional strategic capabilities when a profile declares agency and evaluation semantics, without bypassing canonical data ownership or privacy boundaries.

## Contract principles

- Transport-neutral first: the same capabilities may later be exposed through a Codex Skill, CLI, MCP tools, or HTTP API.
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
| `step.explain` | Return one Strategy Step with source input, evidence/Claims, before/after Position, Transition, mode, and branch membership | Derived/read-only |
| `position.build` | Materialize a reproducible as-of projection | Derived output only |
| `position.compare` | Explain changes between two positions | Derived output only |
| `position.evaluate` | Produce a perspective-bound scorecard | Derived output only |
| `trajectory.simulate` | Generate diverse possible Trajectories within a declared model and budget | Derived output only |
| `strategy.recommend` | When supported by the profile, rank controllable Actions/Trajectories and explain assumptions | Derived output only |
| `decision.replay` | Reconstruct an earlier information set and compare alternatives | Derived output only |
| `evidence.stage` | Submit private candidate evidence for validation | Staging only; never canonical directly |
| `correction.propose` | Propose identity, event, assertion, or scoring corrections | Review queue only |
| `trace.explain` | Return evidence and processing lineage for a claim/output | Read-only |

## Common request envelope

```json
{
  "playground_id": "pg_example",
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

`trajectory.simulate` additionally accepts:

- starting `position_id`;
- allowed Action classes and excluded interventions when agency/control exists;
- depth, beam width, and scenario-diversity budget;
- actors whose modeled responses matter;
- hard constraints and unacceptable outcomes;
- whether to include wording candidates.

The response returns a Trajectory graph, not only one answer. Each Transition includes its mode and cause or candidate Action, assumptions, likelihood or uncertainty representation, rationale, resulting Position/Evaluation, and replan trigger. Non-agentic profiles need not expose Actions or recommendations.

## Trust tiers

1. **Reader:** Playground, Node, timeline, Position, trace.
2. **Analyst:** evaluation, comparison, replay, simulation, recommendation.
3. **Contributor:** evidence staging and correction proposals.

There is no “canonical writer” or “autonomous actor” tier for external Agents in the initial contract.

## Candidate Codex Skill behavior

A future `stockmesh` Skill should route intents such as:

```text
ingest/stage evidence
inspect current position
explain one dialogue turn / strategy step
compare before/after
analyze a Node, Relation, or Flow
evaluate a position
simulate possible trajectories or candidate actions
replay a past decision
explain evidence
propose a correction
```

It should call the narrow capability contract rather than teach an Agent to read private databases or edit graph files. The Skill remains a client; StockMesh core owns validation, canonical records, and readback.

## Decisions for user review

1. Should the first external surface be a Codex Skill over CLI, an MCP server, or both?
2. Should external Agents be allowed to stage evidence in v1, or remain read/analysis-only?
3. Which capabilities must support streaming for long scenario searches?
4. Does a recommendation require explicit human confirmation before it can be exported to another Agent?
