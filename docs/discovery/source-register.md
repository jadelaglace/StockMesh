# External material register

Purpose: govern content derived from external conversations or cases without retaining private conversation locators or identifying case details in this public repository. A registered derivative is not an adopted product decision.

No external conversation content, locator, or case derivative is retained in this public repository. An authorized unfinished case and an upper-level reference currently exist only in StockMesh's Git-ignored private workspace; their public record is limited to processing state, non-identifying counts, and generalized product consequences.

## Admission rules

1. Do not save Kimi conversation links or other private conversation locators in this repository.
2. Extract only the content needed for product learning, with speaker/source roles abstracted and identifying details removed.
3. Keep reusable product insight separate from a concrete case narrative.
4. Do not upload cases by default, even after de-identification.
5. A case may enter the public repository only when the user explicitly authorizes it as a template and the upload candidate has been de-identified and reviewed.
6. Record provenance privately when necessary for audit, outside Git; expose only a safe derivative identity here.
7. Do not infer or promote content that was not actually acquired.

## Public candidate references

These entries were named directly by the user as possible sources of ideas. A
narrow public-source review was performed on 2026-08-16. No source code was
copied and no project, algorithm, dependency, or claim was adopted.

| Candidate | Locator status | Current evidence status | Authority |
| --- | --- | --- | --- |
| Stockfish | <https://github.com/official-stockfish/Stockfish> | Official current `master` module boundaries reviewed read-only on 2026-08-21; GPL-3.0 repository | External architecture reference only; name tribute remains separate and no source reuse is permitted |
| CAMEL-AI OASIS | <https://github.com/camel-ai/oasis> | Official repository/README reviewed; Apache-2.0 repository | External reference, not a product decision |
| MiroFish | <https://github.com/666ghj/MiroFish> | Official repository/README reviewed; AGPL-3.0 repository; declares OASIS as its simulation engine | External reference only; no source reuse |
| UCINET | <https://sites.google.com/site/ucinetsoftware/home> | User's `ucient` identified as UCINET; official product page reviewed | External SNA reference, not a selected dependency |
| Gephi | <https://gephi.org/desktop> | Official product page reviewed; GPL desktop application | External SNA/reference-UI source, not a selected dependency |
| R / igraph | <https://r.igraph.org/articles/igraph.html> | Official igraph R-interface overview reviewed; open-source programmable graph analysis | External SNA reference, not a selected language or dependency |
| Pajek | <http://mrvar.fdv.uni-lj.si/pajek/be3.htm> | Official project/book material reviewed; emphasizes large, sparse, two-mode, temporal, and signed networks | External SNA reference, not a selected dependency |
| NodeXL | <https://nodexl.com> | Official product page reviewed; spreadsheet-oriented import, metrics, clustering, content/sentiment, and reporting workflow | External SNA/workflow reference, not a selected dependency |

Any future comparison must separately assess obtainable capabilities, method
fit, provenance, maintenance, licensing, privacy implications, and what can be
learned without coupling StockMesh to the reference implementation.

The broader official-source comparison and Agent recommendations live in the
[prior-art and reuse survey](prior-art-survey.md), which remains a candidate
research artifact rather than an adopted dependency decision.
