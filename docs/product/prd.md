# Product behavior / PRD

Purpose: translate [current requirements](requirements.md) into observable product behavior without choosing an implementation stack.

## Primary actor

Initially, an individual analyst or learner exploring an explicitly authorized company-network dataset. Other roles remain open until validated.

The human primarily works through the Web workbench and owns scope, objectives, corrections, branch selection, and judgment. A provider-neutral LLM analysis service supplies contextual natural-language analysis and derived possibilities. Agent Skill and CLI clients offer lighter conversational or automated access to the same application capabilities without canonical write authority.

## Core workflow

1. The user defines an authorized analysis scope and data purpose.
2. The system ingests source items while retaining source identity, time, provenance, and access classification inside the authorized private boundary.
3. The system interprets evidence as candidate Claims and profile-typed Nodes, Relations, Flows, States, and Events without overwriting raw evidence.
4. The user adds or selects a new evidence item and asks how it fits the known network.
5. The framework assembles the exact temporal, relational, evidence, objective, and branch context and runs applicable quantitative Methods.
6. The LLM analysis service uses that context to analyze statements, relationships, stance, possible Actions, responses, and situation quality; its outputs remain attributable proposals.
7. The system presents LLM analysis and Method results with evidence links, uncertainty, contradiction, and alternatives, keeping their producers distinct.
8. The user can correct identity resolution, challenge an interpretation, or record an explicit human judgment without rewriting the source.
9. Derived graphs and views can be rebuilt when processing changes.
10. In a dialogue/agentic profile, each reviewed utterance or contextual input can form a Strategy Step linking the complete scoped before-Position, input, Event/Action, Transition, after-Position, evidence, and mode.
11. The user can inspect which provider/model run and macro/micro Methods contributed to an analysis, including their assumptions, evidence boundary, uncertainty, limitations, and disagreements.
12. The user selects a perspective, objective, horizon, and risk profile, then evaluates the current Position with an inspectable multi-party vector scorecard.
13. Where a profile declares agency and controllable Actions, the LLM analysis service proposes a context-dependent number of candidate Actions and modeled responses. The framework materializes selected Positions, calculates quantitative features, caches the branch graph, and coordinates further exploration under explicit budgets and a replaceable Search Policy.
14. The user can pin useful forecast branches, compare them, return to any historical or hypothetical Position, fork a new analysis, and resume an unchanged cached branch.
15. The user can replay an earlier decision using only information available at that time and optionally compare it with a hindsight view.
16. When an application uses an episode/game-record view, the user can preserve an ongoing record with confirmed history and Position-bound alternatives without rewriting source history.

## Initial capability slice

- Model the universal concepts through a versioned organizational profile containing people, units, Events, statements, Stance, typed Relations/Flows, and State.
- Preserve valid-time and observation-time where they differ.
- Show a local network around a selected entity or event.
- Produce an evidence-backed timeline.
- Compare expressed Stances across people, topics, and time while separating quote from interpretation.
- Add a new evidence item and surface its most relevant existing context.
- Mark analyses as hypothesis, observation, conflict, unknown, or human-adopted judgment.
- Build an as-of Position from the event timeline for a selected question and perspective.
- Evaluate goal progress, relationship effect, authority fit, information gain, escalation risk, reversibility, cost, and robustness without hiding the vector behind one score.
- Generate, retain, and compare multiple materially different possible Trajectories when the evidence and search budget support them; candidate count and depth are not fixed product constants.
- Use a Web workbench with Timeline, Position/network board, Node detail, analysis/strategist console, and trajectory comparison; the organizational profile may label Nodes as Pawns.
- Expose the same branch context, LLM analysis, Method, search, selection, and replay operations through narrow Agent Skill and CLI clients without direct canonical writes.
- Load a domain profile that defines permitted node types, relation/flow types, state variables, event types, evaluation dimensions, and UI terminology without changing the universal evidence/time contracts.
- Optionally pause an unfinished episode/game-record view and later resume it from the same frontier and identities.
- Preserve a chat-like turn view while maintaining each turn as a traceable Strategy Step in the backend Position/Transition graph.
- Preserve pinned and model/user-selected forecast Variations as resumable derived branches with cache/provenance identity, never as confirmed Main Line history.

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
