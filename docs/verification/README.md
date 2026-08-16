# Verification cases and evidence

Purpose: define how documentation and delivery claims are checked. Product acceptance criteria live in [product/acceptance.md](../product/acceptance.md).

## Init verification checklist

- [x] Repository root is a Git repository on branch `main`.
- [x] Root recovery hook orders Goal/task-state API before the active-plan link.
- [x] The documentation index links every primary authority.
- [x] Internal Markdown links resolve.
- [x] Direct wording, external sources, Agent interpretation, and adopted decisions are distinguishable.
- [x] Git ignores secrets, runtime/private data, and common build artifacts.
- [x] No Kimi/private conversation locator or concrete case detail is present in tracked content.
- [x] GitHub visibility is `PUBLIC`.
- [x] `LICENSE` is the MIT License.
- [x] Initial commit exists and the closure verification confirmed a clean working tree.
- [x] GitHub remote can be read back and matches the local origin.
- [x] Observer findings are recorded in the init observation authority.

## INIT-001 evidence — 2026-08-16

- `scripts/verify-repository.ps1`: passed for 14 Markdown files.
- Forbidden-content scan: no Kimi conversation URL/chat ID or concrete case content retained; a manual review also found no linkable case narrative.
- GitHub API readback: `jadelaglace/StockMesh`, visibility `PUBLIC`, default branch `main`.
- Git remote readback: `origin` is `git@github.com:jadelaglace/StockMesh.git`; initial `origin/main` resolved to `8e9d079697ca77bd70f15a96f6911c9daab6ab46` before this closure update.
- Observer report: recorded under [meta observations](../meta/product-docs-init-observations.md).

## DOC-001 evidence - 2026-08-16

- [Prior-art and reuse survey](../discovery/prior-art-survey.md) records official-source evidence and Agent interpretation for Stockfish/search, SNA, diffusion, Agent simulation, causal/probabilistic, conversation/NLP, visualization, storage, and organizational-network products.
- The survey classifies candidates as reuse, evaluate, reference/external, or avoid/replace and records license posture, alternatives, and adoption gates. No source code or dependency was added.
- `scripts/verify-repository.ps1`: passed for 20 Markdown files, including internal links, recovery-hook order, public-content markers, and private/default-excluded paths.
- `scripts/validate-synthetic-contract.ps1`: passed for the unchanged published `stockmesh.domain@0.1.0` and `stockmesh.synthetic.unfinished-record.v0.1` artifacts.
- `git diff --cached --check`: passed for the documentation-only staged change set.
- Manual public scan found no Kimi locator, conversation ID, Tavily URL/API key, credential signature, or case material. The temporary research credential was not written to the repository.
- Product acceptance, dependency adoption, runtime implementation, and a real business workflow remain pending human decision.

## ARCH-001 evidence - 2026-08-16

