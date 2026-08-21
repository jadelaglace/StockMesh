# Prior-art and reuse survey

Status: initial bounded survey completed 2026-08-16; candidate guidance, not an
implementation or legal decision.

Purpose: identify existing projects and method ecosystems that can prevent
StockMesh from rebuilding established graph, simulation, inference,
visualization, and versioning capabilities. This survey is downstream of
[DW-020](direct-wording.md#dw-020--research-prior-art-and-license-clean-reuse-before-building)
and remains external evidence/Agent interpretation until a later architecture
decision adopts a dependency.

## Research method and limits

- Discovery used the user-named references plus targeted Web search.
- Capabilities were checked against official repositories, READMEs, license
  files, papers, or product pages where available.
- GitHub repository metadata was read on 2026-08-16 for repository license,
  archive state, and recent activity. Volatile popularity counts are omitted.
- No source was copied, installed, executed, benchmarked, or security-audited.
- A permissive license makes a project eligible for a later spike; it does not
  prove technical fit, data safety, maintenance quality, or transitive-license
  cleanliness. This is engineering guidance, not legal advice.
- The search is broad but not proof that no closer prior art exists.

Recommendation classes:

| Class | Meaning |
| --- | --- |
| `P1 - reuse candidate` | Permissive license and strong capability fit; prefer a thin adapter or direct library use if the later stack and benchmark agree. |
| `P2 - evaluate` | Useful and generally reusable, but overlapping scope, maturity, architecture, or integration cost needs a focused spike. |
| `R - reference/external` | Learn concepts, workflows, formats, or evaluation cases; do not incorporate source into the MIT codebase under the current license posture. |
| `A - avoid/replace` | Current license, archive state, maintenance, or fit makes another route preferable. |

## Executive conclusion

No reviewed project covers StockMesh end to end. The closest families each own
only part of the problem:

- Stockfish and OpenSpiel provide inspectable evaluation/search ideas.
- OASIS, Mesa, Concordia, AgentSociety, OneSim, SOTOPIA, and Generative Agents
  provide different social or multi-Agent simulation substrates.
- MiroFish demonstrates an integrated seed-to-world-to-simulation-to-report
  workflow, but its source is AGPL-3.0; its permissive OASIS substrate is the
  cleaner route to investigate.
- Classical SNA tools and libraries provide mature structural, community,
  role, diffusion, signed, two-mode, temporal, and graph-statistics methods.
- ConvoKit and NLP libraries provide conversation and text feature extraction.
- Causal/probabilistic libraries can make assumptions and uncertainty more
  explicit, but cannot manufacture causality from observational dialogue.
- Existing graph UI and analytical storage/versioning projects can cover large
  parts of presentation and infrastructure after a stack is selected.

The StockMesh-owned layer should therefore stay narrow: evidence/knowledge/
model/possibility separation; the cross-domain Position and Strategy Step
semantics; multi-party objective-bound Evaluation; Method provenance and
disagreement; branch/replay history; human correction; and one coherent Web/
Agent workflow over those contracts.

## Product-level precedents

| Candidate | Verified scope | License/access posture | What it establishes | Recommendation |
| --- | --- | --- | --- | --- |
| [OrgMapper](https://orgmapper.com/organizational-network-analysis) | Organizational Network Analysis using active surveys or passive/API data to map formal/informal communication, flows, and influential employees | Commercial product/material | Evidence-driven ONA, influence, trust, change, and collaboration are established product territory | `R` - study problem framing, collection choices, privacy, and outcome language |
| [Polinode](https://www.polinode.com/guides/what-is-organizational-network-analysis-a-comprehensive-guide) | Relationship collection, network visualization, key influencers, information flows, collaboration, and organizational analysis | Commercial product/material | Company network analysis can operate at person, team, department, or ecosystem scope | `R` - study ONA workflows and use cases; do not treat centrality as the whole strategy score |
| [Kumu](https://docs.kumu.io/disciplines/sna-network-mapping) | Survey/import, network metrics, interactive mapping, systems mapping, and communicating maps | Hosted/commercial product with public guidance | Network and systems maps can support shared interpretation and intervention planning | `R` - study progressive mapping and explanation UX |

These products show that network collection, influence/community analysis, and
relationship visualization are not StockMesh's novel layer. In this bounded
review, none exposes the full StockMesh combination of source-evidence
provenance, complete scoped Positions, utterance/action Strategy Steps,
multi-party objective scoring, inspectable mixed Methods, predicted branch
graphs, and cutoff-correct replay. That is a survey result, not a market-wide
novelty claim.

## Strategy, games, and multi-Agent simulation

| Candidate | Verified scope | License | StockMesh fit | Recommendation |
| --- | --- | --- | --- | --- |
| [Stockfish](https://github.com/official-stockfish/Stockfish) | Chess engine with evaluation, principal variation, iterative search, pruning/reduction/extension, and cached search results | GPL-3.0 | Strong conceptual reference for score/search/explanation vocabulary; chess remains two-party, fully observed, and rule-complete | `R` - name-only tribute and algorithmic inspiration; no source reuse in MIT StockMesh |
| [OpenSpiel](https://github.com/google-deepmind/open_spiel) | Environments and algorithms for games, search/planning, and multi-Agent learning | Apache-2.0 | Useful test bed for multi-party, imperfect-information, and search-policy experiments | `P1` - reuse candidate for later research adapters; do not make game semantics the universal core |
| [PettingZoo](https://github.com/Farama-Foundation/PettingZoo) | Standard API for multi-Agent reinforcement-learning environments | MIT | Useful interface precedent for turn/parallel actors, observations, actions, and environment stepping | `P1` - reuse or imitate the adapter boundary if simulation experiments need it |
| [Mesa](https://github.com/mesa/mesa) | General Agent-based modeling and emergent-behavior simulation | Apache-2.0 | Better fit than social-media-only engines for broad domain profiles | `P1` - general ABM substrate candidate |
| [OASIS](https://github.com/camel-ai/oasis) | LLM-Agent social-platform simulation with profiles, actions, evolving networks/content, and recommendation behavior | Apache-2.0 | Strong macro propagation and public-opinion simulation candidate; narrower than StockMesh's evidence and company context | `P1` - preferred permissive route for a social-simulation adapter |
| [MiroFish](https://github.com/666ghj/MiroFish) | Seed material to entity/persona setup, OASIS simulation, report, and post-simulation interaction | AGPL-3.0 | Closest reviewed integrated workflow and major product inspiration | `R` - study behavior and UX; use OASIS or a clean-room StockMesh orchestration instead of source reuse |
| [Concordia](https://github.com/google-deepmind/concordia) | Library for generative social simulation | Apache-2.0 | Useful for configurable social-world experiments and memory/agent components | `P2` - compare with Mesa/OASIS before selecting one simulation route |
| [Generative Agents](https://github.com/joonspk-research/generative_agents) | Interactive simulacra with memory, reflection, planning, and social interaction | Apache-2.0 | Important micro-Agent and memory precedent; research code is not a full product substrate | `P2` - reference and small experimental reuse candidate |
| [AgentSociety](https://github.com/tsinghua-fib-lab/AgentSociety) | LLM-native Agent simulation for social-science experiments | Apache-2.0 | Strong macro social-experiment candidate | `P2` - compare experiment authoring, controls, reproducibility, and cost against OASIS/Concordia |
| [YuLan-OneSim](https://github.com/RUC-GSAI/YuLan-OneSim) | Natural-language social experiment formalization and simulation pipeline | Apache-2.0 | Relevant precedent for turning a question into an explicit experiment specification | `P2` - inspect ODD-style specification and behavior-graph ideas before designing simulation authoring |
| [SOTOPIA](https://github.com/sotopia-lab/sotopia) | Open-ended social interaction environments and social-intelligence evaluation | MIT | Strong micro interpersonal interaction and evaluator precedent | `P1` - candidate evaluation/reference environment for micro Methods, not a truth model of people |
| [Pol.is](https://github.com/compdemocracy/polis) | Large-scale open-ended feedback and opinion-group mapping | AGPL-3.0 | Useful precedent for clustering viewpoints and finding consensus/minority structure without pretending one score fits all | `R` - product/method reference; seek permissive clustering components for implementation |

### Stockfish architecture comparison

Agent interpretation from a read-only review of the official `master` tree on
2026-08-21; this is independent from the name-only tribute and does not adopt or
copy GPL source:

- `UCIEngine` is a thin command/protocol surface while `Engine` owns position,
  options, search start/stop/wait, threads, evaluation network, and the
  transposition table. StockMesh should likewise keep Web/Skill/CLI thin and
  give application use cases one explicit run lifecycle.
- `Position` and its reversible `StateInfo` stack are distinct from per-worker
  search stack/history. StockMesh keeps the same separation of modeled Position
  from search state, but uses immutable persisted Positions and appended
  Transitions because real evidence and social context cannot be safely undone
  like a chess move.
- Search workers retain local traversal state while the search manager owns
  limits/time and reports iterative principal variations. StockMesh should keep
  per-run frontier/usage state separate from policy and expose progressively
  improving, resumable candidate lines rather than one opaque final answer.
- The transposition table is a performance cache with explicit probe/write and
  aging behavior; it is not the authoritative search-run ledger. StockMesh must
  keep in-flight execution ownership, persisted AnalysisRun attempts, and exact
  successful-result cache identities separate. A cached result may be reused;
  a crashed `running` attempt must not become a permanent lock.
- Stockfish deliberately tolerates some racy cache reads for playing strength.
  That tradeoff does not transfer to StockMesh's evidence, forecast assessment,
  or human-review records, which remain transactional and fail closed.

These points are boundary checks, not a decision to adopt Stockfish's two-party
zero-sum evaluation, full-observation assumptions, move-generation machinery,
NNUE implementation, pruning formulas, threading model, or source code.

## Social-network, diffusion, and statistical methods

| Candidate | Verified scope | License | StockMesh fit | Recommendation |
| --- | --- | --- | --- | --- |
| [UCINET](https://sites.google.com/site/ucinetsoftware/home) | Mature SNA package with matrix analysis, centrality, cohesion, roles, subgroups, statistics, and NetDraw | Product terms; no reusable OSS code license established in this survey | Excellent method taxonomy and validation reference | `R` - use as external comparison tool and method catalog |
| [Gephi](https://gephi.org/desktop) | Interactive network exploration, dynamic timeline, filters, layouts, clustering, metrics, and publication output | GPL | Strong workbench and dynamic-network UX reference | `R` - use externally for inspection/exports; prefer permissive Web libraries for embedded UI |
| [R / igraph](https://r.igraph.org/articles/igraph.html) | Programmable graph/network analysis with broad algorithms and interoperable formats | GPL-2.0 | Strong reproducibility and cross-check reference | `R/P2` - external validation route or isolated process after legal review; prefer NetworkX/NetworKit/rustworkx in MIT core |
| [Pajek](http://mrvar.fdv.uni-lj.si/pajek/be3.htm) | Large sparse, two-mode, temporal, signed, and specialized network analysis | Free/noncommercial terms; not established as permissive OSS | Important scale, signed-network, and data-format reference | `R` - external tool/method reference |
| [NodeXL](https://nodexl.com) | Spreadsheet-oriented import, metrics, clustering, content/sentiment, visualization, and reporting | Product/commercial terms | Strong low-friction analyst workflow precedent | `R` - borrow staging and report workflow; no dependency adoption |
| [NetworkX](https://github.com/networkx/networkx) | Broad Python graph algorithms and data structures | BSD-3-Clause license text | Best correctness-first baseline if Python is selected | `P1` - preferred initial graph-method adapter candidate |
| [NetworKit](https://github.com/networkit/networkit) | High-performance large-scale network analysis | MIT | Performance route for large graphs and established metrics | `P1` - benchmark as a NetworkX alternative/complement, not a simultaneous default |
| [rustworkx](https://github.com/Qiskit/rustworkx) | High-performance Rust graph algorithms exposed to Python | Apache-2.0 | Performance and predictable native-core option | `P1` - benchmark against NetworKit for selected workloads |
| [SNAP](https://github.com/snap-stanford/snap) | General graph mining and large-network algorithms | BSD-3-Clause-style license text; lower recent repository activity | Valuable algorithm/data reference | `P2` - use only if a capability/benchmark beats active alternatives |
| [NDlib](https://github.com/GiulioRossetti/ndlib) | Network diffusion models over NetworkX/igraph | BSD-2-Clause | Direct fit for propagation Mechanisms and counterfactual diffusion experiments | `P1` - candidate Method plugin with explicit model assumptions |
| [CDlib](https://github.com/GiulioRossetti/cdlib) | Community-discovery algorithms and comparisons | BSD-2-Clause | Direct fit for coalition/community hypotheses and method disagreement | `P1` - candidate Method plugin; preserve algorithm/version and comparison metrics |
| [graspologic](https://github.com/graspologic-org/graspologic) | Statistical graph analysis | MIT | Useful for graph inference, embedding, matching, and uncertainty-aware research | `P1` - candidate advanced Method plugin after simpler metrics |
| [tsna](https://github.com/statnet/tsna) | Temporal social-network analysis in R | GPL-3.0 | Relevant method/reference suite for longitudinal network change | `R` - use papers/external validation; implement through permissive primitives or an isolated reviewed route |
| [PyTorch Geometric](https://github.com/pyg-team/pytorch_geometric) | Graph neural-network research library | MIT | Candidate learned Method layer for later evidence-backed tasks | `P2` - only after a labeled task and baseline justify GNN complexity |

## Selected initial social-network Method pack

This table answers which algorithms StockMesh currently selects for the first
organizational profile. It selects Method behavior, not a permanent library or
dependency. The TypeScript v0 route should use Graphology where its verified
implementation fits; the optional Python Method worker may use NetworkX or a
specialized permissive library when a named capability justifies the process
boundary. Every result is a typed, time-bounded feature supplied to LLM and
human analysis, never a fact about motive, loyalty, or worth.

| Algorithm / Method | Question it can help answer | Initial status and executor route | Required interpretation guard |
| --- | --- | --- | --- |
| Typed `k`-hop ego network and BFS neighborhood | Which Nodes, Relations, Events, and recent paths belong in this question's bounded context? | **v0 foundation**; Graphology traversal over a Position projection | A retrieved neighborhood is context coverage, not importance or causality |
| Directed weighted in/out degree and strength | Who has many incoming/outgoing ties or high observed interaction/dependency volume for this relation type and window? | **v0 foundation**; Graphology/basic typed aggregation | Degree is activity/exposure/connection under the chosen edge definition, not influence or support by itself |
| Weak/strong connected components, reachability, and shortest paths | Where are structural splits, reachable channels, or candidate connection paths? | **v0 foundation**; Graphology components and shortest-path methods | A topological path is not proof that information, trust, or action will travel along it; weights must declare meaning |
| Density, reciprocity, and local clustering coefficient | How cohesive, mutual, or locally closed is a selected typed subgraph? | **v0 foundation**; Graphology metrics or a verified equivalent | These measures are highly sensitive to scope and missing edges and do not equal relationship quality |
| Betweenness centrality | Which Nodes or edges sit on many selected shortest paths and may be brokers or bottlenecks? | **v0 foundation**; Graphology betweenness | Brokerage is a structural hypothesis sensitive to graph construction, not proof of control |
| PageRank | Which Nodes receive recursively weighted incoming attention/dependency in a directed graph? | **v0 exploratory metric**; Graphology PageRank | Direction, edge weight, damping, and scope must be visible; the result is not a universal influence score |
| Department/category mixing matrix and assortativity | Are observed ties concentrated within or across declared groups such as departments? | **organizational-profile Method**; typed aggregation first, optional NetworkX cross-check | Formal categories may be incomplete; mixing does not establish preference, discrimination, or cause |
| Position-to-Position metric delta over time windows | Which structural measures changed between evidence cutoffs or before/after a Strategy Step? | **v0 foundation wrapper** around the selected metrics | A metric change may reflect new evidence, changed scope, or correction rather than a real-world change; show both time axes |
| Louvain community detection with seed/resolution sensitivity runs | What candidate informal clusters appear under one modularity model? | **v0 exploratory Method**; Graphology Louvain, later compare through CDlib when useful | Communities are unstable model outputs, not established factions; expose resolution, seed, modularity, and disagreement |
| Independent Cascade and Linear Threshold diffusion | Under explicit adoption/propagation assumptions, how might a signal spread across a selected graph? | **opt-in later experiment**; NDlib in the optional Python worker | These are counterfactual Mechanisms, not default models of human reaction; parameters and calibration must be explicit |

Not selected for the first pack: opaque graph embeddings, GNN prediction,
automatic causal discovery, universal personality scoring, or one composite
"influence" number. They require a validated question, suitable labeled data,
and a baseline demonstrating incremental value.

## Causal, probabilistic, conversational, and explainability methods

| Candidate | Verified scope | License | StockMesh fit | Recommendation |
| --- | --- | --- | --- | --- |
| [DoWhy](https://github.com/py-why/dowhy) | Causal inference with explicit assumptions and refutation/testing | MIT | Strong discipline for separating causal questions from correlations | `P1` - candidate causal Method adapter; never infer a causal graph silently |
| [causal-learn](https://github.com/py-why/causal-learn) | Causal-discovery algorithms | MIT | Candidate hypothesis generator when data and assumptions support it | `P2` - output candidate Claims/graphs only, with sensitivity and human review |
| [pgmpy](https://github.com/pgmpy/pgmpy) | Causal and probabilistic graphical models | MIT | Useful for uncertain dependencies, Bayesian updating, and scenario scoring | `P1` - candidate probabilistic Method adapter |
| [Pyro](https://github.com/pyro-ppl/pyro) | Probabilistic programming | Apache-2.0 | Powerful for custom uncertainty models but high complexity | `P2` - defer until pgmpy/simple models cannot express a validated need |
| [scikit-learn](https://github.com/scikit-learn/scikit-learn) | General machine-learning algorithms and evaluation utilities | BSD-3-Clause | Reusable baselines for classification, clustering, calibration, and validation | `P1` - prefer measured baselines before custom models |
| [SHAP](https://github.com/shap/shap) | Feature-attribution explanations for model outputs | MIT | Useful for compatible learned evaluators, but not a general explanation of social reality | `P2` - use only with supported models and alongside evidence/method trace |
| [ConvoKit](https://github.com/CornellNLP/ConvoKit) | Conversational features and analysis of social phenomena in conversations | MIT | Closest reviewed reusable micro-conversation analysis toolkit | `P1` - priority spike candidate for turn, reply, coordination, and discourse Methods |
| [spaCy](https://github.com/explosion/spaCy) | Production NLP pipelines | MIT | Reusable extraction foundation for entities, sentences, and linguistic features | `P1` - candidate extraction component, not a stance/personality oracle |
| [BERTopic](https://github.com/MaartenGr/BERTopic) | Interpretable topic modeling | MIT | Useful optional topic/evolution Method | `P2` - adopt only if it beats simpler baselines and language-domain tests |
| Jungian, interpersonal, and strategic heuristics | Human-authored schools and practical lenses named in DW-016 | Varies; often books, courses, proprietary instruments, or public-domain ideas | Useful micro lenses and wording aids, but weak as universal predictors | `R/P2` - encode only as named, sourced, contestable Methods; never as hidden personality truth |

## Visualization, data, branching, and method operations

| Candidate | Verified scope | License | StockMesh fit | Recommendation |
| --- | --- | --- | --- | --- |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) | Browser graph visualization plus graph algorithms and interaction | MIT | Strong fit for inspectable network editing/exploration | `P1` - leading embedded graph-workbench candidate if the Web stack fits |
| [Graphology](https://github.com/graphology/graphology) | JS/TS graph model, traversal, metrics, centrality, shortest paths, and compatible community packages | MIT | Fits the TypeScript application core and selected transparent SNA pack | `P1 selected direction` - first in-process GraphEngine; retain algorithm/version trace and benchmark missing methods before adding a worker |
| [Sigma.js](https://github.com/jacomyal/sigma.js) | Scalable WebGL graph rendering over Graphology | MIT | Strong alternative renderer for larger interactive graphs | `P1` - benchmark against Cytoscape.js only when rendering scale requires it |
| [D3](https://github.com/d3/d3) | Low-level custom data visualization | ISC | Useful for specialized timelines, score views, and bespoke interactions | `P2` - use for gaps, not as a reason to hand-build the entire graph workbench |
| [Apache ECharts](https://github.com/apache/echarts) | Browser charting and interactive dashboards | Apache-2.0 | Strong score, uncertainty, timeline, and comparison views | `P1` - candidate non-network visualization layer |
| [DuckDB](https://github.com/duckdb/duckdb) | Embedded analytical SQL engine | MIT | Useful for local/private analytical staging and reproducible slices | `P2` - evaluate after workload and canonical-storage boundaries are known |
| [Dolt](https://github.com/dolthub/dolt) | Git-style versioned relational data | Apache-2.0 | Useful branch/diff/merge precedent and possible experiment store | `P2` - reference first; its relational branch model is not automatically the Position graph |
| [Apache AGE](https://github.com/apache/age) | Graph extension for PostgreSQL | Apache-2.0 | Permissive graph-storage option if PostgreSQL is later selected | `P2` - architecture candidate, not a current stack decision |
| [Neo4j](https://github.com/neo4j/neo4j) | Mature property-graph database and ecosystem | GPL-3.0/community plus commercial offerings | Strong query/model reference and possible separately licensed deployment | `R/P2` - no MIT-source incorporation; compare commercial/external use with Apache AGE and simple stores |
| [Cozo](https://github.com/cozodb/cozo) | Transactional relational-graph-vector database with Datalog | MPL-2.0; lower recent activity in this review | Interesting rule/query and graph-vector combination | `P2` - legal/maintenance spike required; permissive alternatives preferred |
| [Kuzu](https://github.com/kuzudb/kuzu) | Embedded property-graph database | MIT, but repository archived | Technical fit without maintenance confidence | `A` - do not start a new dependency; use AGE, a maintained store, or simple files/SQL |
| [KurrentDB](https://github.com/kurrent-io/KurrentDB) | Event-native database and streaming | Custom Kurrent License v1 with hosted-service limitation | Relevant event-sourcing precedent but avoidable license complexity | `A/R` - study event semantics; prefer a permissive store or a narrow append-only log |
| [MLflow](https://github.com/mlflow/mlflow) | Experiment/evaluation/trace operations for models and Agents | Apache-2.0 | Possible Method-run provenance and evaluation infrastructure | `P2` - reuse only if its trace model fits; StockMesh domain provenance remains authoritative |

## Build-versus-reuse plan

| Capability | Default research direction | Do not build yet | StockMesh-owned boundary |
| --- | --- | --- | --- |
| Core graph metrics | Graphology first inside the TypeScript core; optional NetworkX cross-check/worker | Centrality, paths, components, PageRank, Louvain, standard graph structures | Profile semantics, typed/time-bounded projection, evidence cutoff, Method trace, LLM/human interpretation |
| Communities and diffusion | Graphology Louvain for initial exploration; CDlib and NDlib only behind the optional Python worker | Community/diffusion algorithm catalogs | Sensitivity/disagreement, Mechanism assumptions, party/objective interpretation, uncertainty and review |
| Statistical/causal analysis | graspologic, DoWhy, pgmpy, causal-learn | Generic estimators and inference engines | Question formulation, admissible evidence, causal assumptions, Claim status |
| Conversation/text | Provider-neutral LLM AnalysisPort first; add ConvoKit/spaCy Methods only for measured gaps; BERTopic only if justified | Generic language analysis and, later, reusable dialogue/linguistic features | Exact branch context, identity resolution, provider trace, stance/personality Claim policy, wording decision support |
| General simulation | Mesa; compare Concordia/AgentSociety/OneSim | Scheduler, Agent lifecycle, experiment plumbing | Position/Strategy Step bridge, evidence-to-simulation boundary, real/synthetic separation |
| Social-platform simulation | OASIS | Platform actions, Agent graph, recommender simulation | Authorized profiles, calibration, scenario provenance, result promotion rules |
| Multi-party search experiments | OpenSpiel and PettingZoo | Generic game/search environment interfaces | Non-zero-sum objectives, incomplete social evidence, Method portfolios, explanation |
| Graph UI | Cytoscape.js or Sigma.js/Graphology; ECharts for score/timeline views | Rendering, layout engines, generic chart controls | Workbench workflow, review states, evidence/Claim/mode distinction |
| Analytical storage/versioning | DuckDB/Dolt/AGE only after workload evidence | General SQL engine, graph query engine, branch storage | Canonical authorities, append-only promotion, private/public policy, replay contract |

## Candidate v0 foundation stack evidence

This is official-source eligibility evidence for the adopted direction in the
[architecture direction](../architecture/architecture.md#candidate-v0-local-first-modular-monolith),
not dependency adoption. GitHub repository license/archive metadata was checked
on 2026-08-16. Node.js requires its normal version-level license and bundled
third-party-notice review because repository metadata reports `NOASSERTION`.

| Candidate | Official source | License observed | Candidate role |
| --- | --- | --- | --- |
| Node.js | <https://github.com/nodejs/node> | Repository metadata `NOASSERTION`; official license/bundled notices require version review | local application runtime |
| TypeScript | <https://github.com/microsoft/TypeScript> | Apache-2.0 | shared Domain/application/client language |
| Fastify | <https://github.com/fastify/fastify> | MIT | thin HTTP and static-asset host |
| better-sqlite3 | <https://github.com/WiseLibs/better-sqlite3> | MIT | Node.js SQLite adapter |
| Drizzle ORM | <https://github.com/drizzle-team/drizzle-orm> | Apache-2.0 | relational schema and migrations |
| SQLite | <https://sqlite.org/copyright.html> | Public domain | local-first transactional store |
| React / Vite | <https://github.com/facebook/react>, <https://github.com/vitejs/vite> | MIT | Web application and build tooling |
| Graphology | <https://github.com/graphology/graphology> | MIT | typed in-memory graph model and initial SNA algorithms |
| Cytoscape.js | <https://github.com/cytoscape/cytoscape.js> | MIT | interactive Position/network board |
| Apache ECharts | <https://github.com/apache/echarts> | Apache-2.0 | Timeline, score, uncertainty, and comparison views |
| Vitest | <https://github.com/vitest-dev/vitest> | MIT | Domain/application/contract verification |
| Playwright | <https://github.com/microsoft/playwright> | Apache-2.0 | complete Web workflow verification |

Before installation, pin exact versions and review lockfile transitive licenses,
security advisories, runtime support, and the smallest representative spike.

## Adoption gates

Before any candidate becomes a dependency or normal route, record:

1. The exact StockMesh use case and a simpler baseline.
2. The official source and exact version/commit.
3. Direct and transitive license review against MIT distribution and deployment.
4. Maintenance, security, privacy, platform, and data-egress behavior.
5. A small representative benchmark or workflow proof.
6. The adapter boundary, fallback, result provenance, and removal/rebuild path.
7. What remains human-reviewed and what the dependency is forbidden to claim.

## Sources reviewed but not adopted

The public locators above are retained for traceability. Search summaries were
used only for discovery; claims in the tables were checked against the linked
official source where available. The temporary research credential supplied in
the live task was not written to the repository or retained as a source.
