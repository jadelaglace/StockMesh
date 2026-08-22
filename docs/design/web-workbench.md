# Candidate Web workbench design

Status: **Web-first direction and the bounded P4 synthetic workflow are adopted; later profile and real-pilot details remain candidate**. This design supports the domain contract in [domain-model.md](../product/domain-model.md).

## P4 interaction cut

P4 is one responsive workbench rather than four disconnected demo pages. The desktop shell keeps Timeline, Position board, Analysis, and Branches visible together; Node/Trace, staging/review, comparison, and correction open as focused drawers or panels. On narrow screens these same regions become a stable tab sequence without changing their data or commands.

The top bar includes a compact language control for English and Simplified Chinese. A fresh profile starts in Simplified Chinese; the keyboard-accessible choice is locally persistent. Localization owns workbench chrome, control labels, status vocabulary, locale-aware dates, and presentation-only copy for the repository-owned public synthetic Playground, including its Main Line summaries, question, Pawn labels, objectives, branch titles/actions/responses, assumptions, score labels, and explanatory caveats. Imported evidence, user-entered text, private/real records, identifiers, raw Method output, and stored records remain verbatim.

Localized labels may wrap or expand without clipping a workbench region. On desktop, the Position header, question, Pawn selector, legend, and Position-delta strip retain their complete bounds while the network canvas absorbs available-height changes; when the two-row workbench cannot fit a shorter viewport, the workbench scrolls rather than hiding panel content. Known run, branch, realization, review, uncertainty, trace-kind, search-stop, and projection-field terms belong to interface vocabulary and use the selected locale.

The initial route opens a seeded, clearly labeled synthetic Playground. Empty, loading, selected, error, and successful-command states are explicit. The browser receives presentation-safe view models and validated commands only: it never receives a database path, arbitrary table access, private source body, or canonical write primitive.

Purpose: provide the primary human route for universal network/time/evidence analysis, LLM-assisted situation reasoning, branch selection, and replay, with an optional organizational strategy layout that feels like analyzing a board position. Profiles may change terminology and panels without changing the underlying meanings.

## Universal shell and profile contributions

The stable shell is Playground scope, evidence boundary, as-of time, network/Position view, Timeline, detail/trace, input review, and analysis console. A profile contributes Node labels, relation/flow encodings, state panels, event vocabulary, evaluation dimensions, and—only where agency exists—Actions and scenario controls.

The layout below is the first organizational strategy profile, not the universal ontology.

