# Acceptance criteria

Purpose: define observable results for the first validated StockMesh capability. These criteria are provisional until the user selects a concrete pilot workflow.

| ID | Observable criterion | Failure condition |
| --- | --- | --- |
| AC-01 | A synthetic or explicitly authorized corpus can be ingested with stable source identity, timestamps, and provenance retained. | A canonical or derived record cannot be traced to its source. |
| AC-02 | The organizational profile can represent people, units, Events, statements, Stances, Relations/Flows, and State without forcing every Claim into a binary fact. | Observations, reports, inferences, and judgments collapse into one status or company fields leak into the universal core. |
| AC-03 | Adding one new evidence item returns a bounded set of relevant historical and network context. | Results are context-free or cannot identify the evidence used. |
| AC-04 | A user can inspect a local network and evidence-backed timeline for a selected entity or event. | The view hides time, relation meaning, or provenance. |
| AC-05 | Stance analysis distinguishes direct statements from model interpretation and shows uncertainty or contradiction. | Inferred Stance is presented as a direct quote or established fact, or Stance is confused with a Position projection. |
| AC-06 | Identity resolution and interpretations can be corrected without modifying raw evidence; derived views can be rebuilt. | Correction destroys source history or requires manual mutation of raw data. |
| AC-07 | Unauthorized, provenance-free, or materially ambiguous input is quarantined or rejected with a reason. | It is silently promoted into canonical analysis. |
| AC-08 | A human reviewer can reproduce one analysis path from output to sources and processing identity. | The path depends on hidden state or unrecorded prompts. |
| AC-09 | Public-repository outputs contain no private conversation locator or linkable case detail; reusable examples are synthetic unless a de-identified template was explicitly authorized. | A case, locator, or identifying combination is committed by default. |
| AC-10 | The same authorized event set and projection identity reproduce the same as-of Position, while later corrections create a traceable new projection. | A Position depends on hidden mutable state or overwrites history. |
| AC-11 | Position evaluation declares perspective, objective, horizon, risk policy, evidence cutoff, vector dimensions, weights, and uncertainty. | A universal opaque “person” or “situation” score is presented. |
| AC-12 | Where the profile supports strategy, a user can compare at least three materially different short possible Trajectories, with each Transition showing assumptions, modeled response/cause, resulting Position, score vector, and replan trigger. | The system emits one confident future without alternatives or assumptions. |
| AC-13 | Decision replay reconstructs the evidence available at the historical cutoff and labels any hindsight view separately. | Later knowledge silently leaks into the reconstructed decision. |
| AC-14 | The Web workbench supports the full pilot loop: stage evidence, inspect Timeline/Position/Node, ask for analysis, compare Trajectories, and correct a Claim. | The user must edit internal graph or database records to complete the loop. |
| AC-15 | An external Agent can inspect a Position, request evaluation/simulation, and obtain traceable results without direct canonical writes. | The Agent must access private storage or can bypass validation/review. |
| AC-16 | The same universal core can represent at least three materially different synthetic domains—organizational interaction, resource/energy flow, and collective or machine coordination—through profiles without adding company-only fields to the core. | A new domain requires pretending every node is a person, every edge is a social relationship, or every event is communication. |
| AC-17 | When the optional episode/game-record view is enabled, an unfinished record preserves confirmed history, alternatives, and a resumable frontier; promotion appends provenance rather than rewriting history. | Optional view semantics leak into every domain or advice is silently recorded as fact. |

Engineering scaffold, schemas, file counts, or fixture-only tests do not prove these criteria. User acceptance remains a separate human decision.
