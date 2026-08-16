# Product behavior / PRD

Purpose: translate [current requirements](requirements.md) into observable product behavior without choosing an implementation stack.

## Primary actor

Initially, an individual analyst or learner exploring an explicitly authorized company-network dataset. Other roles remain open until validated.

## Core workflow

1. The user defines an authorized analysis scope and data purpose.
2. The system ingests source items while retaining source identity, time, provenance, and access classification inside the authorized private boundary.
3. The system normalizes entities, relationships, statements, events, positions, and uncertainty without overwriting raw evidence.
4. The user adds or selects a new evidence item and asks how it fits the known network.
5. The system retrieves relevant temporal and relational context.
6. The system presents patterns and hypotheses with evidence links, uncertainty, contradiction, and alternatives.
7. The user can correct identity resolution, challenge an interpretation, or record an explicit human judgment without rewriting the source.
8. Derived graphs and views can be rebuilt when processing changes.
9. The user selects a perspective, objective, horizon, and risk profile, then evaluates the current Position with an inspectable vector scorecard.
10. The user proposes or requests candidate Moves; StockMesh produces materially different scenario Lines, modeled responses, resulting Positions, uncertainty, and replan triggers.
11. The user can replay an earlier decision using only information available at that time and optionally compare it with a hindsight view.
12. The user can preserve an ongoing Game Record with a confirmed Main Line and Position-bound Variations; later evidence can promote a branch outcome without rewriting its history.

## Initial capability slice

- Model persons, organizational units, events, statements, positions, and typed relationships.
- Preserve valid-time and observation-time where they differ.
- Show a local network around a selected entity or event.
- Produce an evidence-backed timeline.
- Compare expressed positions across people, topics, and time while separating quote from interpretation.
- Add a new evidence item and surface its most relevant existing context.
- Mark analyses as hypothesis, observation, conflict, unknown, or human-adopted judgment.
- Build an as-of Position from the event timeline for a selected question and perspective.
- Evaluate goal progress, relationship effect, authority fit, information gain, escalation risk, reversibility, cost, and robustness without hiding the vector behind one score.
- Compare at least three diverse short scenario Lines and select a human-approved recommendation.
- Use a Web workbench with timeline, position board, Pawn drawer, strategist console, and scenario comparison.
- Expose read/analysis capabilities to external Agents behind a narrow contract.
- Pause an unfinished Game Record as dormant and later resume it from the same frontier and identities.

## Explicit non-goals for the initial slice

- Automated employment, disciplinary, access, or compensation decisions.
- A universal “truth score”, loyalty score, personality diagnosis, or guilt detector.
- Covert collection or ingestion beyond explicitly authorized scope.
- General macro-network support in the first delivery slice.
- Real-time enterprise deployment before the data and correction contracts are validated.
- Publishing conversation locators or concrete cases to the public repository.
- Second-level behavioral direction, autonomous communication, or unsupervised action on recommendations.
- Guaranteed 10–20 step social prediction; depth is a search budget constrained by uncertainty.

## Case-to-product learning boundary

The system may derive generalized concepts, workflow requirements, or synthetic examples from an authorized case. The public artifact must not preserve the case narrative or linkability. A de-identified case template is a separate publication act that requires explicit user authorization and review.

## Failure behavior

When provenance is missing, authorization is unclear, identity resolution is ambiguous, or evidence conflicts, the system fails closed: it does not silently promote a canonical fact or high-confidence interpretation. The user sees the reason and the next recoverable action.
