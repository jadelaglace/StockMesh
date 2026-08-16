# Candidate Web workbench design

Status: **candidate for user review**. This design supports the domain contract in [domain-model.md](../product/domain-model.md) and does not commit a framework or visual style.

Purpose: make StockMesh feel like a strategy workbench: inspect the current position, scrub history, add evidence, compare possible moves, and ask the strategist for explainable advice.

## Primary workspace

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Playground ▾  Perspective ▾  As-of time ━━━━━●━━━━  Evidence scope ▾   │
├──────────────────┬─────────────────────────────┬─────────────────────────┤
│ Timeline         │ Position board              │ Strategist              │
│                  │                             │                         │
│ events / filters │ Pawns, Scene, roles,        │ question / new evidence │
│ before ↔ after   │ relations, tension, topic   │ candidate moves         │
│                  │                             │ scorecards / explanation│
├──────────────────┴─────────────────────────────┴─────────────────────────┤
│ Scenario lines: P0 → move → P1 → response → P2 …   compare / replay     │
└──────────────────────────────────────────────────────────────────────────┘
```

## Main interactions

1. **Set context:** choose Playground, perspective, objective, horizon, and evidence cutoff.
2. **Inspect a position:** view active Pawns, roles, relationships, Scene, topic, open decisions, and uncertainty.
3. **Scrub time:** move the as-of control, compare two positions, and see which events caused visible changes.
4. **Open a Pawn drawer:** inspect identity, role, capability assertions, interaction style, stance by topic, relationships, timeline, notes, and evidence.
5. **Add information:** type/paste text or stage an authorized table, conversation export, or screenshot for extraction and review.
6. **Ask the strategist:** request analysis, prediction, replay, or wording advice from the right-side console.
7. **Compare lines:** see several materially different candidate moves, response branches, score vectors, assumptions, and stop conditions.
8. **Correct the model:** challenge an identity, event, assertion, weight, or predicted transition without rewriting source evidence.

## Position board

The center is not a generic hairball graph. It defaults to the smallest local view relevant to the current question:

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

## Pawn drawer

Tabs:

- Overview: type, aliases, memberships, current role and presence;
- Assertions: trait/style/capability claims with status and evidence;
- Stances: topic × time, separating direct expression from inference;
- Relationships: directional, typed, temporal links;
- Timeline: events involving the Pawn;
- Notes: private human notes and explicit judgments;
- Trace: source and processor lineage.

## Input and review flow

Imports land in private staging. Extraction shows a preview of proposed Pawns, events, statements, times, and relations. The user resolves ambiguities and approves canonical changes. Screenshots and conversation tables are evidence attachments, not automatically public artifacts.

## MVP screens

1. Playground setup and private evidence staging.
2. Workbench with timeline, position board, strategist console, and scenario strip.
3. Pawn drawer and assertion/evidence review.
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

