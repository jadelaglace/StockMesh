# Architecture and data governance direction

Purpose: describe durable ownership and information-flow boundaries that enable [acceptance](../product/acceptance.md). Technology and deployment choices remain open.

```text
authorized sources (read-only)
  -> acquisition / source registry
  -> validation and normalization staging
  -> canonical event + assertion store
  -> reproducible temporal graph / Position projector
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
| Canonical entities and assertions | Canonical graph core | Validated reconciliation commands | Model adapters never write directly; assertion status and temporal validity are explicit |
| Canonical events | Event core | Validated ingestion/reconciliation commands | Append/correct through traceable revisions; Positions never rewrite events |
| Human judgments and corrections | Human-review record | Authorized human-review workflow | Append attributed decisions; do not rewrite source evidence |
| Positions, indexes, embeddings and views | Projection/derivation pipeline | Rebuildable processors | Bound to as-of time, evidence scope, perspective, and processor identity; deletable/rebuildable |
| Evaluations, scenario Lines and recommendations | Analysis run store | Evaluation/scenario engine after input validation | Derived and advisory; retain model, weights, assumptions, uncertainty, and lineage |
| Runtime state and logs | Runtime boundary | Runtime services | Kept outside Git and separated from product evidence |
| Credentials and access policy | Secret/config boundary | Authorized operators | Never placed in source data, prompts, ordinary logs, or Git |
| Private source locators and case mapping | Private evidence boundary outside Git | Authorized acquisition/review workflow | Never published; public derivatives use non-linkable safe identities |

## Stable conceptual model

- **Entity:** a versioned subject or object such as person, team, institution, resource, event, or future domain type.
- **Assertion:** an attributed claim about an entity, relationship, event, or position; it carries provenance and epistemic status.
- **Relationship:** a typed, directed or undirected connection with temporal scope and evidence.
- **Event:** something situated in time that can involve entities, statements, resources, and consequences.
- **Statement:** source-preserving utterance or text attributed to a speaker/source; interpretations attach separately.
- **Position:** a time-bounded interpretation or human-adopted judgment about stance toward a topic.
- **Analysis:** a reproducible derived result with processor identity, inputs, limitations, and evidence links.
- **Playground:** the authorized world boundary containing ontology, evidence policy, Pawns, and time scope.
- **Pawn:** a typed analysis Entity with time-bounded roles, state, relationships, and attributed Assertions.
- **Position:** a reproducible as-of projection of events and assertions for a selected question and perspective.
- **Move:** an actual or candidate intervention that may transition one Position to another.
- **Line:** a derived sequence of Moves, modeled responses, Positions, scorecards, and replan triggers.
- **Game Record:** an append-only episode aggregate holding ordered sources, the confirmed Main Line, Position-bound Variations, checkpoints, and an explicit ongoing/dormant/concluded state.

## Key invariants

- Raw evidence is never rewritten to make the graph cleaner.
- Model output is untrusted staging until validated by the owning boundary.
- Canonical records retain uncertainty, contradiction, time, and provenance.
- Derived material is rebuildable and cannot delete or alter authoritative input.
- A general entity/relationship core may support future domains, but company-specific semantics may remain an adapter or profile until real use proves what is general.
- Case-derived learning crosses into the public repository only as generalized product authority, synthetic material, or an explicitly authorized and reviewed de-identified template.
- External Agents interact through validated capabilities; they do not read private databases or write canonical data directly.
- Position evaluation is vector-first and objective-bound. Scalar ranking is a derived view with inspectable weights.
- Scenario search preserves branch diversity and uncertainty; greater depth does not imply greater truth.
- A Variation is promoted only by a later confirmation record; processors cannot silently turn recommendations into Main Line facts.

## Open architecture decisions

- Graph database versus relational/event storage versus hybrid, based on the first validated queries.
- Local-first versus shared service boundary, based on data authority and collaboration needs.
- Identity-resolution and temporal-logic approach.
- Retrieval, network metrics, stance analysis, and language-model responsibilities.
- Privacy, access, retention, redaction, and audit model for a real company pilot.

These remain candidates. No framework, language, database, or model provider is adopted at repository init.
