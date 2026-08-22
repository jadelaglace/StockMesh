# Current requirements

Purpose: state the current interpreted product outcome and constraints. Upstream authorities are [DW-001](../discovery/direct-wording.md#dw-001--initial-stockmesh-brief), the public/case boundary in [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary), the strategic domain direction in [DW-006](../discovery/direct-wording.md#dw-006--chess-like-domain-simulation-ui-and-agent-interface), the requirements-first correction in [DW-010](../discovery/direct-wording.md#dw-010--requirements-first-not-case-first), adopted domain direction [ADR-003](../decisions/README.md#adr-003--requirements-rooted-domain-direction), the transition/search refinements in [DW-013](../discovery/direct-wording.md#dw-013--a-sentence-is-a-strategy-step-between-complete-positions) and [DW-014](../discovery/direct-wording.md#dw-014--score-and-search-reachable-multi-party-positions), the method-layer clarifications in [DW-015](../discovery/direct-wording.md#dw-015--data-foundation-with-an-open-multidisciplinary-reasoning-layer) and [DW-016](../discovery/direct-wording.md#dw-016--macro-network-methods-and-micro-interpersonal-methods), the adopted search/replay/client correction in [DW-023](../discovery/direct-wording.md#dw-023--configurable-search-scale-and-a-typescript-first-runtime-challenge), [DW-024](../discovery/direct-wording.md#dw-024--agent-led-analysis-with-framework-owned-branching-and-replay), [DW-025](../discovery/direct-wording.md#dw-025--adopt-the-corrected-architecture-direction-and-expose-algorithm-selections), and [DW-026](../discovery/direct-wording.md#dw-026--llm-analysis-service-with-web-first-and-skillcli-client-access), the realized-reaction learning requirement in [DW-027](../discovery/direct-wording.md#dw-027--real-reactions-incrementally-revise-pawn-hypotheses-and-calibrate-forecasts), and the default Simplified Chinese presentation correction in [DW-034](../discovery/direct-wording.md#dw-034--default-the-workbench-and-public-synthetic-example-to-simplified-chinese). Downstream consumers are the PRD, candidate domain model, acceptance, design, architecture, and integration contract.

## Product intent

StockMesh should help a user understand how a network behaves by placing new nodes, relationships or flows, events, state observations, and contextual evidence into an evolving model and immediately seeing the relevant Position, history, patterns, risks, and possible developments. It should support cumulative learning: new evidence refines understanding instead of producing an isolated one-off answer.

When the user adds what actually happened next, each Party's observed reaction becomes new evidence. It may support, weaken, contextualize, or supersede earlier time-bounded Claims about a Node/Pawn, and it also tests the forecasts made from the earlier Position. StockMesh must preserve both histories: what the system believed and predicted at the old cutoff, and what later evidence caused it to believe now.

In an agentic dialogue or interaction profile, each utterance or other contextual action may be modeled as a strategy step: a traceable input that transforms one complete, question-bounded Position into the next. A provider-neutral LLM analysis boundary interprets statements and relationships, proposes possible Actions and responses, and explains situation evaluations. The framework supplies branch-specific context and quantitative Methods, preserves evidence and transition history, caches materialized possibilities, and prevents LLM output from silently becoming fact. Human users primarily work through the Web workbench; Agent Skill and CLI clients provide lighter access to the same capabilities.

Evidence-linked Nodes, Relations, Flows, Events, State, time, and Positions form the durable data foundation. Above it, StockMesh may combine macro methods such as historical analogy, social-network analysis, social behavior, and communication/propagation analysis with micro methods such as personality lenses, interpersonal conventions, conversation analysis, and wording optimization. These are inspectable analytical lenses, not automatic truths about a person or guarantees that history will repeat.

For a declared set of people, coalitions, organizations, or other Parties, every materialized Position should be evaluable against each Party's explicit Objectives, stake/weights, horizon, constraints, and uncertainty. StockMesh may combine retrieval and historical comparison, rules and heuristics, graph analysis, statistical or learned methods, and search/planning to produce alternative Lines. The combination and search policy remain open; no single technique, including Monte Carlo or a pure rule system, defines the product.

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
13. Agent Skill and CLI clients need a narrow interface for branch-specific context, analysis, simulation/search, branch selection, replay, and reviewed staging without direct canonical writes. They call the same application and LLM-analysis capabilities as the Web workbench rather than becoming a separate analysis authority.
14. A local case, dataset, or profile may validate the general model but must not define universal core semantics by itself.
15. Domain-specific concepts—such as personality, stance, organizational authority, energy flow, biological signaling, or orbital relation—belong to explicit profiles built on the same core evidence, node, relation, event, state, and time contracts.
16. A strategy step must link its before-Position, input (such as an Utterance or Action), resulting Event/Transition, after-Position, mode, and evidence. An utterance alone does not prove intent, personality, or outcome.
17. Position evaluation must be multi-party and objective-bound. Support, influence, relationship quality, wealth/resources, information, risk, and other goals are profile dimensions—not one universal social score—and a scalar is optional and inspectable.
18. Every Position actually materialized by an analysis/search run must receive a traceable multi-party Evaluation, but insufficient evidence must yield unknowns, ranges, or uncertainty rather than invented precision. Merely conceivable but unexpanded possibilities are not claimed as evaluated.
19. Search must support a variable branching factor and configurable depth, materialized-Position, time, token, and cost budgets. It must expose candidate-generation boundaries, pruning/selection rationale, diversity, and uncertainty policy. A small smoke-test fixture is not an architecture cap; Monte Carlo tree search, beam/best-first search, Agent-guided exploration, or other algorithms remain replaceable policies.
20. A Strategy Step may change Relations, Flows, State, resources, support, or other profile-defined quantities; the before/after Position difference must show those modeled effects.
21. Analytical Methods must be replaceable and composable above the shared data foundation. A method declares its scale, applicable profile and question, required inputs, provenance/version, assumptions, limitations, and uncertainty treatment.
22. Macro network or historical methods and micro interpersonal or language methods may cooperate on one analysis, but their outputs remain separately attributable and may disagree.
23. A method output is a Claim, Evaluation, candidate Transition, Prediction, or Recommendation with trace—not a silent mutation of source evidence or a fact about a represented person.
24. Informal heuristics and named psychological or strategic schools may be available as explicitly labeled lenses; StockMesh must not present them as validated universal laws merely because they are familiar or useful.
25. Classical SNA and multi-Agent social simulation are complementary candidate Method families. Structural metrics or simulated reactions must remain traceable derived results in the model or possibility planes, never replacements for source evidence.
26. Natural-language situation analysis, relationship/stance interpretation, candidate wording, likely-response reasoning, and qualitative strategy judgment belong to a provider-neutral LLM analysis boundary. It may be implemented by an LLM API, local model, or Agent-hosted model. Deterministic code and analytical libraries provide attributable measurements, constraints, retrieval, and reproducible features; they do not become a hidden universal social rule engine.
27. Main Line history and hypothetical Variations must share one navigable Position/Strategy Step graph while retaining different modes. Users can pin selected forecasts, return to any earlier Position, fork a new what-if analysis, and resume cached branches without promoting a forecast into observed history.
28. A cached LLM-analysis or Method result is reusable only under a declared identity that includes the Position/context cutoff, branch path or context manifest, profile and Method versions, provider/model configuration, objectives, and search policy. Changed authority inputs must invalidate or visibly supersede stale results.
29. Forecast generation uses the Node/Pawn profile visible at the branch root and treats profile attributes as stable by default. Any simulated profile change must be an explicit, attributed Transition assumption rather than a silent rewrite during search.
30. A newly observed reaction may trigger candidate revisions to profile Claims, but the system must preserve alternatives such as real attribute change, an earlier mistaken estimate, a context-specific exception, changed constraints, or incomplete evidence. One action does not automatically prove a stable trait or motive.
31. Branch purpose and later realization are independent. A possibility is explicitly `forecast`, `counterfactual`, or `exploratory`; only a forecast claims possible future realization. A forecast may later match, partially match, diverge, remain pending/unknown, or reach its horizon without an observed match, while an actual Event may have been forecast or may be an unpredicted surprise.
32. Matching later reality to an earlier forecast appends a traceable assessment link; it never changes the forecast's original content, probability/rank, context, profile snapshot, or provider/Method identity. One realized Event may match several forecasts and one forecast may match several realized Events.
33. “Did not happen” is not inferred from missing data alone. A no-match/expired assessment requires the declared horizon to have elapsed and sufficient observation coverage; otherwise the status remains pending or unknown.
34. Realized reactions support two separately attributable learning paths: revision of subject/network Claims and calibration of the AnalysisPort, Methods, or Search Policy. Forecast text or model self-consistency alone is not evidence about the represented person or world.
35. A component upgrade or replacement recommendation must identify the exact baseline and candidate configurations, freeze metrics and targets before observations, compare paired scenarios under declared scopes, and expose missing evidence, sample counts, improvement, and regressions. Insufficient evidence yields defer rather than an invented winner, and a recommendation cannot automatically mutate provider, Method, Search Policy, package, canonical, or possibility state.
36. The Web workbench defaults to Simplified Chinese while retaining an English switch. All Web-owned presentation vocabulary must follow the selected locale. Repository-owned public synthetic examples may provide locale-specific presentation copy for their Main Line, objectives, Pawns, branches, and explanatory caveats, but the underlying synthetic records remain unchanged; imported evidence, user input, private/real records, identifiers, and canonical Domain data must never be silently translated or rewritten.

## Current priorities

1. Establish the requirements-rooted universal core and show that it can express several materially different network domains without company-only fields.
2. Validate a narrow, useful company profile with synthetic or explicitly authorized data.
3. Establish a provenance-aware event/state history and reconstructable Position contract.
4. Demonstrate contextual retrieval, profile-defined evaluation, and explainable scenario simulation.
5. Validate the LLM-assisted analysis loop and its traceable branch/replay state in the human Web workbench, then expose the same capabilities through Agent Skill and CLI clients.
6. Close the loop from later observed reactions to reviewed profile-Claim revisions and cutoff-correct forecast calibration before hardening profile semantics or deep search.

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
- Which profile Claims are eligible for incremental learning, how much evidence is required, and when human review is mandatory before a proposed revision affects the current Position.
- What forecast-match rubric and observation-coverage evidence are useful enough to calibrate an LLM/Method without rewarding vague predictions or hindsight matching.
