# Verification cases and evidence

Purpose: define how documentation and delivery claims are checked. Product acceptance criteria live in [product/acceptance.md](../product/acceptance.md).

## Init verification checklist

- [ ] Repository root is a Git repository on branch `main`.
- [ ] Root recovery hook orders Goal/task-state API before the active-plan link.
- [ ] The documentation index links every primary authority.
- [ ] Internal Markdown links resolve.
- [ ] Direct wording, external sources, Agent interpretation, and adopted decisions are distinguishable.
- [ ] Git ignores secrets, runtime/private data, and common build artifacts.
- [ ] No Kimi/private conversation locator or concrete case detail is present in tracked content.
- [ ] GitHub visibility is `PUBLIC`.
- [ ] `LICENSE` is the MIT License.
- [ ] Initial commit exists and working tree is clean.
- [ ] GitHub remote can be read back and matches the local origin.
- [ ] Observer findings are recorded in the init observation authority.

## Evidence policy

Record real command/API results before checking an item. A present file proves only that the scaffold exists. It does not prove a real analysis workflow, product acceptance, or operational closure.

Run `./scripts/verify-repository.ps1` from the repository root. It checks the recovery hook (including a reversed-order negative mutation), internal Markdown targets, forbidden Kimi conversation locators, common credential signatures, and private/default-excluded case paths.
