# Acceptance criteria

Purpose: define observable results for the first validated StockMesh capability. These criteria are provisional until the user selects a concrete pilot workflow.

| ID | Observable criterion | Failure condition |
| --- | --- | --- |
| AC-01 | A synthetic or explicitly authorized corpus can be ingested with stable source identity, timestamps, and provenance retained. | A canonical or derived record cannot be traced to its source. |
| AC-02 | People, units, events, statements, positions, and typed relationships can be represented without forcing every claim into a binary fact. | Observations, reports, inferences, and judgments collapse into one status. |
| AC-03 | Adding one new evidence item returns a bounded set of relevant historical and network context. | Results are context-free or cannot identify the evidence used. |
| AC-04 | A user can inspect a local network and evidence-backed timeline for a selected entity or event. | The view hides time, relation meaning, or provenance. |
| AC-05 | Position analysis distinguishes direct statements from model interpretation and shows uncertainty or contradiction. | Inferred stance is presented as a direct quote or established fact. |
| AC-06 | Identity resolution and interpretations can be corrected without modifying raw evidence; derived views can be rebuilt. | Correction destroys source history or requires manual mutation of raw data. |
| AC-07 | Unauthorized, provenance-free, or materially ambiguous input is quarantined or rejected with a reason. | It is silently promoted into canonical analysis. |
| AC-08 | A human reviewer can reproduce one analysis path from output to sources and processing identity. | The path depends on hidden state or unrecorded prompts. |
| AC-09 | Public-repository outputs contain no private conversation locator or linkable case detail; reusable examples are synthetic unless a de-identified template was explicitly authorized. | A case, locator, or identifying combination is committed by default. |

Engineering scaffold, schemas, file counts, or fixture-only tests do not prove these criteria. User acceptance remains a separate human decision.
