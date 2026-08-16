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

## Evidence policy

Record real command/API results before checking an item. A present file proves only that the scaffold exists. It does not prove a real analysis workflow, product acceptance, or operational closure.

Run `./scripts/verify-repository.ps1` from the repository root. It checks the recovery hook (including a reversed-order negative mutation), internal Markdown targets, forbidden Kimi conversation locators, common credential signatures, and private/default-excluded case paths.
