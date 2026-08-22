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

## P0-001 evidence — 2026-08-17

- The [frozen P0 matrix](../../contracts/v0.2/p0-acceptance-matrix.json) contains twelve uniquely identified criteria and explicit non-goals. P0 ends at the semantic/synthetic-validation boundary; runtime, Web, live LLM, private-case use, and product acceptance are excluded.
- Candidate [`stockmesh.domain@0.2.0`](../../contracts/v0.2/contract.json) is a complete independent snapshot. It declares `0.1.0` as its predecessor and records normalized-LF SHA-256 identities for both predecessor artifacts; the P0 validator confirms those older files remain unchanged.
- The fully invented organizational learning-loop fixture contains 13 materialized Positions, 13 multi-party vector Evaluations, 7 Variations spanning forecast/counterfactual/exploratory purpose, 5 Forecast Assessments spanning matched/partially-matched/diverged/expired-unobserved/unknown, and one unmatched actual surprise.
- The fixture traces one reviewed Utterance across evidence, Claim, Action/Event, before/after Positions, Transition, Strategy Step, and Main Line. All Variations retain the same frozen root context/profile snapshot; later accepted profile learning creates a new snapshot without changing the old one.
- A realized sponsor reaction supports one accepted time-bounded Claim revision and two preserved unresolved alternatives. Forecast residuals enter a separate CalibrationRecord that references provider/model, Method, and Search identities but no subject Claim.
- `scripts/validate-p0-contract.ps1`: passed `12/12` frozen criteria and rejected four deliberate mutations: public locator insertion, expired-unobserved with inadequate coverage, assessment of a non-forecast branch, and hindsight profile leakage into a frozen branch root.
- `scripts/validate-synthetic-contract.ps1`: the original `stockmesh.domain@0.1.0` fixture still passed independently.
- `scripts/verify-repository.ps1`: passed the combined documentation, public-content, recovery-hook, `0.1.0` compatibility, and P0 contract gate for 20 Markdown files.
- No private conversation body, locator, alias map, company case, credential, or private data identity was used in the public fixture. No acquisition-tool operation, dependency installation, database/runtime schema, application scaffold, live model call, or product-acceptance claim entered P0.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P0-01 | passed | Synthetic notice/policy, null locators, fixture text scan, targeted public-tree scan |
| P0-02 | passed | Exact `0.2.0` pin and both normalized-LF `0.1.0` hashes |
| P0-03 | passed | Purpose/mode/realization enums plus frozen root context/profile checks |
| P0-04 | passed | `step-syn-ask` end-to-end Utterance/Claim/Event/Transition trace |
| P0-05 | passed | Seven purpose-typed Variations, two pinned branches, exact cache identity |
| P0-06 | passed | Match/partial/divergence and many-to-many actual links plus unmatched surprise |
| P0-07 | passed | Adequate expired coverage and inadequate-coverage unknown; negative mutation rejected |
| P0-08 | passed | Accepted append-only revision, two unresolved alternatives, old/current snapshots |
| P0-09 | passed | Separate CalibrationRecord with run identities and no subject Claim reference |
| P0-10 | passed | One multi-party vector Evaluation for each of 13 materialized Positions |
| P0-11 | passed | Projection/profile/context/Method/analysis/search/cache identities and root-leak mutation |
| P0-12 | passed | Dedicated validator, four rejected mutations, independent `0.1.0` validator, total repository gate |

Terminal defect ledger: none. Human product acceptance: not claimed.

## P1-001 evidence — 2026-08-18

- The frozen [P1 acceptance matrix](p1-acceptance-matrix.json) defines ten criteria over `stockmesh.domain@0.2.0`. P1 remains limited to the TypeScript/Node application core; quantitative SNA Methods, LLM calls and branch search, Web, Skill/CLI, private data, and product acceptance are excluded.
- The pinned runtime is Node `24.14.0` (`.node-version`) with npm `11.9.0`; direct dependencies are exact-versioned in `package.json` and resolved in `package-lock.json`. `npm ci` installed 94 packages with 0 vulnerabilities. The only install notice is the transitive `prebuild-install` deprecation warning.
- `src/persistence/schema.ts` owns schema version 1 and creates staging, evidence, Playground, Node, Relation, Flow, Claim, review, profile snapshot, State, Event, Action, Transition, Utterance, Strategy Step, profile-revision proposal, derived Position, journal, and migration tables. `npm run migrate -- .tmp-p1.sqlite` produced `StockMesh schema ready: v1`; the temporary database was removed and is ignored by the repository policy.
- The application use cases stage and review evidence before canonical insertion, retain evidence content identity and payload metadata, append canonical rows and writer/operation records to `change_journal`, and import only `actual`/`reconstructed` P0 material. Re-importing the same synthetic fixture leaves canonical counts and journal count unchanged.
- `PositionProjector` deterministically scopes Nodes, Relations, and Flows to the selected Playground, applies valid-time intervals, profile-snapshot Claim visibility, and evidence-acquisition cutoff, and selects the latest visible State per subject/type. Its identity includes all position inputs, projector version, and projection content.
- `StockMeshApp.replayPosition` verifies the stored derived identity/content, while `rebuildPosition` removes and reconstructs only a derived Position. Tests prove canonical row counts remain unchanged. A reviewed profile revision appends a new Claim, snapshot, and State; the old snapshot and old Position remain replayable and do not receive the later State.
- The P1 test suite passed after clean install: `9` test files / `9` tests. `npm run typecheck`, `npm run build`, `scripts/validate-synthetic-contract.ps1`, `scripts/validate-p0-contract.ps1`, `scripts/verify-repository.ps1`, and `git diff --check` all passed. The repository gate also validates the P1 matrix and runtime evidence paths.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P1-01 | passed | Exact package versions, lockfile, `.node-version`, clean `npm ci`, typecheck/build/test |
| P1-02 | passed | Versioned SQLite schema/migration owner, migrate CLI, persistence test |
| P1-03 | passed | Staging/review use case and accepted/rejected evidence test |
| P1-04 | passed | Evidence identity, append-only re-import behavior, change journal test |
| P1-05 | passed | Deterministic Position projector and cutoff/profile/playground boundary test |
| P1-06 | passed | Replay identity check and derived-only rebuild test |
| P1-07 | passed | Reviewed Claim revision, old snapshot, and later State test |
| P1-08 | passed | Canonical mode filter and absence of P0 predicted/hypothetical Events |
| P1-09 | passed | Synthetic P0 import -> project -> revise -> replay workflow test |
| P1-10 | passed | Runtime tests, P0/`0.1.0` validators, repository/public-boundary gate, diff check |

