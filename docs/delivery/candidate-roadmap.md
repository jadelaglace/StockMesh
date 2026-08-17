# Candidate delivery roadmap

Status: **P0 engineering terminal reached; later runtime phases remain candidate**. This orders the work from domain clarification toward implementation. It does not authorize real-case publication or claim product acceptance.

## Ordering principle

Domain meaning governs data shape; data contracts govern what business scenarios can honestly validate; implementation follows only after those two boundaries are coherent:

```text
requirements-rooted domain
-> versioned data contracts
-> cross-domain semantic checks
-> synthetic organizational business validation
-> replayable implementation backbone
-> Web workbench, LLM analysis, branch search, and Skill/CLI access
```

## Current phase map

The earlier `R` stages describe requirement maturity. `P0` is the delivery gate
that freezes those semantics before runtime code; it does not rename or erase
the `R` history.

| Stage | Actual state | Consequence |
| --- | --- | --- |
| R0 | Direction adopted in ADR-003 | Universal concepts and profile boundary govern contracts. |
| R1 | `0.1.0` and candidate `0.2.0` completed | The older contract remains immutable compatibility evidence. |
| R2 | Three-domain paper check and P0 organizational learning-loop proof completed | P0 used only fully synthetic organizational material. |
| P0 | Engineering terminal reached | The semantic learning loop is frozen and validated before runtime scaffolding. |
| R3-R7 | Not started | Runtime, Web, LLM, Skill/CLI, and private-pilot work remain outside P0. |

## R0 — Domain clarification

Review the universal boundary, four semantic planes, core concepts and invariants, profile extension rules, time semantics, and optional strategy/game-record views. Test the meaning on organizational, resource/energy, and collective/machine shapes without creating schemas.

Terminal: domain questions are visible and the user either adopts or revises the candidate. Data design remains unstarted until this terminal.

## R1 — Versioned data contracts

Define the smallest transport-neutral contracts for Evidence, Claim, Playground, Node, Relation, Flow, State, Event, Mechanism, Position, Perspective, Evaluation, Action, Trajectory, branch purpose, and Forecast Assessment. Define time-bounded profile Claim revision, frozen forecast context, observation coverage, and actual-versus-possible separation. Use only synthetic examples.

Terminal: contracts are versioned, locally validatable, traceable to R0, and do not contain company-only fields in the universal layer.

## R2 — Business and cross-domain validation design

Define representative synthetic questions and expected semantic results for at least three materially different profiles. Then specify one narrow organizational workflow that tests evidence intake, state reconstruction, correction, contextual analysis, strategic branches, a later realized reaction, forecast matching, and competing profile-revision hypotheses.

Terminal: each scenario proves a named contract property; the organizational workflow has observable acceptance without using the private case as product authority.

## P0 — Semantic learning-loop foundation

P0 produces an independent candidate `stockmesh.domain@0.2.0` snapshot and one
fully invented organizational dialogue record that exercises the realized-
reaction learning loop. It preserves `0.1.0` unchanged, freezes objective
acceptance in [`contracts/v0.2/p0-acceptance-matrix.json`](../../contracts/v0.2/p0-acceptance-matrix.json),
and adds a dedicated validator plus repository-gate coverage.

P0 must prove branch purpose versus realization, frozen branch-root context,
matched and divergent forecasts, an unmatched actual reaction, a non-predictive
exploratory branch, horizon/observation-coverage rules, append-only reviewed
profile-Claim revision, separate model/Method/Search calibration, traceable
Strategy Steps, and multi-party Evaluation for every materialized Position.

P0 explicitly excludes a database/runtime schema, application scaffold, Web UI,
live LLM call, private-case import, and product-acceptance claim.

Terminal: every frozen P0 criterion has direct artifact evidence and executable
validation; the complete repository gate and public-boundary audit pass; status
and verification record the observed result. Human acceptance remains separate.

## R3 — Replayable implementation backbone

Implement validated synthetic ingestion, append-only profile Claim/reconciliation history, temporal relations and flows, deterministic as-of Position construction, and correction without source rewriting. Add the optional Episode/Game Record projection and frozen branch-root profile snapshots only as profile/application views.

Terminal: the same inputs and projection identity reproduce the same Position; later profile learning appends revisions without changing the earlier Position; actual and hypothetical trajectories remain separate.

## R4 — Evidence-first Web workbench

Implement the universal timeline, Position/network board, Node detail/profile history, source trace, before/after comparison, and correction workflow. Let profiles supply labels and panels such as Pawn, stance, resource flow, or machine load.

Terminal: a user can complete the selected synthetic workflow without editing internal storage, and profile-specific UI does not contaminate universal semantics.

## R5 — LLM-assisted strategist and branch replay

Add explicit objectives and horizons, the selected transparent SNA Method pack, a provider-neutral LLM AnalysisPort, multi-party vector scorecards, variable candidate branching under explicit budgets, branch purpose, assumptions, uncertainty, pinned Variations, cache identity, and replan triggers. Let the Web workbench checkout any historical or hypothetical Position, fork/resume analysis, compare frozen forecasts with later realized outcomes, review observation coverage, and propose evidence-linked profile revisions.

Terminal: the primary Web route can analyze, expand, pin, compare, fork, resume, reconcile reality, review profile learning, and replay traceable branches; every materialized Position is evaluated; no fixed search width/depth, universal social score, hindsight rewrite, or guaranteed long prediction is presented.

## R6 — Agent Skill and CLI clients

Expose the validated application and LLM-analysis capabilities through thin Skill and CLI clients. Keep evidence writes in staging and corrections in review; no external canonical writer or second analysis authority.

Terminal: an Agent or CLI user can inspect, ask analysis, compare, evaluate, explore, pin, fork, resume, and replay a synthetic profile scenario through the same stable contracts as the Web workbench.

## R7 — Private organizational pilot

Run explicitly authorized private organizational material locally as validation data. Keep it outside Git and public fixtures. Measure reconstruction quality, correction burden, contextual usefulness, forecast specificity/calibration, profile-revision usefulness, and user learning.

Terminal: observed results and gaps are reported; only generalized, non-linkable product consequences may enter the public repository.

## Recommended next decision

After P0 reaches its engineering terminal, start R3 with a thin TypeScript/Node
foundation only when its runtime contract is derived from the validated P0
semantics. Do not expand P0 into the runtime merely to show visible code.
