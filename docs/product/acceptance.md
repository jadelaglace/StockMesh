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
| AC-10 | The same authorized event set and projection identity reproduce the same as-of Position, while later corrections create a traceable new projection. | A Position depends on hidden mutable state or overwrites history. |
| AC-11 | Position evaluation declares perspective, objective, horizon, risk policy, evidence cutoff, vector dimensions, weights, and uncertainty. | A universal opaque “person” or “situation” score is presented. |
| AC-12 | A user can compare at least three materially different short Lines, with each transition showing assumptions, modeled response, resulting Position, score vector, and replan trigger. | The system emits one confident future without alternatives or assumptions. |
| AC-13 | Decision replay reconstructs the evidence available at the historical cutoff and labels any hindsight view separately. | Later knowledge silently leaks into the reconstructed decision. |
| AC-14 | The Web workbench supports the full pilot loop: stage evidence, inspect timeline/Position/Pawn, ask for analysis, compare Lines, and correct an assertion. | The user must edit internal graph or database records to complete the loop. |
| AC-15 | An external Agent can inspect a Position, request evaluation/simulation, and obtain traceable results without direct canonical writes. | The Agent must access private storage or can bypass validation/review. |
| AC-16 | An unfinished Game Record preserves ordered source messages, a confirmed Main Line, Position-bound Variations, and a resumable frontier; branch promotion appends provenance rather than rewriting history. | Advice is silently recorded as fact, dormant is mistaken for concluded, or resuming changes prior identities. |

Engineering scaffold, schemas, file counts, or fixture-only tests do not prove these criteria. User acceptance remains a separate human decision.
