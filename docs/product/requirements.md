# Current requirements

Purpose: state the current interpreted product outcome and constraints. Upstream authorities are [DW-001](../discovery/direct-wording.md#dw-001--initial-stockmesh-brief), the public/case boundary in [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary), the strategic domain direction in [DW-006](../discovery/direct-wording.md#dw-006--chess-like-domain-simulation-ui-and-agent-interface), the requirements-first correction in [DW-010](../discovery/direct-wording.md#dw-010--requirements-first-not-case-first), and adopted domain direction [ADR-003](../decisions/README.md#adr-003--requirements-rooted-domain-direction). Downstream consumers are the PRD, candidate domain model, acceptance, design, architecture, and integration contract.

## Product intent

StockMesh should help a user understand how a network behaves by placing new nodes, relationships or flows, events, state observations, and contextual evidence into an evolving model and immediately seeing the relevant Position, history, patterns, risks, and possible developments. It should support cumulative learning: new evidence refines understanding instead of producing an isolated one-off answer.

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
- Whether external Agents in v1 may stage evidence or remain read/analysis-only.
