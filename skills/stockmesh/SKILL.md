---
name: stockmesh
description: Inspect and analyze StockMesh Positions, compare or navigate scenario branches, resume search, and stage synthetic evidence through the repository CLI. Use for StockMesh workbench questions and replayable network-strategy analysis; do not use it to accept evidence or edit canonical storage.
---

# StockMesh

Use the repository CLI as the only client boundary. Do not read or edit SQLite,
invent canonical records, or replace StockMesh's configured analysis with your
own unattributed conclusion.

Run commands from the StockMesh repository:

```text
npm run --silent stockmesh -- <capability> --input '<json-object>'
```

Use `--stdin` instead of `--input` when shell quoting would be fragile. Parse
the single JSON envelope from stdout. Treat a nonzero exit and the bounded JSON
diagnostic on stderr as a rejected operation. The complete diagnostic line is
bounded to 512 UTF-8 bytes.

Use only the camelCase fields named for the selected route below. The P5 facade
rejects every unknown or misnamed field before dispatch; do not translate these
requests to the broader candidate contract's snake_case envelope.

## Route intents

- Inspect the current or an exact historical/hypothetical Position:
  `workbench.get` or `context.get`, optionally with `positionId`.
- Compare two materialized Positions: `position.compare` with
  `fromPositionId` and `toPositionId`.
- Run StockMesh analysis: `analysis.run` with an explicit `positionId`.
- Inspect branches: `branch.list`, optionally with `positionId`.
- Pin or fork: `branch.pin` / `branch.fork` with `variationId` and optional
  response `positionId`.
- Replay frozen branch context: `decision.replay` with `variationId`.
- Continue a paused search: `search.continue` with `searchRunId` and, when
  presenting the result in context, `positionId`.
- Stage public synthetic candidate evidence: `evidence.stage` with `text`, ISO
  `observedAt`, and optional response `positionId`. Staging is not acceptance
  or truth.

Always carry returned Position, cutoff, profile, branch, Method, Analysis, and
Evaluation identities into the explanation. Keep forecast, counterfactual,
exploratory, and actual modes distinct. State uncertainty and limitations from
the envelope rather than smoothing them into one confident answer.

P5 has no CLI/Skill command to accept or reject evidence, apply a profile
revision, run arbitrary SQL, ingest private case material, send messages, or
act on represented people. Direct the user to the human Web review workflow for
canonical decisions. Private pilot work requires separate authorization.
