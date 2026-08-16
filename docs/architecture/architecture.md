# Architecture and data governance direction

Purpose: describe durable ownership and information-flow boundaries that enable [acceptance](../product/acceptance.md). Technology and deployment choices remain open.

```text
authorized sources (read-only)
  -> acquisition / source registry
  -> validation and normalization staging
  -> canonical knowledge + model history
  -> reproducible temporal network / Position projector
  -> evaluation + scenario engine
  -> Web workbench / external Agent contract
                    ^
             human correction and judgment
```

## Data classes and permitted writers

| Data class | Authority | Permitted writers | Rule |
| --- | --- | --- | --- |
| Raw source evidence | External source plus immutable local acquisition record | Authorized acquisition boundary only | Append/read-only after capture; preserve identity and integrity |
| Source registry / provenance | Ingestion core | Validating ingestion commands | Every accepted item has stable source, time, scope and hash/identity evidence |
| Canonical Claims and modeled objects | Knowledge/model core | Validated reconciliation commands | Model adapters never write directly; epistemic status and temporal validity are explicit |
| Canonical Events, States, Relations and Flows | Temporal network core | Validated ingestion/reconciliation commands | Append/correct through traceable revisions; Positions never rewrite modeled history |
| Human judgments and corrections | Human-review record | Authorized human-review workflow | Append attributed decisions; do not rewrite source evidence |
| Positions, indexes, embeddings and views | Projection/derivation pipeline | Rebuildable processors | Bound to as-of time, evidence scope, perspective, and processor identity; deletable/rebuildable |
| Evaluations, possible Trajectories and recommendations | Analysis run store | Evaluation/simulation engine after input validation | Derived and advisory; retain model, weights, assumptions, uncertainty, and lineage |
| Runtime state and logs | Runtime boundary | Runtime services | Kept outside Git and separated from product evidence |
| Credentials and access policy | Secret/config boundary | Authorized operators | Never placed in source data, prompts, ordinary logs, or Git |
| Private source locators and case mapping | Private evidence boundary outside Git | Authorized acquisition/review workflow | Never published; public derivatives use non-linkable safe identities |

## Stable conceptual model

The product-level meanings are owned by the [candidate domain model](../product/domain-model.md). Architecture preserves four distinct planes: external world, source knowledge, accepted model, and possibilities. Its stable storage/processing boundary recognizes Evidence and Claims; Playground, Node, Relation, Flow, State, Event, Mechanism, Transition, Position, Timeline, Perspective, Evaluation, optional Action, and Trajectory.

Profiles own concepts such as person, statement, stance, trust, energy, organism, task, and orbit. `Pawn`, `Move`, `Line`, and `Game Record` are optional strategy-workbench aliases or views, not storage-layer assumptions.

`Utterance` is a communication-profile object. `Strategy Step` is a rebuildable
view joining a contextual input to its before/after Position and Transition; it
does not become a second canonical event log. The Git/state-machine analogy
governs revision, parent/child, branch, and replay semantics without selecting a
runtime implementation.

Reasoning Methods are replaceable derived processors above the evidence,
knowledge, and Position layers. Macro and micro Methods may compose or disagree,
but each result retains method/version, inputs, assumptions, scope, and
uncertainty. A Method may use profile Mechanisms without rewriting them or the
evidence it analyzed. This boundary deliberately leaves rules, retrieval,
graph/statistical/learned analysis, and search algorithms open.

## Key invariants

- Raw evidence is never rewritten to make the graph cleaner.
- Model output is untrusted staging until validated by the owning boundary.
- Canonical records retain uncertainty, contradiction, time, and provenance.
- Derived material is rebuildable and cannot delete or alter authoritative input.
- The universal core does not assume personhood, agency, communication, conservation, or a company. Domain-specific semantics remain in explicit profiles.
- Relation and Flow remain distinct; Position is a reproducible projection rather than a second word for stance or an authoritative world snapshot.
- Case-derived learning crosses into the public repository only as generalized product authority, synthetic material, or an explicitly authorized and reviewed de-identified template.
- External Agents interact through validated capabilities; they do not read private databases or write canonical data directly.
- Position evaluation is vector-first and objective-bound. Scalar ranking is a derived view with inspectable weights.
- Scenario search preserves branch diversity and uncertainty; greater depth does not imply greater truth.
- Actual/reconstructed and hypothetical/predicted Trajectories remain distinct. An optional Variation can be linked to later confirming evidence but never rewritten into historical fact.

## Open architecture decisions

- Graph database versus relational/event storage versus hybrid, based on the first validated queries.
- Local-first versus shared service boundary, based on data authority and collaboration needs.
- Identity-resolution and temporal-logic approach.
- Retrieval, network metrics, stance analysis, and language-model responsibilities.
- Privacy, access, retention, redaction, and audit model for a real company pilot.

These remain candidates. No framework, language, database, or model provider is adopted at repository init.
