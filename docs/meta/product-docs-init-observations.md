# Product-docs skill observations during StockMesh init

Purpose: record init-phase observations from the requested observer Agent. This is process evidence, not StockMesh product authority.

## Observation protocol

- Observer: delegated read-only Agent `init_observer`
- Date: 2026-08-16
- Scope: empty-directory repository initialization using the `product-docs` skill
- Boundaries: observer does not modify files or remote resources; findings distinguish project-local adoption from general skill improvement.

## Findings

### Adopted in StockMesh

- Established a single authority chain from direct wording through requirements, PRD, acceptance, architecture, live delivery state, and verification.
- Kept user wording, external material, Agent interpretation, and adopted decisions distinct.
- Propagated public-repository and case-data constraints from their direct wording authority rather than treating them as local implementation notes.
- Added a bounded root recovery hook and a checker with a reversed-order negative mutation.
- Kept status dimensions honest: documentation scaffold, external-content access, Git publication, real workflow proof, and human acceptance are separate.
- Added public-content checks, while retaining a human review obligation for combinations of details that may still make a case linkable.

### Generalizable `product-docs` skill improvements

1. Add a greenfield-init route that helps choose a minimum authority chain, optional roles, and combine-versus-split thresholds before generating files.
2. Add an initial-goal event such as `user-explicit-goal-start`; the current transition examples cover override, terminal promotion, and blocker replan but not first creation.
3. Provide a reusable recovery-hook checker example scoped to marker boundaries, compatible with LF and CRLF, and verified through a reversed-order mutation.
4. Add a “public repository / private sources” init checklist that separates private locators, source bodies, case mappings, private provenance, safe derivatives, and explicitly authorized templates.
5. Define zero-evidence external-source states such as locator supplied, body inaccessible, privately acquired content, and safe derivative retained.
6. Require a requirements opening to identify all effective direct-wording authorities, not only the initial brief.
7. Provide multi-axis init terminals: documentation scaffold verified, local Git initialized, remote created, push read back, and human acceptance.
8. Offer a short init routing summary that points to the full references after the Agent identifies the required roles and risk boundaries.

### Observed friction

The full skill plus four mandatory references are governance-rich but heavy for an empty repository. A first implementation of the negative mutation also assumed platform newline style and failed until the check was scoped and made newline-independent. These are process findings, not StockMesh product requirements.
