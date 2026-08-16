# Current requirements

Purpose: state the current interpreted product outcome and constraints. Upstream authorities are [DW-001](../discovery/direct-wording.md#dw-001--initial-stockmesh-brief), the public/case boundary in [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary), the strategic domain direction in [DW-006](../discovery/direct-wording.md#dw-006--chess-like-domain-simulation-ui-and-agent-interface), the requirements-first correction in [DW-010](../discovery/direct-wording.md#dw-010--requirements-first-not-case-first), adopted domain direction [ADR-003](../decisions/README.md#adr-003--requirements-rooted-domain-direction), the transition/search refinements in [DW-013](../discovery/direct-wording.md#dw-013--a-sentence-is-a-strategy-step-between-complete-positions) and [DW-014](../discovery/direct-wording.md#dw-014--score-and-search-reachable-multi-party-positions), and the method-layer clarifications in [DW-015](../discovery/direct-wording.md#dw-015--data-foundation-with-an-open-multidisciplinary-reasoning-layer) and [DW-016](../discovery/direct-wording.md#dw-016--macro-network-methods-and-micro-interpersonal-methods). Downstream consumers are the PRD, candidate domain model, acceptance, design, architecture, and integration contract.

## Product intent

StockMesh should help a user understand how a network behaves by placing new nodes, relationships or flows, events, state observations, and contextual evidence into an evolving model and immediately seeing the relevant Position, history, patterns, risks, and possible developments. It should support cumulative learning: new evidence refines understanding instead of producing an isolated one-off answer.

In an agentic dialogue or interaction profile, each utterance or other contextual action may be modeled as a strategy step: a traceable input that transforms one complete, question-bounded Position into the next. The backend preserves the context fields, evidence, and transition history; the Web UI or external Skill is only a view over that maintained state graph.

Evidence-linked Nodes, Relations, Flows, Events, State, time, and Positions form the durable data foundation. Above it, StockMesh may combine macro methods such as historical analogy, social-network analysis, social behavior, and communication/propagation analysis with micro methods such as personality lenses, interpersonal conventions, conversation analysis, and wording optimization. These are inspectable analytical lenses, not automatic truths about a person or guarantees that history will repeat.

For a declared set of people, coalitions, organizations, or other Parties, every reachable Position should be evaluable against each Party's explicit Objectives, stake/weights, horizon, constraints, and uncertainty. StockMesh may combine retrieval and historical comparison, rules and heuristics, graph analysis, statistical or learned methods, and search/planning to produce alternative Lines. The combination and search policy remain open; no single technique, including Monte Carlo or a pure rule system, defines the product.

## Initial scope

The first practical scope is company social-network analysis across departments:

- people and organizational units;
- observed relationships and interactions;
- time-indexed events and statements;
- behavior patterns and expressed positions;
- contextual analysis across multiple evidence items;
- views that help a user inspect the basis of an interpretation.

The first application should resemble a strategy workbench: define a bounded analysis Playground, represent analysis nodes as Pawns, reconstruct the current Position from a timeline, evaluate it under explicit goals and horizons, simulate plausible developments or interventions, and advise the human operator. The product serves as a strategic adviser rather than a second-by-second autonomous operator.

## Long-range scope

The underlying model must not assume that every node is a person, every edge is a social relationship, every change is a speech act, or every network is a company. It must be able to describe social communities, institutions and interest groups, material or energy networks, biological collectives, AI/machine collectives, and macro-scale or astronomical networks through domain profiles. Company social analysis is the first practical profile, not the authority for the universal core.

## Governing constraints

1. Every consequential claim must trace to source evidence and time context.
2. Observed facts, reported claims, Agent/model inference, and human judgment must remain distinguishable.
3. Uncertainty, conflicting evidence, source limitations, and alternative hypotheses must be visible.
4. Sensitive company and personal data must have explicit authority, purpose limitation, access control, retention, and deletion/recovery rules before real ingestion.
5. StockMesh must not present personality labels, motives, guilt, loyalty, or predicted behavior as established fact merely because a model inferred them.
6. Users must be able to inspect why an analysis was produced and correct or contest canonical records and interpretations.
7. Raw/private corpora and credentials must not be committed to Git.
8. The GitHub repository is public. Private conversation locators, including Kimi chat links, must not be retained in it.
9. Reusable insight must be decoupled from concrete cases and de-identified. Cases are excluded by default; only an explicitly authorized template may be uploaded after de-identification and review.
10. Position scores and recommendations must be perspective-, objective-, horizon-, and risk-bound; StockMesh must not imply a universal social value score.
11. Prediction must expose assumptions, uncertainty, alternative branches, and stop/replan conditions; long search depth must not be presented as certainty.
12. A Web workbench is the intended primary human interface, with text/dialogue input, authorized conversation-table or screenshot staging, a position board, timeline, Pawn detail, and scenario comparison.
13. External Agents need a narrow Skill-compatible interface for inspection, analysis, simulation, replay, and reviewed staging without direct canonical writes.
14. A local case, dataset, or profile may validate the general model but must not define universal core semantics by itself.
15. Domain-specific concepts—such as personality, stance, organizational authority, energy flow, biological signaling, or orbital relation—belong to explicit profiles built on the same core evidence, node, relation, event, state, and time contracts.
16. A strategy step must link its before-Position, input (such as an Utterance or Action), resulting Event/Transition, after-Position, mode, and evidence. An utterance alone does not prove intent, personality, or outcome.
17. Position evaluation must be multi-party and objective-bound. Support, influence, relationship quality, wealth/resources, information, risk, and other goals are profile dimensions—not one universal social score—and a scalar is optional and inspectable.
18. Every reachable Position may receive an Evaluation, but insufficient evidence must yield unknowns, ranges, or uncertainty rather than invented precision.
19. Search must expose depth/branch budget, candidate-generation boundary, pruning rationale, diversity, and uncertainty policy. Monte Carlo tree search, beam search, or other algorithms remain implementation candidates until later validation.
20. A Strategy Step may change Relations, Flows, State, resources, support, or other profile-defined quantities; the before/after Position difference must show those modeled effects.
21. Analytical Methods must be replaceable and composable above the shared data foundation. A method declares its scale, applicable profile and question, required inputs, provenance/version, assumptions, limitations, and uncertainty treatment.
22. Macro network or historical methods and micro interpersonal or language methods may cooperate on one analysis, but their outputs remain separately attributable and may disagree.
23. A method output is a Claim, Evaluation, candidate Transition, Prediction, or Recommendation with trace—not a silent mutation of source evidence or a fact about a represented person.
24. Informal heuristics and named psychological or strategic schools may be available as explicitly labeled lenses; StockMesh must not present them as validated universal laws merely because they are familiar or useful.
25. Classical SNA and multi-Agent social simulation are complementary candidate Method families. Structural metrics or simulated reactions must remain traceable derived results in the model or possibility planes, never replacements for source evidence.

## Current priorities

1. Establish the requirements-rooted universal core and show that it can express several materially different network domains without company-only fields.
2. Validate a narrow, useful company profile with synthetic or explicitly authorized data.
3. Establish a provenance-aware event/state history and reconstructable Position contract.
4. Demonstrate contextual retrieval, profile-defined evaluation, and explainable scenario simulation.
5. Validate the human Web workbench and a narrow read/analysis Agent interface.
6. Learn from real use before hardening profile semantics or deep search.

## Open product decisions

- The first concrete company workflow and primary user persona.
- Whether the first Web workbench is local-only or includes a shared service boundary.
- Which classes of real company data, if any, are authorized for a pilot.
- Which analysis methods provide useful insight without encouraging overconfident surveillance or profiling.
- What user correction and appeal workflow is required for human subjects represented in the graph.
- The first evaluation profile and useful scenario depth for the company pilot.
- How multi-party Objectives and stake/weights are elicited, contested, and updated over time.
- Which search/pruning policy gives useful depth without hiding uncertainty or minority-party harm.
- Whether external Agents in v1 may stage evidence or remain read/analysis-only.
- Which context fields make an organizational Position complete enough for a strategy step without claiming whole-world completeness.
- What project or tool the user's term `ucient` refers to; `unet` was corrected to `ucient` in [DW-019](../discovery/direct-wording.md#dw-019--unet-corrects-to-ucient), but no identity is inferred without evidence.
- Which macro and micro method families earn inclusion, how they are validated, and how conflicts between them are surfaced.
- What can be learned from the user-named simulation/collective-agent and SNA references without treating any project or tool as a required dependency.
