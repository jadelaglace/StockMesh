# Candidate delivery roadmap

Status: **P0-P4 engineering terminals reached and merged; P5-P7 remain held for explicit goals**. This orders the work from domain clarification toward implementation. It does not authorize real-case publication or claim product acceptance.

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

The earlier `R` stages are retained as requirement/definition history. The
delivery route is now numbered `P0-P7`; P0 is the semantic gate and P1 is the
first runtime phase.

| Stage | Actual state | Consequence |
| --- | --- | --- |
| R0-R2 | Definition history completed | Domain, contracts, and synthetic validation direction govern delivery. |
| P0 | Engineering terminal reached | The semantic learning loop is frozen and validated before runtime scaffolding. |
| P1 | Engineering terminal reached | Replayable canonical foundation over `0.2.0`. |
| P2 | Engineering terminal reached | Replaceable, attributable quantitative Method layer over P1 Positions. |
| P3 | Engineering terminal reached | Provider-neutral analysis and framework-owned possibility search/replay over frozen P1/P2 context. |
| P4 | Engineering terminal reached and merged | Responsive Web workflow over the public synthetic record; PR #8 merged as `e383d5d`. |
| P5-P7 | Held for explicit goals | Skill/CLI clients, private pilot, and measured hardening remain outside P4. |

## Definition history — R0: Domain clarification

Review the universal boundary, four semantic planes, core concepts and invariants, profile extension rules, time semantics, and optional strategy/game-record views. Test the meaning on organizational, resource/energy, and collective/machine shapes without creating schemas.

Terminal: domain questions are visible and the user either adopts or revises the candidate. Data design remains unstarted until this terminal.

## Definition history — R1: Versioned data contracts

Define the smallest transport-neutral contracts for Evidence, Claim, Playground, Node, Relation, Flow, State, Event, Mechanism, Position, Perspective, Evaluation, Action, Trajectory, branch purpose, and Forecast Assessment. Define time-bounded profile Claim revision, frozen forecast context, observation coverage, and actual-versus-possible separation. Use only synthetic examples.

Terminal: contracts are versioned, locally validatable, traceable to R0, and do not contain company-only fields in the universal layer.

## Definition history — R2: Business and cross-domain validation design

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

## P1 — Replayable implementation backbone

Implement validated synthetic ingestion, staging/review, append-only profile Claim/reconciliation history, temporal relations and flows, deterministic as-of Position construction, and correction without source rewriting. Add the optional Episode/Game Record projection and frozen branch-root profile snapshots only as profile/application views. The first implementation is a TypeScript/Node core with SQLite-compatible persistence and tested use-case boundaries.

Terminal: the same inputs and projection identity reproduce the same Position; later profile learning appends revisions without changing the earlier Position; actual and hypothetical trajectories remain separate; the synthetic P0 workflow can be staged, reviewed, imported, projected, revised, and replayed through the core.

## P2 — Quantitative Method layer

Implement the Method registry, the selected transparent Graphology SNA pack, temporal deltas, multi-Party score structures, and persisted attributable runs. Methods remain replaceable and cannot write canonical records.

Terminal: a synthetic Position can run the selected Method pack, expose typed inputs/raw metrics/caveats, and persist reproducible Method output without merging it into LLM interpretation or source evidence.

Observed terminal: reached on 2026-08-19. Five exact-versioned MIT Graphology packages support a versioned registry/runner, provenance-preserving directed graph adapter, foundation metrics, exploratory PageRank/Louvain sensitivity, typed temporal delta, and non-aggregated Party score vectors. Schema v2 stores only attributable derived definitions/runs/results; 10/10 frozen criteria and the clean-install terminal gate passed. Human product acceptance remains separate.

Post-terminal repair: FIX-001 merged through GitHub PR #1 on 2026-08-20. Position and canonical identity are fail-closed, Position rebuild preserves Method attribution, and Temporal Delta `1.1.0` separates complete Position deltas from filtered analysis-graph deltas while retaining `1.0.0` reproducibility. The P2 scope and P3 boundary are unchanged.

## P3 — LLM-assisted analysis and branch replay

Add the provider-neutral AnalysisPort, one structured-output LLM adapter plus deterministic fixtures, PossibilityStore, branch purpose, budgeted/resumable frontier, pin/fork/cache/replay, per-materialized-Position Evaluation, and cutoff-correct Forecast Assessment.

Terminal: analysis can generate, validate, evaluate, retain, compare, and replay traceable branches under explicit budgets; forecasts, counterfactuals, and exploratory branches remain distinct.

Observed terminal: reached and merged through GitHub Flow on 2026-08-20. Schema v3, the provider-neutral AnalysisPort, deterministic and mocked structured-output adapters, frozen full context, transactional PossibilityStore, configurable persisted frontier, exact cache/pin/fork/replay, and cutoff-correct Forecast Assessment pass all 12 frozen criteria and the clean-install terminal gate. No real provider, Web, client, private case, product usefulness, or human acceptance is claimed.

Post-terminal repair: FIX-002 merged through GitHub PRs #5 and #6 on 2026-08-21. Exact concurrent local analysis now shares one in-process execution while persisted attempts and successful cache identity remain separate; failed retries retain history. Forecast Assessment enforces the frozen anchor-to-horizon interval and order-independent reference-set identity. The P3 scope, frozen matrix, P4 boundary, and human-acceptance gap are unchanged.

## P4 — Evidence-first Web workbench

Implement the universal timeline, Position/network board, Node detail/profile history, source trace, before/after comparison, and correction workflow. Let profiles supply labels and panels such as Pawn, stance, resource flow, or machine load.

Terminal: a user can complete the selected synthetic workflow without editing internal storage, and profile-specific UI does not contaminate universal semantics.

Observed engineering terminal: reached and merged through GitHub Flow on 2026-08-21. One React/Vite workbench over a thin Fastify host completes the public synthetic stage, review, Timeline/Position/trace inspection, deterministic analysis, multi-Party comparison, purpose-typed branch navigation, pin/checkout/fork/resume/replay, and reviewed append-only profile correction workflow. The clean P0-P4 terminal round and desktop/mobile browser evidence pass; PR #8 merged as `e383d5d`. No live provider, Skill/CLI, private case, real-usefulness result, or human acceptance is claimed.

## P5 — Agent Skill and CLI clients

Expose the validated application and LLM-analysis capabilities through thin Skill and CLI clients. Keep evidence writes in staging and corrections in review; no external canonical writer or second analysis authority.

Terminal: an Agent or CLI user can inspect, ask analysis, compare, evaluate, explore, pin, fork, resume, and replay a synthetic profile scenario through the same stable contracts as the Web workbench.

## P6 — Private organizational pilot

Run explicitly authorized private organizational material locally as validation data. Keep it outside Git and public fixtures. Measure reconstruction quality, correction burden, contextual usefulness, forecast specificity/calibration, profile-revision usefulness, and user learning.

Terminal: observed results and gaps are reported; only generalized, non-linkable product consequences may enter the public repository.

## P7 — Learning and replaceable-component hardening

Measure reconstruction quality, correction burden, contextual usefulness,
forecast specificity/calibration, profile-revision usefulness, latency, and
cost across synthetic and explicitly authorized runs. Replace a component only
when a measured target and a traceable alternative justify it.

Terminal: learning results, residual risks, upgrade decisions, and unresolved
human-acceptance questions are recorded without silently expanding product
scope.

## Recommended next decision

P5 is the next candidate only after an explicit new goal; do not silently expand P4 into
Skill/CLI clients, private pilots, live-provider claims, or measured hardening.
