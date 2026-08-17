# StockMesh contracts

This directory contains versioned, transport-neutral contract candidates and
fully synthetic examples. It is downstream of the adopted domain direction in
[ADR-003](../docs/decisions/README.md#adr-003--requirements-rooted-domain-direction)
and upstream of any implementation schema or runtime API.

## Boundary

- `v0.1/contract.json` defines semantic objects, required trace fields, modes,
  aliases, and promotion invariants. It is a reviewable contract, not a choice
  of database, model provider, framework, or frontend.
- `v0.1/synthetic-unfinished-record.json` is a completely invented fixture. It
  contains no private Kimi material, company data, real names, or source links.
- `../scripts/validate-synthetic-contract.ps1` checks the contract and fixture
  structure only. Passing it does not prove a real workflow or product
  acceptance.
- `v0.2/contract.json` is an independent candidate snapshot that adds frozen
  branch context/profile identity, explicit Variation purpose, Forecast
  Assessment and observation coverage, reviewed profile-Claim revision,
  Strategy Step trace, replay/cache identity, and separate calibration records.
- `v0.2/synthetic-organizational-learning-record.json` is a fully invented P0
  learning-loop fixture. `v0.2/p0-acceptance-matrix.json` freezes the twelve P0
  criteria, and `../scripts/validate-p0-contract.ps1` validates them plus four
  deliberate negative mutations.

The fixture uses the neutral core where possible and renders an optional
organizational strategy view with `Pawn`, `Game Record`, `Main Line`, and
`Variation`. Predicted branches remain hypothetical and cannot promote
themselves into history.

## Candidate minor version

The adopted direction in
[ADR-006](../docs/decisions/README.md#adr-006--realized-reactions-revise-profile-claims-and-calibrate-frozen-forecasts)
is represented by candidate `stockmesh.domain@0.2.0` rather than a reinterpretation
of `0.1.0`. The candidate covers branch purpose, frozen branch-root
profile/context identity, Forecast Assessment, horizon and observation
coverage, many-to-many forecast/actual links, time-bounded profile Claim
revisions, and separate analysis/search calibration.

This is a semantic and synthetic-validation terminal only. It is not a runtime
schema, migration implementation, real-case proof, or accepted product scope.

## Version policy

Contract versions use `major.minor.patch` semantics while the contract remains
pre-1.0:

- `major`: reserved for an adopted incompatible universal-domain change;
- `minor`: adds or changes reviewable semantics or required fields;
- `patch`: clarifies wording or validation without changing meaning.

Every fixture pins the exact contract version. A newer contract does not
silently reinterpret an older fixture; migration or compatibility evidence must
be explicit.