## Primary workspace

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Playground ▾  Perspective ▾  As-of time ━━━━━●━━━━  Evidence scope ▾   │
├──────────────────┬─────────────────────────────┬─────────────────────────┤
│ Timeline         │ Position / network board    │ Analysis / Strategist   │
│                  │                             │                         │
│ events / filters │ Nodes, relations, flows,    │ question / new evidence │
│ before ↔ after   │ state; profile overlays     │ actions when supported  │
│                  │                             │ scorecards / explanation│
├──────────────────┴─────────────────────────────┴─────────────────────────┤
│ Main Line + Variations: checkout / fork / pin / resume / compare       │
└──────────────────────────────────────────────────────────────────────────┘
```

## Main interactions

1. **Set context:** choose Playground, perspective, objective, horizon, and evidence cutoff.
2. **Inspect a position:** view relevant Nodes, Relations, Flows, State, recent Events, and uncertainty; the organizational profile adds roles, Scene, topic, and open decisions.
3. **Scrub time:** move the as-of control, compare two positions, and see which events caused visible changes.
4. **Open a Node drawer:** inspect identity, typed State and Claims, Relations/Flows, Timeline, notes, and evidence; a Pawn profile adds role, capability, interaction style, and stance.
5. **Add information:** type/paste text or stage an authorized table, conversation export, or screenshot for extraction and review.
   In a dialogue profile, the preview shows the utterance as a candidate Strategy Step with before/after Position differences and separates source words, inferred Action, observed Event, and unresolved Claims.
6. **Ask the analyst/strategist:** call the configured LLM analysis service for explanation, comparison, prediction, replay, or—where the profile supports it—action/wording advice; see the provider/model and exact context boundary.
7. **Explore branches:** expand a Position under visible search budgets, inspect materially different candidate Actions and modeled responses, and distinguish materialized/evaluated, cached, pruned, stopped, and unevaluated possibilities.
8. **Pin and revisit:** keep several promising forecasts, checkout any historical or hypothetical Position, resume an unchanged cached branch, or fork another Variation without deleting siblings or converting predictions into history.
9. **Correct the model:** challenge an identity, event, assertion, weight, or predicted transition without rewriting source evidence.
10. **Reconcile reality:** after staging what actually happened, compare the reviewed Main Line reaction with eligible forecasts, inspect surprises/misses/unknown coverage, and accept or reject evidence-linked Pawn profile revisions.

## Position board

The center is not a generic hairball graph. Universally it shows the smallest question-relevant subset of Nodes, Relations, Flows, State, and uncertainty. In the organizational strategy profile:

- active Pawns are prominent; absent but influential Pawns appear in a secondary ring;
- node badges show role, current state, and evidence/uncertainty warnings;
- edges encode typed relationships and effective dependencies, not vague “connection”;
- the active Scene shows channel, place, audience, topic, and confidentiality;
- selecting any visual element opens its evidence trail;
- a before/after mode highlights changed Pawns, edges, stances, and commitments.

## Strategist console

The console accepts natural language and structured commands such as:

- “把今天的新消息加入盘面，哪些关系或风险变了？”
- “从 A 的视角，目标是让 F 拍板，未来三步有哪些说法？”
- “回到周五下午，当时的信息下这个决定合理吗？”
- “比较立即说、私下说、等待一天三条线。”

Every LLM-assisted answer separates:

```text
observed evidence
-> current interpretation
-> assumptions
-> candidate moves and modeled responses
-> scorecard and uncertainty
-> recommended line and replan triggers
```

The console is not a free-floating chatbot. Each turn is attached to a Position,
branch, evidence cutoff, objectives, Method results, provider/model run, and
cache identity. Agent Skill/CLI clients may offer a lighter Kimi-like dialogue
over the same capabilities, but they do not own a separate conversation truth.

## Node drawer and organizational Pawn view

Universal tabs are Overview, State/Claims, Relations/Flows, Timeline, Notes, and Trace. The organizational profile may render the Node as a Pawn and add:

- Overview: type, aliases, memberships, current role and presence;
- Assertions: trait/style/capability claims with status and evidence;
- Profile history: time-bounded revisions, competing explanations, and the exact Claim snapshot used by each forecast;
- Stances: topic × time, separating direct expression from inference;
- Relationships: directional, typed, temporal links;
- Timeline: events involving the Pawn;
- Notes: private human notes and explicit judgments;
- Trace: source and processor lineage.

## Input and review flow

Imports land in private staging. Extraction shows a preview of candidate Evidence/Claims and profile objects. For the organizational profile this includes proposed Pawns, Events, statements, times, and Relations. The user resolves ambiguities and approves canonical changes. Screenshots and conversation tables are evidence attachments, not automatically public artifacts.

The visible input can remain a familiar “you say / I say” dialogue. Selecting a
turn opens its Strategy Step: complete scoped Position before, source Utterance,
Action/Event interpretation, Position after, changed fields, evidence, and
branch mode. The UI does not own this state; it renders the same revision graph
used by replay and Agent access.

The Timeline shows confirmed Main Line Events by default and overlays selected
Variations without blending their modes. The branch explorer records pins and
user selections as derived preferences. Returning to an earlier Position is a
checkout; continuing from it creates a new Variation. A later real Event is
reviewed and appended to history even when it resembles a prior prediction.

## Forecast and reality comparison

Each Variation shows two independent labels:

```text
purpose: forecast | counterfactual | exploratory
realization: pending | matched | partial | diverged | expired-unobserved | unknown | not-applicable
```

Selecting a realized Main Line step highlights every eligible forecast it may
match and any unpredicted remainder. Selecting a forecast shows its frozen
branch-root Position/profile, original horizon and probability/rank, matching
rubric, observation coverage, and later actual evidence. Counterfactual and
exploratory branches are never presented as failed predictions.

The reconciliation panel keeps three decisions separate:

1. accept/correct the realized Evidence/Event and Main Line step;
2. review the Forecast Assessment without editing either history;
3. review candidate Pawn/Node Claim revisions such as real change, earlier
   estimate correction, context-specific exception, changed constraints, or
   insufficient evidence.

After an accepted profile revision, the current Position updates while old
forecast/replay screens retain the original profile snapshot. A toggle may show
the later hindsight profile, but it is visibly distinct from the original run.

## MVP screens

1. Playground setup and private evidence staging.
2. Workbench with Timeline, Position/network board, LLM analysis console, and Main Line/Variation explorer.
3. Node drawer and Claim/evidence review, with the organizational Pawn view enabled.
4. Position checkout, branch pin/fork/resume, forecast-versus-reality comparison, profile-revision review, and cutoff-correct decision replay.

## Deferred UI scope

- real-time second-level guidance;
- autonomous message sending or external actions;
- decorative chess animation that obscures evidence;
- a universal graph view showing every node;
- collaborative enterprise permission administration before a private single-user pilot works.

## Usability and safety requirements

- Keyboard-accessible navigation and non-color-only status cues.
- Clear labels for observation, report, inference, judgment, and prediction.
- Separate visual encodings for branch purpose and realization status; matched does not replace predicted, and missing data does not display as a miss.
- No single confidence color that hides contradictory evidence.
- Private-by-default inputs and explicit publication boundaries.
- A visible “why?” path from every score and recommendation to evidence, weights, assumptions, and model identity.