Terminal defect ledger: two implementation defects were found and repaired during the round (new-database migration-ledger initialization; a filtered profile-review transition still being referenced by a canonical Strategy Step). Final terminal has no known defects. Human product acceptance: not claimed.

## P2-001 evidence — 2026-08-19

- The frozen [P2 acceptance matrix](p2-acceptance-matrix.json) defines ten criteria over the verified P1 Position/read model. P2 is limited to transparent quantitative Methods and derived results; LLM interpretation, possibility branches/search, Web, clients, private data, and product acceptance remain excluded.
- Five direct Graphology dependencies are exact-versioned in `package.json` and the lockfile: core `0.26.0`, components `1.5.4`, shortest path `2.1.0`, metrics `2.4.0`, and Louvain `2.0.2`. Clean `npm ci` installed 107 packages and audited 108 with 0 vulnerabilities. Installed package metadata reports MIT for all five plus the existing `better-sqlite3`; the existing transitive `prebuild-install@7.1.3` maintenance deprecation remains a non-blocking maintenance risk.
- SQLite schema v2 adds only `method_definitions`, `method_runs`, and `method_results`. Runs freeze Position projection, graph input, Method/version/implementation, normalized configuration, executor, output schema, raw output, caveats, and SHA-256 identities; failed runs retain explicit status without a partial result.
- The replaceable registry/runner and graph adapter convert projected Nodes, Relations, and Flows into a directed weighted graph. Parallel sources aggregate as `unit-observed-edge-count`, retain sorted source provenance, and fail closed when a projected canonical row is missing.
- `sna.foundation@1.0.0` provides outbound k-hop context, directed degree/strength, weak/strong components, reachability/shortest paths, density, reciprocity, local clustering, betweenness, and node-type mixing/assortativity. Every output retains scope and interpretation caveats.
- `sna.pagerank@1.0.0` exposes source-to-target direction, damping/convergence configuration, weight semantics, and a non-universal-influence guard. `sna.community-louvain@1.0.0` exposes the weighted undirected projection and deterministic resolution/seed sensitivity runs, never established factions.
- `sna.temporal-delta@1.0.0` reports typed structural and metric deltas while retaining both Positions' valid time, evidence cutoff, profile snapshot, and projection identity. `sna.party-structural-vector@1.0.0` emits objective/horizon-bound per-Party dimensions, units, uncertainty, Position/Method references, and `aggregateScore: null`.
- Stable canonical JSON plus SHA-256 makes identical Position/Method/configuration inputs reuse the same run and output identities; changed normalized configuration creates a different run. Rebuild deletes and reconstructs only derived Method rows, leaving canonical counts unchanged.
- The clean-install terminal round passed `20` test files / `21` tests, `npm run typecheck`, `npm run build`, both contract validators, `scripts/verify-repository.ps1`, and `git diff --check`. The repository gate validates the exact P2 criterion set, evidence paths, exact dependency versions, runtime artifacts, compatibility, and expanded public-content scan.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P2-01 | passed | Exact package/lock versions; registry replacement contract; clean install; registry test |
| P2-02 | passed | Schema v2 Method tables; explicit P1 v1-to-P2 v2 upgrade; definition/run/result identity and persistence tests |
| P2-03 | passed | Directed graph adapter; provenance/weight semantics; missing-row negative test |
| P2-04 | passed | Typed foundation output and scoped metric test |
| P2-05 | passed | PageRank semantic/parameter guard test; Louvain sensitivity test |
| P2-06 | passed | Typed two-Position temporal delta and dual-time-axis test |
| P2-07 | passed | Objective/horizon/uncertainty-bound Party vectors and null aggregate test |
| P2-08 | passed | Stable replay/output identities and changed-configuration test |
| P2-09 | passed | Canonical count isolation, derived rebuild, and failed-run atomicity test |
| P2-10 | passed | Synthetic P0/P1 projection-to-five-Method workflow plus all terminal gates |

Terminal defect ledger: three defects were found and repaired during the round: the end-to-end test duplicated one P1 projection identity under two Position IDs; the graph adapter could silently omit a projected Relation/Flow missing from canonical storage; and the temporal delta output contract was wider than its actual structured shape. Final terminal has no known defects. Human product acceptance: not claimed.

## FIX-001 evidence — 2026-08-20

