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
