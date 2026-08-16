# Candidate delivery roadmap

Status: **candidate for user review**. This proposes implementation order after the domain planning and private Game Record cleaning. It does not authorize real-case publication or claim delivery progress.

## Ordering principle

Build a trustworthy replayable record before adding intelligence:

```text
source messages
-> Pawns + Events
-> Main Line / Variations
-> as-of Position replay
-> human corrections
-> scorecards
-> scenario search
-> strategist UI and external Agent use
```

## R0 — Contract freeze

Decide the public vocabulary, first Playground boundary, Pawn/Assertion/Event schemas, Game Record status model, and what evidence promotes a Variation into the Main Line.

Terminal: schemas and examples are user-reviewed; sensitive fields and public/private boundaries are explicit.

## R1 — Replayable data backbone

Implement local import of a synthetic conversation, role reconciliation, append-only events, Game Record storage, Main Line/Variation linkage, and deterministic as-of Position construction.

Terminal: the same inputs reproduce the same Position; corrections append revisions; an unfinished record can later resume without changing old IDs.

## R2 — Evidence-first Web workbench

Implement the timeline, Position board, Pawn drawer, source trace, before/after comparison, branch viewer, and correction workflow. Use manual or fixture scorecards only.

Terminal: a user can inspect and correct a complete synthetic episode without editing internal files or a database.

## R3 — Bounded strategist

Add explicit objectives and horizons, vector scorecards, three diverse short scenario Lines, assumptions, uncertainty, and replan triggers. Compare generated predictions with later Main Line outcomes where available.

Terminal: recommendations are traceable and alternatives are visible; no universal social score or guaranteed long prediction is presented.

## R4 — External Agent interface

Expose the validated read/analysis capabilities through the chosen first surface. Keep evidence writes in staging and corrections in review; no external canonical writer.

Terminal: an external Agent can inspect, compare, evaluate, simulate, and explain a synthetic Game Record through stable contracts.

## R5 — Private pilot

Run an explicitly authorized private Game Record locally as validation data. Keep it outside Git and outside public fixtures. Measure reconstruction quality, correction burden, scenario usefulness, calibration, and user learning.

Terminal: observed results and gaps are reported; only generalized, non-linkable product consequences may enter the public repository.

## Recommended next decision

Approve or revise R0 vocabulary and choose the first Playground boundary. Implementation should not begin from model/provider selection; it should begin from one synthetic unfinished Game Record that exercises Main Line promotion, branching, and resume.
