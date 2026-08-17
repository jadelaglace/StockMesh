# Adopted decisions

Purpose: hold durable decisions explicitly adopted by the appropriate authority. Candidate suggestions and external AI advice do not enter this register automatically.

## ADR-000 — Repository begins documentation-first

- Status: adopted for init
- Date: 2026-08-16
- Authority: direct user request to organize a `product-docs` structure
- Decision: establish a minimal, traceable product-document chain before selecting an implementation stack.
- Consequence: initial work centers on scope, behavior, acceptance, data authority, and a pilot decision; code scaffolding waits for a concrete workflow.

No database, programming language, framework, model provider, deployment topology, or real-data scope has been adopted.

## ADR-001 — Public repository with private case boundary

- Status: adopted
- Date: 2026-08-16
- Authority: [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary)
- Decision: StockMesh is a public GitHub repository. Conversation locators and cases stay outside Git. Product learning must be decoupled and de-identified. Only an explicitly authorized, reviewed, de-identified template may be uploaded.
- Consequence: public verification includes locator scanning and case-leak review; provenance needed for private audit remains outside the repository.

## ADR-002 — MIT license

- Status: adopted
- Date: 2026-08-16
- Authority: [DW-003](../discovery/direct-wording.md#dw-003--tribute-and-licensing-boundary)
- Decision: license StockMesh under MIT. Any Stockfish tribute is name-only and carries no product or technical analogy.
- Consequence: the repository carries the standard MIT License.

## ADR-003 — Requirements-rooted domain direction

- Status: adopted for the R1 contract stage; product acceptance remains open
- Date: 2026-08-16
- Authority: [DW-012](../discovery/direct-wording.md#dw-012--adopt-the-domain-direction-and-continue), following the explicit three-choice review in the active task
- Decision:
  - Use `Node`, `Action`, and `Trajectory` as the neutral universal contract names.
  - Use `Pawn`, `Move`, and `Line` as strategy-workbench aliases, not as universal storage semantics.
  - Treat a `Playground` as a reusable bounded world that may contain multiple `Episode` views.
  - Treat `Mechanism` as a first-class, evidence-bound rule or hypothesis about transitions; it is not automatically proven causality.
- Consequence: R1 may define versioned contracts and fully synthetic examples from this domain. Company cases remain validation material, and the optional Game Record view cannot constrain non-agentic or non-social domains. Data schemas, implementation choices, and product acceptance remain separate decisions.

## ADR-004 — Strategy graph, multidisciplinary reasoning, and open search policy

- Status: adopted as product direction; runtime algorithm and scoring profile remain open
- Date: 2026-08-16
- Authority: [DW-013](../discovery/direct-wording.md#dw-013--a-sentence-is-a-strategy-step-between-complete-positions), [DW-014](../discovery/direct-wording.md#dw-014--score-and-search-reachable-multi-party-positions), [DW-015](../discovery/direct-wording.md#dw-015--data-foundation-with-an-open-multidisciplinary-reasoning-layer), and [DW-016](../discovery/direct-wording.md#dw-016--macro-network-methods-and-micro-interpersonal-methods)
- Decision:
  - Model each contextual Utterance/Action/Event as a Strategy Step connecting a complete scoped before-Position to an after-Position through a Transition.
  - Treat Positions as search-tree nodes and Strategy Steps as edges. Main Line, Variations, frontier, prediction, Timeline, and replay are graph views.
  - Evaluate every reachable Position separately for each declared Party and its Objectives, stake/weights, horizon, constraints, evidence cutoff, and uncertainty.
  - Keep evidence-linked network and temporal data as the foundation, with replaceable macro network/historical Methods and micro interpersonal/language Methods above it.
  - Search and prune branches under an inspectable Search Policy; hybrid reasoning is allowed, and neither Monte Carlo tree search, pure rules, nor any other algorithm is adopted by default.
- Consequence: the chat UI may remain conversational, while backend context supports deeper branching, rollback, comparison, and replay. Scoring is multi-party and not necessarily zero-sum; every Method result remains scoped and attributable, and missing evidence cannot be replaced with false precision.

## ADR-005 — LLM analysis with framework-owned state and shared clients

- Status: adopted as architecture direction; implementation and product acceptance remain open
- Date: 2026-08-16
- Authority: branch/replay direction in [DW-024](../discovery/direct-wording.md#dw-024--agent-led-analysis-with-framework-owned-branching-and-replay), documentation adoption in [DW-025](../discovery/direct-wording.md#dw-025--adopt-the-corrected-architecture-direction-and-expose-algorithm-selections), and analysis/client correction in [DW-026](../discovery/direct-wording.md#dw-026--llm-analysis-service-with-web-first-and-skillcli-client-access)
- Decision:
  - Put natural-language situation, relationship, stance, response, wording, and strategy analysis behind a provider-neutral LLM boundary. An LLM API, local model, or Agent-hosted model may implement it.
  - Make the StockMesh framework authoritative for Domain state, evidence cutoffs, quantitative Methods, multi-party score structures, branch/context caches, provenance, replay, and human-reviewed canonical promotion.
  - Treat branching factor as data- and Agent-dependent. Search is constrained by declared resources and an inspectable replaceable policy, not by a product-wide candidate count or depth.
  - Preserve selected or pinned forecast branches as resumable derived Variations. They do not become Main Line history without separate evidence and review.
  - Make the Web workbench the primary human route. Agent Skill and CLI adapters are lighter clients over the same application, analysis, branch, and replay capabilities rather than separate analysis authorities.
  - Use a TypeScript/Node modular-monolith application core with React/Vite and SQLite as the adopted v0 direction. Keep Python available behind an optional Method-worker boundary when its SNA, statistical, conversational, causal, or simulation ecosystem earns the integration cost.
- Consequence: LLM analysis is a real application capability rather than an optional decoration after a deterministic strategist. Web, Skill, and CLI routes share it; the latter two do not need an autonomous Agent runtime. Graph and statistical algorithms provide attributable features rather than replacing semantic LLM judgment. Exact provider, dependencies, versions, Python worker activation, and implementation remain subject to adoption gates.

## ADR-006 — Realized reactions revise profile Claims and calibrate frozen forecasts

- Status: adopted as domain direction; contract version and implementation remain open
- Date: 2026-08-17
- Authority: [DW-027](../discovery/direct-wording.md#dw-027--real-reactions-incrementally-revise-pawn-hypotheses-and-calibrate-forecasts)
- Decision:
  - Use the Node/Pawn profile visible at a forecast's branch-root Position as a frozen baseline; simulated profile changes must be explicit hypotheses.
  - Treat newly observed real reactions as evidence that may append time-bounded profile Claim revisions after review, preserving alternatives such as actual change, prior-estimate error, context-specific behavior, changed constraints, or insufficient evidence.
  - Keep branch purpose (`forecast`, `counterfactual`, `exploratory`) independent from later realization assessment. A forecast may match, partially match, diverge, remain pending/unknown, or expire without an observed match; an actual Event may have been forecast or be an unmatched surprise.
  - Link later actual evidence to earlier forecasts through append-only Forecast Assessments. Never rewrite the old forecast, Position, profile snapshot, probability/rank, or processor identity.
  - Require elapsed horizon and adequate observation coverage before recording an expired-unobserved outcome.
  - Keep subject/profile learning separate from provider/model, Method, and Search Policy calibration. Prediction text and prediction error are not themselves evidence about the Pawn.
- Consequence: the Game Record becomes a learning loop as well as a replay graph. Current profiles may evolve from reviewed reality while historical analysis remains reproducible, and forecast quality can be measured without hindsight rewriting or treating imaginative branches as failed predictions.
