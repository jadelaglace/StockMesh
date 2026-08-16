# Documentation authority index

StockMesh is in discovery / definition. This index identifies one primary authority for each role and the direction in which changes propagate.

```text
direct wording / external sources
  -> current requirements
  -> product behavior (PRD)
  -> candidate domain model
  -> acceptance
  -> interface design when applicable
  -> architecture and data governance
  -> versioned contracts and synthetic validation
  -> external integration contract
  -> active plan and live status
  -> verification evidence
```

| Role | Primary authority | Owns | Does not own |
| --- | --- | --- | --- |
| Direct wording evidence | [discovery/direct-wording.md](discovery/direct-wording.md) | Selected exact user wording | Current interpreted requirements |
| External reference register | [discovery/source-register.md](discovery/source-register.md) | Source identity, access and evidence status | Adopted product decisions |
| Prior-art and reuse survey | [discovery/prior-art-survey.md](discovery/prior-art-survey.md) | Candidate capabilities, license posture, alternatives, and Agent recommendations | Dependency adoption or implementation |
| Current intent and requirements | [product/requirements.md](product/requirements.md) | Current outcomes, constraints and open decisions | Implementation plan or run status |
| Product behavior / PRD | [product/prd.md](product/prd.md) | Actors, use cases and observable behavior | Storage or code layout |
| Candidate domain model | [product/domain-model.md](product/domain-model.md) | Proposed universal semantics, domain profiles, and optional application views | Data schema or adopted implementation contract |
| Acceptance | [product/acceptance.md](product/acceptance.md) | Observable success and failure criteria | Test implementation |
| Web-first interface design | [design/web-workbench.md](design/web-workbench.md) | Primary Web workbench tasks, branch/replay interactions, and candidate information layout | Framework or backend internals |
| Architecture / ownership | [architecture/architecture.md](architecture/architecture.md) | Durable boundaries, data classes and permitted writers | Product priority |
| Versioned contracts | [../contracts/README.md](../contracts/README.md) | Reviewable semantic contract versions and synthetic fixtures | Runtime schema, storage, or API implementation |
| Candidate Skill/CLI client contract | [integrations/agent-skill-contract.md](integrations/agent-skill-contract.md) | Proposed transport-neutral lightweight client capabilities over the shared application/analysis API | Canonical data ownership, LLM provider selection, or implemented API |
| Active plan | [delivery/active-plan.md](delivery/active-plan.md) | Single current goal, route, next action and terminal | Product truth or execution logs |
| Candidate roadmap | [delivery/candidate-roadmap.md](delivery/candidate-roadmap.md) | Proposed implementation order and stage terminals | Live progress or user adoption |
| Live status | [delivery/status.md](delivery/status.md) | Evidence-backed current delivery state | Product acceptance |
| Verification | [verification/README.md](verification/README.md) | Test cases and evidence pointers | New requirements |
| Decisions | [decisions/README.md](decisions/README.md) | Explicitly adopted durable decisions | Candidate ideas by proximity |
| Skill observations | [meta/product-docs-init-observations.md](meta/product-docs-init-observations.md) | Init-phase process observations | Product requirements |

## Update order

Update the highest authority whose meaning changed, then inspect only affected downstream roles. Do not duplicate editable facts. Direct wording and external material remain evidence until an authorized decision adopts an interpretation.

## Human and Agent authority

The human owns requirements, priority, success criteria, scope tradeoffs, sensitive-data authority, product acceptance, and irreversible choices. Agents may research, propose reversible choices, implement, verify, maintain evidence, and report observed progress without claiming acceptance.
