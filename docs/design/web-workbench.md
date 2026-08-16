# Candidate Web workbench design

Status: **candidate for user review**. This design supports the domain contract in [domain-model.md](../product/domain-model.md) and does not commit a framework or visual style.

Purpose: provide a universal network/time/evidence workbench, with an optional organizational strategy layout that feels like analyzing a board position. Profiles may change terminology and panels without changing the underlying meanings.

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
│ Trajectories: P0 → transition → P1 …   scenario / compare / replay      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Main interactions

1. **Set context:** choose Playground, perspective, objective, horizon, and evidence cutoff.
2. **Inspect a position:** view relevant Nodes, Relations, Flows, State, recent Events, and uncertainty; the organizational profile adds roles, Scene, topic, and open decisions.
3. **Scrub time:** move the as-of control, compare two positions, and see which events caused visible changes.
4. **Open a Node drawer:** inspect identity, typed State and Claims, Relations/Flows, Timeline, notes, and evidence; a Pawn profile adds role, capability, interaction style, and stance.
5. **Add information:** type/paste text or stage an authorized table, conversation export, or screenshot for extraction and review.
   In a dialogue profile, the preview shows the utterance as a candidate Strategy Step with before/after Position differences and separates source words, inferred Action, observed Event, and unresolved Claims.
6. **Ask the analyst/strategist:** request explanation, comparison, prediction, replay, or—where the profile supports it—action/wording advice.
7. **Compare trajectories:** see materially different scenarios or candidate Actions, modeled Transitions, score vectors, assumptions, and stop conditions.
8. **Correct the model:** challenge an identity, event, assertion, weight, or predicted transition without rewriting source evidence.

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

Every answer separates:

```text
observed evidence
-> current interpretation
-> assumptions
-> candidate moves and modeled responses
-> scorecard and uncertainty
-> recommended line and replan triggers
```

## Node drawer and organizational Pawn view

Universal tabs are Overview, State/Claims, Relations/Flows, Timeline, Notes, and Trace. The organizational profile may render the Node as a Pawn and add:

- Overview: type, aliases, memberships, current role and presence;
- Assertions: trait/style/capability claims with status and evidence;
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

## MVP screens

1. Playground setup and private evidence staging.
2. Workbench with Timeline, Position/network board, analysis console, and trajectory strip.
3. Node drawer and Claim/evidence review, with the organizational Pawn view enabled.
4. Position comparison and decision replay.

## Deferred UI scope

- real-time second-level guidance;
- autonomous message sending or external actions;
- decorative chess animation that obscures evidence;
- a universal graph view showing every node;
- collaborative enterprise permission administration before a private single-user pilot works.

## Usability and safety requirements

- Keyboard-accessible navigation and non-color-only status cues.
- Clear labels for observation, report, inference, judgment, and prediction.
- No single confidence color that hides contradictory evidence.
- Private-by-default inputs and explicit publication boundaries.
- A visible “why?” path from every score and recommendation to evidence, weights, assumptions, and model identity.
