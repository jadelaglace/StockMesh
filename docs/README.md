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
  -> external integration contract
  -> active plan and live status
  -> verification evidence
```

| Role | Primary authority | Owns | Does not own |
| --- | --- | --- | --- |
| Direct wording evidence | [discovery/direct-wording.md](discovery/direct-wording.md) | Selected exact user wording | Current interpreted requirements |
| External reference register | [discovery/source-register.md](discovery/source-register.md) | Source identity, access and evidence status | Adopted product decisions |
| Current intent and requirements | [product/requirements.md](product/requirements.md) | Current outcomes, constraints and open decisions | Implementation plan or run status |
| Product behavior / PRD | [product/prd.md](product/prd.md) | Actors, use cases and observable behavior | Storage or code layout |
| Candidate domain model | [product/domain-model.md](product/domain-model.md) | Proposed Playground/Pawn/Position/Move/Line language for review | Adopted implementation contract |
| Acceptance | [product/acceptance.md](product/acceptance.md) | Observable success and failure criteria | Test implementation |
| Candidate interface design | [design/web-workbench.md](design/web-workbench.md) | Proposed Web workbench tasks and information layout | Framework or backend internals |
| Architecture / ownership | [architecture/architecture.md](architecture/architecture.md) | Durable boundaries, data classes and permitted writers | Product priority |
| Candidate Agent contract | [integrations/agent-skill-contract.md](integrations/agent-skill-contract.md) | Proposed transport-neutral external Agent capabilities | Canonical data ownership or implemented API |
| Active plan | [delivery/active-plan.md](delivery/active-plan.md) | Single current goal, route, next action and terminal | Product truth or execution logs |
| Live status | [delivery/status.md](delivery/status.md) | Evidence-backed current delivery state | Product acceptance |
| Verification | [verification/README.md](verification/README.md) | Test cases and evidence pointers | New requirements |
| Decisions | [decisions/README.md](decisions/README.md) | Explicitly adopted durable decisions | Candidate ideas by proximity |
| Skill observations | [meta/product-docs-init-observations.md](meta/product-docs-init-observations.md) | Init-phase process observations | Product requirements |

## Update order

Update the highest authority whose meaning changed, then inspect only affected downstream roles. Do not duplicate editable facts. Direct wording and external material remain evidence until an authorized decision adopts an interpretation.

## Human and Agent authority

The human owns requirements, priority, success criteria, scope tradeoffs, sensitive-data authority, product acceptance, and irreversible choices. Agents may research, propose reversible choices, implement, verify, maintain evidence, and report observed progress without claiming acceptance.