- [Architecture direction](../architecture/architecture.md#candidate-v0-local-first-modular-monolith) defines one complete synthetic user loop, a local-first modular-monolith topology, canonical/derived data ownership, seven narrow replacement ports, a legible v0 Method/search baseline, requirement trace, delivery path, and evidence-based upgrade triggers.
- The candidate chooses Python/FastAPI/Pydantic, SQLite/SQLAlchemy/Alembic, NetworkX, React/Vite, Cytoscape.js/ECharts, pytest, and Playwright only as a reviewable v0 path. No dependency was installed and no implementation was created.
- Official repository license metadata was checked for the candidate foundation; all selected projects are permissive, while SQLite is public domain. NetworkX's official BSD-3-Clause text was read separately because GitHub reports `NOASSERTION`.
- `scripts/verify-repository.ps1`: passed for 20 Markdown files; `scripts/validate-synthetic-contract.ps1`: passed for the unchanged `stockmesh.domain@0.1.0` artifacts; `git diff --check`: passed.
- Requirements, acceptance, Web workbench behavior, and the external Agent capability contract were reviewed and left semantically unchanged: the candidate architecture implements those authorities rather than redefining them.
- User architecture acceptance, exact dependency versions, lockfile/transitive-license review, runtime implementation, and real-workflow proof remain pending.

## SPEC-001 evidence — 2026-08-16

- Candidate authorities exist for domain, Web workbench, and external Agent capabilities and are linked from the documentation index.
- Requirements, PRD, acceptance, and architecture trace the new semantics without claiming an implemented engine or accepted product scope.
- Domain review confirms that Pawn traits, stance, atmosphere, and predicted behavior are attributed assertions rather than timeless facts.
- Evaluation review confirms that scores are perspective-, objective-, horizon-, risk-, and evidence-bound and remain vector-first.
- Scenario review confirms that depth is a search budget and every Line requires assumptions, uncertainty, alternatives, and replan triggers.
- Repository checker passed for 17 Markdown files; the private-source scan found no Kimi conversation locator, supplied chat identity, retained case title, or private case narrative.

## DATA-001 evidence — 2026-08-16

- StockMesh private dataset manifest reports `cleaned-unfinished-dormant-candidate` and `babata_used: false`.
- Raw A-series preservation: 70 ordered messages / 121,019 source characters; upper-level reference: 8 messages / 8,778 source characters.
- Cleaned readback: 70 messages, 12 private role records, 15 Main Line events, 35 Kimi analysis Variations, and 4 user-originated upper-level insights.
- Known source gap is fail-visible: the first visible A-series message refers to earlier analysis; no missing opening content was reconstructed as fact.
- Public verification checks counts and boundaries only. Case content, locators, aliases, raw/model text, manifests, and hashes remain outside Git under the ignored `private/` tree.
- Private manifest readback reported `babata_used: false`; the explicit authorization boundary permits Babata only as a Kimi retrieval route, not as StockMesh storage or processing infrastructure.

## R0-001 evidence — 2026-08-16

- Requirements trace maps the user's contextual-network, board-position, evaluation/simulation, broad-domain, strategic-adviser, and case-boundary needs to explicit domain consequences.
- The candidate separates external world, source knowledge, accepted model, and possibilities; actual/reconstructed and hypothetical/predicted Trajectories cannot silently merge.
- Conceptual fit checks cover organizational interaction, microgrid energy flow, and machine collective coordination. All use the same neutral core without adding person, speech, stance, or agency to universal objects.
- `Relation` and `Flow`, `State` and `Event`, `Transition` and optional `Action`, and `Position` and organizational `Stance` have non-overlapping meanings.
- Strategy aliases (`Pawn`, `Move`, `Line`, `Scorecard`) and Game Record semantics are optional application views. Profiles without agency may explain and simulate without offering a “best move.”
- Data schemas, fixtures, business-validation artifacts, implementation, and private-case processing were not created. User adoption of the candidate domain remains pending.

## Evidence policy

Record real command/API results before checking an item. A present file proves only that the scaffold exists. It does not prove a real analysis workflow, product acceptance, or operational closure.

Run `./scripts/verify-repository.ps1` from the repository root. It checks the recovery hook (including a reversed-order negative mutation), internal Markdown targets, forbidden Kimi conversation locators, common credential signatures, and private/default-excluded case paths.

## R1-001 evidence — 2026-08-16

- `scripts/validate-synthetic-contract.ps1`: passed for `stockmesh.domain@0.1.0` and `stockmesh.synthetic.unfinished-record.v0.1`.
- The contract declares the universal semantic types, four planes, epistemic statuses, temporal fields, strategy aliases, Game Record rules, Assertion-to-Claim compatibility, and append-only promotion invariant.
- The synthetic record is explicitly marked `synthetic-only`; all source identities are invented and have null locators. Its ongoing Game Record has three actual/reconstructed Main Line Events, one Position frontier, one predicted Variation, and no promotion record.
- The validator checks reference integrity for claims/evidence, Main Line events, frontier/actions, Variation/trajectory modes, unique IDs, contract pinning, unfinished status, rewrite prohibition, and forbidden private Kimi/Babata markers.
- `scripts/verify-repository.ps1`: passed for 19 Markdown files and now invokes the synthetic contract validator; `git diff --check`: passed. No private Kimi material, locator, or case data was used or published.
- Product acceptance remains pending; the fixture proves contract structure only, not a real business workflow.
