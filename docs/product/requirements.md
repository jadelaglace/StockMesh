# Current requirements

Purpose: state the current interpreted product outcome and constraints. Upstream authorities are [DW-001](../discovery/direct-wording.md#dw-001--initial-stockmesh-brief) and the public/case boundary in [DW-002](../discovery/direct-wording.md#dw-002--public-repository-and-case-data-boundary); downstream consumers are the PRD, acceptance, and architecture documents.

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

## Current priorities

1. Validate a narrow, useful company scenario with synthetic or explicitly authorized data.
2. Establish a provenance-aware temporal graph and analysis contract.
3. Demonstrate contextual retrieval plus explainable hypotheses.
4. Learn from real use before hardening a broad platform or choosing premature abstractions.

## Open product decisions

- The first concrete company workflow and primary user persona.
- Whether the first interface is a CLI, notebook, local web application, or another form.
- Which classes of real company data, if any, are authorized for a pilot.
- Which analysis methods provide useful insight without encouraging overconfident surveillance or profiling.
- What user correction and appeal workflow is required for human subjects represented in the graph.