- A post-terminal review reproduced four defects not covered by the P2 round: Method-run foreign keys blocked Position deletion-based rebuild; re-projecting one Position ID could change its projection while older Method runs retained the former identity; canonical `INSERT OR IGNORE` paths silently accepted changed content under an existing ID; and Temporal Delta mixed complete Position structural change with metrics over a filtered graph.
- Position persistence now inserts once, treats identical ID/projection input as idempotent, rejects changed reuse of a Position ID, and rejects one projection identity under a second ID. `rebuildPosition` recomputes and verifies the frozen identity without deleting the row, so persisted Method runs remain valid.
- Canonical insertion checks the first accepted journal payload before treating an existing ID as idempotent. Changed content, missing provenance, duplicate evidence content identity, and non-materializing inserts fail closed; repeated unchanged fixture import still creates no new canonical row or journal fact.
- `sna.temporal-delta@1.1.0` exposes `positionStructural` for complete projected Node/Relation/Flow/State changes and `analysisGraphStructural` plus metrics under the declared graph filter. The original `1.0.0` definition/executor remains registered and passed deterministic rebuild, preserving existing run reproducibility.
- New regression cases cover Position idempotency/identity conflict, rebuild after a persisted Method run, canonical-content conflict with transaction rollback, filtered Temporal Delta scope, latest-version selection, and legacy Temporal Delta rebuild. The clean-install round passed 20 test files / 24 tests, typecheck, build, both contract validators, repository/public-boundary checks, and `git diff --check`; 108 installed packages audited with 0 vulnerabilities and only the previously recorded transitive `prebuild-install@7.1.3` deprecation warning.
- GitHub Flow evidence: implementation commit `c45d9ba` was pushed on `codex/fix-p2-integrity`; [PR #1](https://github.com/jadelaglace/StockMesh/pull/1) read back as mergeable with no configured remote checks, then squash-merged to public `main` as `30c9fd7`. Local and `origin/main` matched after merge, and the remote repair branch was absent.

Repair defect ledger: all four reproduced defects passed their direct regression tests; no additional defect was found in the full gate. Requirements, architecture direction, frozen P2 acceptance scope, private/public boundaries, and the P3-P7 queue were reviewed and left unchanged. Human product acceptance: not claimed.

## P3-001 evidence - 2026-08-20

- The frozen [P3 acceptance matrix](p3-acceptance-matrix.json) defines twelve criteria over verified P1 Positions/canonical reads and attributable P2 Method outputs. P3 excludes Web, Skill/CLI clients, private or real company data, automatic canonical promotion, fixed branch/depth limits, provider-quality claims, and product acceptance.
- SQLite schema v3 adds only derived analysis/possibility records: frozen Context Snapshots, Analysis runs, retained candidates, possibility Transitions/Trajectories, purpose-typed Variations, per-Position Evaluations, Search runs/frontier, cache records, Observation Coverage, and Forecast Assessments. The existing staging/review application boundary remains the canonical writer.
- `AnalysisPort` is asynchronous and provider-neutral. The deterministic adapter runs fully offline; the configurable OpenAI-compatible adapter sends the same frozen request under a strict JSON schema, keeps credentials runtime-only, and is verified with a mocked HTTP boundary rather than a real provider call.
- Context identity includes the complete Position projection, cutoff/profile/perspective, ordered branch path, Objectives, horizon/risk/evaluation profile, unknowns, complete attributable Method outputs, projector, and caller manifest. Changed context produces a different identity; dangling projection references and semantic policy drift fail closed.
- Search accepts variable candidate counts and explicit depth, materialized-Position, analysis-call, elapsed-time, token, and cost budgets. It persists partial candidates/frontier, resumes without repeating completed analysis, honors in-flight pause, reattaches exact cached branches, and keeps selection rationale visible.
- Each selected candidate transactionally materializes one possibility Transition, Trajectory, Variation, predicted/hypothetical Position, and multi-Party Evaluation. Pin, checkout, fork, and replay preserve parents/siblings and hypothetical mode; replay verifies Position, Evaluation, Transition, and Trajectory identities.
- Forecast Assessment accepts only forecast Variations and canonical actual/reconstructed references. Match links are many-to-many and append-only; `expired-unobserved` requires an elapsed frozen horizon plus adequate coverage spanning the anchor-to-horizon interval. Forecast, actual history, and profile Claims remain unchanged.
- The synthetic end-to-end test uses a P1 Position and a frozen P2 foundation Method output, generates three root purposes and three second-level forecasts under a configurable frontier, materializes and evaluates six Positions, then compares one frozen forecast with a separate actual surprise. No private case or live provider is used.
- Clean `npm ci` installed 107 packages and audited 108 with 0 vulnerabilities. The existing transitive `prebuild-install@7.1.3` deprecation remains the only install warning. The terminal round passed 27 test files / 35 tests, typecheck, build, both compatibility validators, the P3-aware repository/public-boundary gate, and `git diff --check`.
- GitHub Flow evidence: implementation commit `9d6fa6f` was pushed on `codex/p3-analysis-branch-replay`; [PR #3](https://github.com/jadelaglace/StockMesh/pull/3) read back as `MERGEABLE/CLEAN` with no configured remote checks, then squash-merged to public `main` as `eb6358b`. Local and `origin/main` matched after merge, and the remote implementation branch was absent.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P3-01 | passed | Shared AnalysisPort types; deterministic adapter; mocked structured-output adapter tests |
| P3-02 | passed | Complete frozen context identity and changed-unknown invalidation test |
| P3-03 | passed | Policy-drift and dangling-projection rejection with canonical-table isolation |
| P3-04 | passed | Schema v3 derived tables plus persistence/end-to-end counts |
| P3-05 | passed | Forecast/counterfactual/exploratory branches; pin/fork and non-forecast assessment rejection |
| P3-06 | passed | Configurable multi-axis budgets and variable three-candidate root fixture |
| P3-07 | passed | Partial frontier resume and in-flight user-pause tests |
| P3-08 | passed | Transactional six-Position/six-Evaluation end-to-end proof and invalid-output rollback |
| P3-09 | passed | Exact cache reuse, pin/checkout/fork, and four-identity replay checks |
| P3-10 | passed | Match, many-to-many actual links, expired-coverage negative/positive tests |
| P3-11 | passed | Offline P1 -> P2 -> P3 multi-level synthetic workflow |
| P3-12 | passed | Clean install, 35 tests, typecheck/build, compatibility/public gates, diff check |

Terminal defect ledger: the round repaired obsolete schema-version assertions, one misplaced v3 column, an incomplete context payload that initially omitted Position/Method bodies, and four review defects covering dangling projection identities, in-flight pause/cancel, remaining-depth reporting, and incomplete replay verification. All direct regressions and the fresh terminal round passed. The later FIX-002 review found and repaired three additional integrity defects plus one repair-lifecycle risk; the original P3 scope and frozen matrix remain unchanged. Real provider availability/usefulness and human product acceptance are not claimed.

## FIX-002 evidence - 2026-08-21

- The post-P3 quick review reproduced three uncovered defects: concurrent exact searches could call the provider twice and race one deterministic AnalysisRun into a failed state after successful Variations already referenced it; Forecast Assessment accepted events before the forecast anchor and after its horizon; and reordered many-to-many reference arrays manufactured distinct Assessment identities.
- Forecast Assessment now sorts all reference sets before identity/storage, rejects duplicate identities, accepts only canonical actual/reconstructed Events strictly after the frozen anchor and no later than the horizon/assessment cutoff, and derives the same eligibility from each cited actual Transition's Event causes. Forecast/actual records remain append-only and unchanged.
- The initial concurrent repair used database compare-and-set ownership. A subsequent read-only comparison of the official GPL-3.0 Stockfish `Engine`, `Position`/`StateInfo`, Search worker/manager, thread pool, UCI, evaluation, and transposition-table boundaries identified a restart-liveness risk: persisted `running` state must not also be an execution lock.
- The final implementation separates the three authorities. A store-scoped in-process single-flight map shares one exact provider execution among concurrent coordinators; each AnalysisRun call writes a distinct persisted attempt; and only successful exact identities enter the cache. Failed attempts remain failed when a new retry succeeds, while an orphaned `running` attempt cannot block a later process. No Stockfish source or algorithm was copied or adopted.
- Direct regressions cover concurrent coordinators, one provider call, shared success, failure sharing, preserved failed-attempt retry, separate persisted attempts, pre-anchor/post-horizon Event rejection, Transition timing eligibility, and order-independent Assessment identity. The clean-install terminal round passed 27 test files / 40 tests, typecheck, build, both compatibility validators, the repository/public-boundary gate, and `git diff --check`; 108 packages audited with 0 vulnerabilities and only the existing transitive `prebuild-install@7.1.3` deprecation warning.
- GitHub Flow evidence: [PR #5](https://github.com/jadelaglace/StockMesh/pull/5) read back as `MERGEABLE/CLEAN` with no configured remote checks and squash-merged the initial repair as `2e9572e`. [PR #6](https://github.com/jadelaglace/StockMesh/pull/6) likewise read back as `MERGEABLE/CLEAN` and squash-merged the lifecycle correction as `e0c3932`. Local and `origin/main` matched after both merges, and both remote implementation branches were absent.

Repair defect ledger: all three reproduced defects and the post-repair liveness risk have direct passing regressions. Requirements, frozen P3 acceptance, canonical/possibility ownership, public/private boundaries, and the held P4-P7 route remain unchanged. Real provider behavior, product usefulness, and human acceptance are not claimed.

## P4-001 evidence - 2026-08-21

- The [frozen P4 acceptance matrix](p4-acceptance-matrix.json) defines twelve criteria over the public synthetic organizational learning record and the verified P1-P3 foundation. P4 is limited to one local responsive Web workbench; live-provider quality, Skill/CLI clients, private data, shared deployment, extraction, and human product acceptance remain excluded.
- One React/Vite workbench now exposes the complete synthetic stage-to-inspect-to-analyze-to-branch-to-correct workflow. A thin Fastify host serves the production assets and named HTTP commands over `WorkbenchService`; the browser receives a presentation-safe snapshot and has no SQL, database path, arbitrary table, private-source-body, or direct canonical-writer access.
- Timeline reconstructs the selected cutoff and separates available Main Line, later hindsight, and Variations. The Position board renders question-bounded Nodes, typed Relations, Flows, and States; graph selection and the Node/Pawn drawer expose source/Claim trace, relations/flows, timeline, role/stance fields, and profile-snapshot history without adding profile fields to the universal contract.
- The deterministic provider-neutral analysis path exposes provider/model/configuration and frozen context, keeps separately attributed Method/version output and caveats, materializes forecast/counterfactual/exploratory branches, and shows assumptions, uncertainty, replan triggers, explicit search budgets, and multi-Party vector Evaluation context.
- The branch graph supports checkout, pin, comparison, fork, budgeted resume, and replay. Purpose and realization remain separate; replay visibly checks out the frozen Position, siblings and Main Line remain unchanged, and an accepted profile-revision proposal appends through the existing review/canonical boundary while older Position/profile identities remain stable.
- Visible initial/loading/success/empty/recoverable-error states, semantic buttons and selects, status text independent of color, and keyboard-reachable Node shortcuts cover the primary operations. Playwright passed at desktop and mobile sizes; manual 1440x900 and 390x844 inspection found no page-level horizontal overflow, overlap, blank graph/timeline canvas, or inaccessible branch/score control. The compact Pawn shortcut strip intentionally scrolls within its own boundary.
- The requirement-led review repaired historical Claim/State leakage, Timeline mode mixing, missing Flow/trace interaction, incomplete Pawn detail, missing analysis/evaluation context, replay/branch-tree interaction gaps, command-state failures, draft loss, internal-error disclosure, silent invalid-Position fallback, and structured action rendering. The same round repaired PowerShell 5/7 hash compatibility without changing the P0 contract.
- Supply-chain controls pin npm `11.19.0`, exact direct versions, repository `min-release-age=20160`, and `save-exact=true`; normalize lockfile URLs to the official registry; reject retained temporary mirror hosts; and verify direct dependency licenses. The direct dependency set reports MIT=20, Apache-2.0=3, and ISC=1. The existing transitive `prebuild-install@7.1.3` deprecation remains a non-blocking maintenance notice.
- Fresh clean terminal: `npm ci` installed 236 packages and audited 237 with 0 vulnerabilities; `npm run verify:licenses`, 29 Vitest files / 45 tests, core/Web typechecks, production build, and 2/2 desktop/mobile Playwright projects passed. The P0 validator passed 12/12 and rejected all four deliberate mutations; the independent `0.1.0` validator, P4-aware repository/public-boundary gate, and `git diff --check` passed.
- GitHub Flow terminal: implementation commit `b10829c` was pushed on `codex/p4-web-workbench`; [PR #8](https://github.com/jadelaglace/StockMesh/pull/8) read back as `MERGEABLE/CLEAN` with no configured remote checks and was squash-merged as `e383d5d`. Local `main` and `origin/main` matched after merge, and the remote implementation branch was absent.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P4-01 | passed | Seeded synthetic scope/context snapshot, responsive shell, service and desktop/mobile browser tests |
| P4-02 | passed | Named stage/review use cases, idempotent identity and fail-closed tests, safe HTTP command boundary |
| P4-03 | passed | Cutoff-correct snapshot reconstruction, three explicit Timeline groups, unit and browser checks |
| P4-04 | passed | Cytoscape Node/Relation/Flow rendering, element trace interaction, non-scalar display guards |
| P4-05 | passed | Node/Pawn drawer identity, States/Claims, Relations/Flows, Timeline, stance, profile history, and trace |
| P4-06 | passed | Deterministic AnalysisPort/SearchCoordinator route plus visible provider, frozen context, Method, caveat, assumption, uncertainty, and replan fields |
| P4-07 | passed | Purpose-typed branch tree and checkout/pin/compare/fork/resume/replay regressions |
| P4-08 | passed | Position/branch projection diff and complete multi-Party scorecard context including weights, horizon, risk, cutoff, and uncertainty |
| P4-09 | passed | Reviewed append-only profile correction and unchanged historical Position/profile replay assertions |
| P4-10 | passed | Explicit command states, semantic controls, desktop/mobile Playwright, and manual overflow/canvas inspection |
| P4-11 | passed | Production static host, validated shared API, safe snapshot, named commands, and redacted unexpected-error regression |
| P4-12 | passed | Clean install/audit/license/test/typecheck/build/browser/contract/repository/diff terminal round |

Terminal defect ledger: the bounded review defects above were repaired and the fresh complete round passed with no known P4 terminal defect. Engineering and GitHub Flow terminals: reached. Human product acceptance: still open.

## FIX-003 evidence - 2026-08-22

- The post-P4 review reproduced nine semantic gaps that the original narrow Web checks did not cover: analysis ignored the selected Position; accepted Evidence did not advance the model; profile correction did not advance the current Position; historical trace exposed later Evidence/Analysis; Timeline selection silently fell back from missing Position identities; multiple Assessments duplicated a Variation; Timeline cutoff ignored world-time `asOf`; synthetic branches did not change their projection; and no P4 path rendered a Flow.
- The repair makes Main Line Position identities explicit by materializing the synthetic record's canonical Positions. Workbench analysis, Method runs, Search roots, context snapshots, branch filters, trace, and replay now use the selected Position ID. Timeline events require exact resulting Positions and classify actual Events using both `occurred_time <= asOf` and `recorded_at <= evidence cutoff`.
- Accepted Web Evidence now uses one reviewed application transaction to append a Claim, Profile snapshot, actual Event, and next Position. Accepted profile revisions append a merged current snapshot and resulting Position/Event while preserving the earlier Position/profile identity. Historical snapshots filter Evidence, Method runs, Analysis runs, and branch searches to their own cutoff/root.
- Forecast Assessments are aggregated as append-only history on one Variation. The deterministic synthetic adapter now produces distinct modeled projection deltas and adds a clearly hypothetical Flow only when its evidence cutoff permits the synthetic consultation scenario. No canonical fact is inferred from that branch.
- Direct regressions cover selected/historical analysis isolation, Evidence-to-Position counts and idempotency, current-profile advancement, exact Timeline Position materialization, world-time cutoff, Assessment aggregation, branch projection deltas and Flow rendering, and the HTTP Position-specific analysis contract.
- Fresh terminal: `npm test` passed 29 test files / 46 tests; Core/Web typechecks, production build, `npm run verify:licenses`, P0 and `0.1.0` validators, repository/public-boundary gate, `git diff --check`, and desktop/mobile Playwright (2/2) passed. Human product acceptance remains separate.

Repair defect ledger: the nine reproduced P4 semantic defects have direct passing regressions. FIX-003 supersedes the original P4-001 “no known P4 terminal defect” statement without changing P0-P3 contracts, public/private boundaries, the provider-neutral analysis boundary, or the held P5 scope.

## P5-001 evidence - 2026-08-22

- The [frozen P5 acceptance matrix](p5-acceptance-matrix.json) selects twelve criteria for one real thin-client slice. It does not manufacture placeholder commands for the broader candidate catalog and excludes private pilot data, live-provider claims, client-side review/acceptance, autonomous action, product usefulness, and human acceptance.
- `StockMeshCapabilities` is the one transport-neutral client facade. Existing Web read/stage/analysis/branch/resume routes and the new generic capability route delegate through it; the CLI uses the same in-process runtime and default SQLite path. Workbench, application, AnalysisPort, Method, Possibility, and Search owners remain unchanged.
- The CLI supports exact Position/context inspection, Position comparison, analysis, branch list/pin/fork/replay, search continuation, and synthetic Evidence staging. It emits one JSON envelope on stdout, bounded diagnostics on stderr, and stable success/rejected/internal exit codes. Real subprocess tests use the exact documented `npm run --silent stockmesh -- ...` form and retain state across calls.
- Contributor access stops at `evidence.stage`: repeated identity is idempotent, the item remains staged, and canonical Evidence counts do not change. There is no CLI/Skill capability for review, acceptance, profile application, arbitrary SQL, private ingestion, message sending, or action on represented people.
- The repository [StockMesh Skill](../../skills/stockmesh/SKILL.md) routes conversational intents to the CLI, requires relevant Position/Variation/Search identities, preserves mode and trace distinctions, and explicitly forbids SQLite access or a second unattributed analysis authority. The skill-creator validator passed its frontmatter, naming, metadata, and scaffold checks.
- P5 regressions prove HTTP/facade identity parity, historical Position cutoff isolation, typed Node/Relation/Flow/State comparison without a scalar, branch persistence, staging-only mutation, unknown/malformed/missing/invalid-time input rejection without partial writes, internal error redaction, and one-line CLI output. The established P4 browser workflow remains green through the shared facade.
- Fresh clean terminal: `npm ci` installed 236 packages and audited 237 with 0 vulnerabilities; 31 Vitest files / 51 tests, Core/Web typechecks, production build, direct-license gate, Skill validation, P0 and `0.1.0` validators, P5-aware repository/public-boundary gate, `git diff --check`, and 2/2 desktop/mobile Playwright projects passed. No runtime dependency was added. The existing `prebuild-install@7.1.3` deprecation and approximately 737 KB main Web chunk remain non-blocking maintenance items.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P5-01 | passed | Shared facade plus HTTP/in-process parity tests |
| P5-02 | passed | Real CLI subprocess, stdout/stderr, and exit-code tests |
| P5-03 | passed | Exact Position/context/Method/Analysis/branch identity parity |
| P5-04 | passed | Historical Position analysis and cutoff-isolation regression |
| P5-05 | passed | Cross-process list/pin/fork/replay/resume regression |
| P5-06 | passed | Typed projection delta with Flow addition and no scalar |
| P5-07 | passed | Idempotent staging-only test and absent review/accept capability |
| P5-08 | passed | Skill intent routes and explicit identity/authority constraints |
| P5-09 | passed | Skill validation and public-content gate |
| P5-10 | passed | Malformed/unknown/missing/invalid-time rejection, zero-write assertion, and internal-error subprocess regressions |
| P5-11 | passed | No new dependency/service; existing supply-chain gates preserved |
| P5-12 | passed | Clean install plus full test/type/build/license/Skill/contract/repository/browser/diff terminal round |

GitHub Flow: implementation commit `6d23b9f` was pushed on
`codex/p5-skill-cli`; [PR #11](https://github.com/jadelaglace/StockMesh/pull/11)
was `MERGEABLE/CLEAN`, had no configured remote checks, and squash-merged as
`8ab1b40`. Local and public `main` matched after merge, and the remote
implementation branch was deleted.

Engineering terminal: reached and merged. Human product acceptance remains open.

## FIX-004 evidence - 2026-08-22

- The post-P5 review reproduced five client-boundary defects: historical
  `context.get` returned later Positions/Events/profile history and sibling
  branches; invalid optional response Positions could be rejected only after a
  stage, pin, fork, or search mutation; a failed SearchRun could be wrapped in
  a succeeded capability envelope; unknown or misnamed request fields were
  ignored; and CLI diagnostics had no effective fixed bound.
- `context.get` now returns one selected Position, only canonical Timeline items
  available at its `asOf`/evidence cutoff, only the selected hypothetical
  lineage, relevant SearchRuns, temporally eligible selected-profile metadata,
  and no staging or revision queue. The presentation-oriented `workbench.get`
  remains unchanged.
- Every P5 operation now has a strict camelCase field allowlist. Complete input
  and optional response-Position identities are validated before dispatch, so
  rejected malformed requests do not alter staging, Variation state, or search
  state. The broader snake_case common envelope remains candidate vocabulary,
  not an accepted P5 CLI request.
- Existing failed SearchRuns are retried through the persisted coordinator;
  `analysis.run` returns success only when the resulting run is present and is
  neither failed, cancelled, nor running. CLI diagnostics are centralized and
  the complete JSON stderr line is capped at 512 UTF-8 bytes.
- Direct regressions pass 7/7 across the facade and real CLI subprocess: exact
  historical and hypothetical lineage isolation, strict field rejection, zero
  mutation on invalid requests, failed-run retry, and a 5,000-character input
  diagnostic bounded to 512 bytes.
- Fresh clean terminal: `npm ci` installed 236 packages and audited 237 with 0
  vulnerabilities; an independent `npm audit --audit-level=low` also reported
  0 vulnerabilities. All 31 Vitest files / 53 tests, Core/Web typechecks,
  production build, direct-license gate, Skill validation, P0 and `0.1.0`
  validators, repository/public-boundary gate, `git diff --check`, and 2/2
  desktop/mobile Playwright projects passed.

Repair defect ledger: the five reproduced P5 defects have direct passing
regressions and the fresh full gate found no further FIX-004 defect. No schema,
dependency, provider, Domain, capability catalog, canonical-writer boundary, or
product scope changed.

GitHub Flow: implementation commit `3214712` was pushed on
`codex/fix-p5-capability-integrity`; [PR #13](https://github.com/jadelaglace/StockMesh/pull/13)
was `MERGEABLE/CLEAN`, had no configured remote checks, and squash-merged as
`1128b56`. Local and public `main` matched after merge, and the remote
implementation branch was deleted. Human product acceptance remains open.

## P7-001 evidence - 2026-08-22

- [DW-030](../discovery/direct-wording.md#dw-030--repair-the-reviewed-p6-defects-before-completing-p7) authorized P7 only after FIX-005. The [frozen P7 matrix](p7-acceptance-matrix.json) selects eleven criteria for an advisory measured-hardening boundary; it does not authorize a provider call, package update, automatic component replacement, private-case read, or human-acceptance claim.
- The dependency-free hardening contract accepts exact opaque component/configuration identities, a target-policy identity established before observations, a closed metric/unit/direction catalog, and unique paired scenario/run identities. Unknown body-capable fields, endpoints as identities, post-hoc policy changes, invalid units/ranges, duplicate samples, reused runs, missing user attribution, and candidate measurements without a candidate component fail closed.
- Each target declares absolute threshold, minimum mean improvement, maximum single-scenario regression, required scopes, and minimum paired scenarios per scope. Results expose scope/sample denominators, baseline/candidate means, improvement, regression, limitations, and blockers.
- Direct regressions prove all three decisions: every target passes before `replace-candidate`; complete failed evidence yields `retain-baseline`; absent candidates or missing required human/private observations yield `defer-replacement`. Reports always declare zero component replacement, canonical/possibility writes, provider calls, and package writes.
- Current decision: `defer-replacement`. StockMesh has no concrete candidate component or paired authorized-private usefulness/calibration comparison. The replace/retain examples are synthetic mechanism evidence only, not model/provider quality evidence.
- Fresh local terminal before GitHub publication: the existing clean install remained at 236 packages / 237 audited with 0 vulnerabilities and independent audit also reported 0. All 34 Vitest files / 67 tests, Core/Web typechecks, production build, direct-license gate, Skill validation, P0 and `0.1.0` validators, P7-aware repository/public-boundary gate, `git diff --check`, and 2/2 desktop/mobile Playwright projects passed. No dependency, provider, service, database migration, private-data read, or component replacement entered P7.
- GitHub Flow: implementation commit `2f606a8` was pushed on `codex/p7-measured-hardening`; [PR #19](https://github.com/jadelaglace/StockMesh/pull/19) was `MERGEABLE/CLEAN`, had no configured remote checks, and squash-merged as `71b69e2`. Local and public `main` matched after merge, and the remote implementation branch was deleted. Human product acceptance remains open.

| Criterion | Terminal result | Direct evidence |
| --- | --- | --- |
| P7-01 | passed | Strict component/configuration identities and unknown-field mutations |
| P7-02 | passed | Policy identity and pre-observation timestamp mutation |
| P7-03 | passed | Frozen closed metric catalog with fixed unit/direction/range |
| P7-04 | passed | Validated threshold, improvement, regression, scope, and sample targets |
| P7-05 | passed | Unique paired scenario/run validation and duplicate mutations |
| P7-06 | passed | `not-observed` propagation and required user attribution |
| P7-07 | passed | Transparent per-target denominators, means, checks, limitations, and blockers |
| P7-08 | passed | Direct replace, retain, and defer decision regressions |
| P7-09 | passed | Deterministic report identity and explicit zero-effect envelope |
| P7-10 | passed | Current defer result and open real-use/human evidence gaps |
| P7-11 | passed | Full P0-P7 repository, supply-chain, Skill, and browser gates |

## FIX-005 evidence - 2026-08-22

- The post-P6 review reproduced five defects: body-capable strings passed the
  purported body-free contract; terminal-assessment coverage was mislabeled as
  calibration; reference closure and self-declared denominators overstated
  reconstruction evidence; report publication used a racy truncating write; and
  the public entry/roadmap/status text predated delivered phases.
- `stockmesh.private-pilot-bundle/v2` accepts only namespace-qualified SHA-256
  identities and private policy references. It records an authorized inventory
  identity and denominator basis established before preparation. URLs, prose,
  credential-shaped strings, unknown fields, dangling references, late bases,
  duplicate forecast criteria, and calibration samples attached to ineligible
  branches fail closed.
- The v2 report labels prepared step/role coverage and reference closure for what
  they prove. Forecast scorable coverage and terminal-assessment coverage are
  separate; calibration remains `not-observed` without criterion-level
  probabilities and covered binary outcomes, then reports a Brier score rather
  than treating every assessed forecast as correct.
- The CLI validates input through an open regular-file handle, creates and syncs
  a same-directory exclusive temporary report, and atomically publishes it
  without replacing an existing destination. Malformed input and diagnostics
  remain body-free and bounded.
- Fresh repair terminal before GitHub publication: `npm ci` installed 236
  packages and audited 237 with 0 vulnerabilities; independent `npm audit
  --audit-level=low` also reported 0. All 33 Vitest files / 62 tests, Core/Web
  typechecks, production build, direct-license gate, Skill validation, P0 and
  `0.1.0` validators, repository/public-boundary gate, `git diff --check`, and
  2/2 desktop/mobile Playwright projects passed. No dependency, provider,
  service, database migration, private-data read, or private-case publication
  entered the repair.
- The original private v1 observation remains historical evidence; it was not
  silently reinterpreted as a v2 run. A future authorized private v2 preparation
  must create its coverage basis before preparation and remains outside Git.

## P6-001 evidence - 2026-08-22

- The [frozen P6 matrix](p6-acceptance-matrix.json) selects ten criteria for one
  explicitly authorized local private organizational validation round. It does
  not authorize case publication, a live provider, canonical ingestion,
  collaborative deployment, P7 hardening, or a human-acceptance claim.
- The dependency-free pilot boundary accepts a strict body-free bundle with
  explicit purpose, authorization time, retention/deletion rules, private-only
  publication, opaque source/role/step/branch identities, declared denominators,
  unresolved-item identities, eligible forecast markers, and optional attributed
  user ratings. Unknown body/locator-style fields and dangling references fail
  closed.
- The CLI verifies both input and output through Git ignore before reading or
  writing, resolves existing paths to prevent boundary escape, refuses to
  overwrite its input, redacts malformed JSON, and bounds diagnostics to 512
  UTF-8 bytes. It does not open SQLite or write canonical/possibility state.
- StockMesh locally adapted the already authorized dormant organizational
  record without copying source bodies, summaries, labels, locators, aliases, or
  the case-specific preparation format into Git. The complete bundle, adapter,
  and report remain under the ignored private tree.
- Generalized run observation: 82 opaque source identities support 12 role
  records, 18 confirmed structural steps, and 41 exploratory branches. All 154
  structural source references resolved; prepared reconstruction coverage was
  18/18 and role structural coverage was 12/12. Three unresolved structural
  items remain, or 3/18 items per reconstructed step; this ratio does not
  measure human correction time or claim correctness.
- The 41 retained branches were correctly treated as exploratory material, not
  retroactively promoted to forecasts with invented horizons or match criteria.
  Forecast specificity/calibration therefore remain `not-observed`. Contextual
  usefulness, profile-revision usefulness, and user learning also remain
  `not-observed` until the user supplies attributed judgments after use.

Fresh local terminal: `npm ci` installed 236 packages and audited 237 with 0
vulnerabilities; independent `npm audit --audit-level=low` also reported 0.
All 33 Vitest files / 60 tests, Core/Web typechecks, production build,
direct-license gate, Skill validation, P0 and `0.1.0` validators, P6-aware
repository/public-boundary gate, `git diff --check`, and 2/2 desktop/mobile
Playwright projects passed. No dependency, provider, service, or schema
migration was added.

Terminal defect ledger: no known P6 implementation defect remains after the
direct and fresh full round. The five `not-observed` measurement gaps remain
real pilot results, not engineering failures to hide or synthetic values to
invent.

Post-terminal correction: the later review reproduced five defects that
invalidate the original “no known P6 implementation defect” statement.
[FIX-005](#fix-005-evidence---2026-08-22) repairs the public evaluator and claim
boundary without rewriting the historical private v1 observation.

GitHub Flow: implementation commit `922915b` was pushed on
`codex/p6-private-pilot`; [PR #15](https://github.com/jadelaglace/StockMesh/pull/15)
was `MERGEABLE/CLEAN`, had no configured remote checks, and squash-merged as
`5943274`. Local and public `main` matched after merge, and the remote
implementation branch was deleted. Human product acceptance remains open.

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

## ARCH-002 evidence - 2026-08-16

- [ADR-005](../decisions/README.md#adr-005--llm-analysis-with-framework-owned-state-and-shared-clients) records the user-corrected direction: provider-neutral LLM natural-language analysis; framework-owned Domain/Methods/branch/cache/provenance/replay; primary Web interaction; lightweight Skill/CLI clients.
- The [architecture](../architecture/architecture.md#candidate-v0-local-first-modular-monolith) removes fixed depth/width behavior. Branching factor is context-dependent; search is bounded by declared depth/Position/time/token/cost/uncertainty/diversity budgets; every materialized Position receives a traceable per-Party vector Evaluation.
- Main Line and Variations share a navigable graph with checkout, pin, fork, resume, cache identity, and replay semantics. Branch preferences never promote a forecast into canonical history.
- The adopted v0 direction uses a TypeScript/Node modular-monolith core, React/Vite Web workbench, SQLite through better-sqlite3/Drizzle, Graphology, and a provider-neutral AnalysisPort. Python is an optional named-Method worker, not a mandatory second backend. No dependency, provider, model, or runtime was installed.
- The [selected initial SNA table](../discovery/prior-art-survey.md#selected-initial-social-network-method-pack) distinguishes v0 foundation metrics, exploratory community/influence metrics, and opt-in diffusion experiments, with interpretation guards and replaceable executor routes.
- Official-source foundation eligibility records permissive library licenses and SQLite public-domain status; Node.js repository metadata remains `NOASSERTION`, so exact-version official license/bundled-notice and lockfile review is still required before installation.
- `scripts/verify-repository.ps1`: passed for 20 Markdown files; `scripts/validate-synthetic-contract.ps1`: passed for the unchanged `stockmesh.domain@0.1.0` artifacts; `git diff --check`: passed apart from expected Git line-ending notices.
- A targeted public-tree scan found no Kimi locator, conversation route, Tavily credential marker, or supplied credential prefix. No private case content or Babata operation entered this round.
- Product acceptance, exact model/provider choice, Python Method activation, implementation, and real-workflow proof remain open.

## LEARN-001 evidence - 2026-08-17

- [DW-027](../discovery/direct-wording.md#dw-027--real-reactions-incrementally-revise-pawn-hypotheses-and-calibrate-forecasts) is preserved as the direct authority for learning from newly observed real-world moves and reactions.
- Requirements, PRD, Domain, acceptance, Web design, architecture, Skill/CLI contract, roadmap, and [ADR-006](../decisions/README.md#adr-006--realized-reactions-revise-profile-claims-and-calibrate-frozen-forecasts) agree that forecast generation freezes the branch-root Pawn profile by default and that explicit hypothetical profile change is a modeled assumption.
- Branch purpose (`forecast`, `counterfactual`, `exploratory`) is independent from later realization. Forecast Assessment preserves the old run and records horizon, rubric, observation coverage, many-to-many actual links, and pending/match/partial/divergence/expired/unknown status; unmatched actual reactions remain visible surprises.
- Real reactions can propose append-only, time-bounded profile Claim revisions with competing explanations. Human review controls canonical acceptance; provider/model, Method, and Search calibration is a separate derived path, and prediction text/error is not subject evidence.
- `scripts/verify-repository.ps1`: passed for 20 Markdown files; `scripts/validate-synthetic-contract.ps1`: passed for the unchanged `stockmesh.domain@0.1.0` artifacts; `git diff --check`: passed apart from expected Git line-ending notices.
- A targeted public-tree scan found no private conversation locator, supplied credential signature, or case material. No private dataset processing, Babata operation, dependency, contract mutation, or runtime implementation entered this round.
- Candidate `0.2.0` transport fields, a synthetic learning fixture, match-rubric calibration, product acceptance, and real-workflow proof remain pending.

## DATA-002 evidence — 2026-08-17

- Read-only authenticated retrieval identified six new turns / twelve messages after the prior private baseline. The page was not generating, and its final exchange explicitly closed the conversation stage.
- StockMesh preserved the new source as a separate immutable raw delta rather than overwriting the earlier capture. Browser-to-file content equality and the declared message digest passed exactly.
- Private validation passed for all JSON files, manifest sizes and SHA-256 hashes, message range and count, unique Main Line identities, Variation count, stage-close classification, and the combined 82-message scope.
- The private clean layer now records 18 Main Line events and 41 attributed Kimi Variations. Later user corrections invalidate or qualify earlier Kimi interpretations instead of rewriting them as facts; the user's judgment about a represented person remains explicitly an interpretation.
- The conversation stage is closed, but the represented real-world network is not claimed to have ended. The private case remains dormant validation material and cannot define the universal Domain or become a public fixture without separate explicit authorization and de-identification review.
- Git-ignore checks covered the new raw and clean delta files. `scripts/verify-repository.ps1` passed for 20 Markdown files and the unchanged `stockmesh.domain@0.1.0` synthetic contract; no locator, credential, case body, alias mapping, private hash, or Babata mutation entered Git.
- P0, candidate `0.2.0`, synthetic business validation, runtime implementation, and product acceptance remain unstarted.

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

Run `./scripts/verify-repository.ps1` from the repository root. It checks the recovery hook (including a reversed-order negative mutation), internal Markdown targets, forbidden Kimi conversation locators, common credential signatures, private/default-excluded case paths, unchanged `0.1.0` artifacts, and the complete P0 validator.

## R1-001 evidence — 2026-08-16

- `scripts/validate-synthetic-contract.ps1`: passed for `stockmesh.domain@0.1.0` and `stockmesh.synthetic.unfinished-record.v0.1`.
- The contract declares the universal semantic types, four planes, epistemic statuses, temporal fields, strategy aliases, Game Record rules, Assertion-to-Claim compatibility, and append-only promotion invariant.
- The synthetic record is explicitly marked `synthetic-only`; all source identities are invented and have null locators. Its ongoing Game Record has three actual/reconstructed Main Line Events, one Position frontier, one predicted Variation, and no promotion record.
- The validator checks reference integrity for claims/evidence, Main Line events, frontier/actions, Variation/trajectory modes, unique IDs, contract pinning, unfinished status, rewrite prohibition, and forbidden private Kimi/Babata markers.
- `scripts/verify-repository.ps1`: passed for 19 Markdown files and now invokes the synthetic contract validator; `git diff --check`: passed. No private Kimi material, locator, or case data was used or published.
- Product acceptance remains pending; the fixture proves contract structure only, not a real business workflow.
