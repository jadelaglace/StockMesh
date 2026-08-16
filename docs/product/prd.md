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

## Initial capability slice

- Model persons, organizational units, events, statements, positions, and typed relationships.
- Preserve valid-time and observation-time where they differ.
- Show a local network around a selected entity or event.
- Produce an evidence-backed timeline.
- Compare expressed positions across people, topics, and time while separating quote from interpretation.
- Add a new evidence item and surface its most relevant existing context.
- Mark analyses as hypothesis, observation, conflict, unknown, or human-adopted judgment.

## Explicit non-goals for the initial slice

- Automated employment, disciplinary, access, or compensation decisions.
- A universal “truth score”, loyalty score, personality diagnosis, or guilt detector.
- Covert collection or ingestion beyond explicitly authorized scope.
- General macro-network support in the first delivery slice.
- Real-time enterprise deployment before the data and correction contracts are validated.
- Publishing conversation locators or concrete cases to the public repository.

## Case-to-product learning boundary

The system may derive generalized concepts, workflow requirements, or synthetic examples from an authorized case. The public artifact must not preserve the case narrative or linkability. A de-identified case template is a separate publication act that requires explicit user authorization and review.

## Failure behavior

When provenance is missing, authorization is unclear, identity resolution is ambiguous, or evidence conflicts, the system fails closed: it does not silently promote a canonical fact or high-confidence interpretation. The user sees the reason and the next recoverable action.
