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
