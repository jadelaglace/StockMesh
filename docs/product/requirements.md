# Current requirements

Purpose: state the current interpreted product outcome and constraints. Upstream authorities are [DW-001](../discovery/direct-wording.md#dw-001--initial-stockmesh-brief), the public/case boundary in [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary), and the strategic domain direction in [DW-006](../discovery/direct-wording.md#dw-006--chess-like-domain-simulation-ui-and-agent-interface). Downstream consumers are the PRD, candidate domain model, acceptance, design, architecture, and integration contract.

## Product intent

StockMesh should help a user understand how a network behaves by placing new people, relationships, statements, events, and contextual evidence into an evolving graph and immediately seeing plausible patterns, tensions, alignments, and historical context. It should support cumulative learning: new evidence refines understanding instead of producing an isolated one-off answer.

## Initial scope

The first practical scope is company social-network analysis across departments:

- people and organizational units;
- observed relationships and interactions;
- time-indexed events and statements;
- behavior patterns and expressed positions;
- contextual analysis across multiple evidence items;
- views that help a user inspect the basis of an interpretation.

The core interaction should resemble a strategy workbench: build a bounded analysis Playground, represent people or other analysis nodes as Pawns, reconstruct the current Position from a timeline, evaluate it under an explicit objective, simulate plausible next Moves and responses, and advise the human operator. The product serves as a strategic adviser rather than a second-by-second autonomous operator.

## Long-range scope

The underlying model should not assume that every node is a person or that every network is a company. Future domains may include social communities, institutions and interest groups, material or energy networks, biological collectives, AI/machine collectives, and macro-scale networks. This is a direction for extensibility, not current delivery scope.

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

## Current priorities

1. Validate a narrow, useful company scenario with synthetic or explicitly authorized data.
2. Establish a provenance-aware event log and reconstructable Position contract.
3. Demonstrate contextual retrieval, an inspectable multi-dimensional scorecard, and several explainable scenario Lines.
4. Validate the human Web workbench and a narrow read/analysis Agent interface.
5. Learn from real use before hardening broad domain types or deep search.

## Open product decisions

- The first concrete company workflow and primary user persona.
- Whether the first Web workbench is local-only or includes a shared service boundary.
- Which classes of real company data, if any, are authorized for a pilot.
- Which analysis methods provide useful insight without encouraging overconfident surveillance or profiling.
- What user correction and appeal workflow is required for human subjects represented in the graph.
- The first evaluation profile and useful scenario depth for the company pilot.
- Whether external Agents in v1 may stage evidence or remain read/analysis-only.
