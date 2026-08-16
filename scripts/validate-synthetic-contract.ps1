[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$contractPath = Join-Path $repoRoot 'contracts\v0.1\contract.json'
$fixturePath = Join-Path $repoRoot 'contracts\v0.1\synthetic-unfinished-record.json'

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "Synthetic contract validation failed: $Message"
    }
}

Assert-Condition (Test-Path -LiteralPath $contractPath) 'contract.json is missing.'
Assert-Condition (Test-Path -LiteralPath $fixturePath) 'synthetic fixture is missing.'

$contractRaw = Get-Content -LiteralPath $contractPath -Raw
$fixtureRaw = Get-Content -LiteralPath $fixturePath -Raw
$contract = $contractRaw | ConvertFrom-Json
$fixture = $fixtureRaw | ConvertFrom-Json

Assert-Condition ($contract.contract_id -eq 'stockmesh.domain') 'unexpected contract id.'
Assert-Condition ($contract.version -eq '0.1.0') 'contract version must be 0.1.0.'
Assert-Condition ($fixture.contract -eq 'stockmesh.domain@0.1.0') 'fixture does not pin the contract version.'
Assert-Condition ($fixture.fixture_status -eq 'synthetic-only') 'fixture is not marked synthetic-only.'
Assert-Condition ($fixture.synthetic_notice -match '(?i)invented') 'fixture is missing its synthetic notice.'

$requiredTypes = @('Playground', 'Node', 'Relation', 'Flow', 'State', 'Event', 'Mechanism', 'Transition', 'Position', 'Timeline', 'Perspective', 'Evaluation', 'Action', 'Trajectory')
$contractTypes = @($contract.universal_types.PSObject.Properties.Name)
foreach ($type in $requiredTypes) {
    Assert-Condition ($contractTypes -contains $type) "universal type $type is missing."
}

Assert-Condition ($contract.strategy_view_aliases.Node -eq 'Pawn') 'Node must have Pawn as its strategy alias.'
Assert-Condition ($contract.strategy_view_aliases.Action -eq 'Move') 'Action must have Move as its strategy alias.'
Assert-Condition ($contract.strategy_view_aliases.Trajectory -eq 'Line') 'Trajectory must have Line as its strategy alias.'
Assert-Condition ($contract.knowledge_types.Assertion.compatibility_alias_for -eq 'Claim') 'Assertion must remain a Claim compatibility alias.'
Assert-Condition ($contract.game_record_view.promotion_rule -match '(?i)never rewrites') 'promotion rule must forbid rewrites.'
Assert-Condition ($contract.game_record_view.frontier_rule -match '(?i)latest confirmed') 'frontier rule must name the latest confirmed Position.'

$allIds = New-Object System.Collections.Generic.List[string]
$collections = @('sources', 'playgrounds', 'perspectives', 'nodes', 'relations', 'flows', 'claims', 'states', 'events', 'mechanisms', 'positions', 'actions', 'transitions', 'evaluations', 'trajectories', 'episodes', 'game_records')
foreach ($collectionName in $collections) {
    foreach ($item in @($fixture.$collectionName)) {
        if ($null -ne $item -and $null -ne $item.id) {
            Assert-Condition (-not $allIds.Contains([string]$item.id)) "duplicate id $($item.id)."
            $allIds.Add([string]$item.id)
        }
    }
}

$sourceIds = @($fixture.sources | ForEach-Object { $_.id })
$nodeIds = @($fixture.nodes | ForEach-Object { $_.id })
$claimIds = @($fixture.claims | ForEach-Object { $_.id })
$assertionIds = @($fixture.assertions)
$eventIds = @($fixture.events | ForEach-Object { $_.id })
$positionIds = @($fixture.positions | ForEach-Object { $_.id })
$actionIds = @($fixture.actions | ForEach-Object { $_.id })
$transitionIds = @($fixture.transitions | ForEach-Object { $_.id })
$trajectoryIds = @($fixture.trajectories | ForEach-Object { $_.id })

foreach ($claim in @($fixture.claims)) {
    foreach ($sourceId in @($claim.evidence_refs)) {
        Assert-Condition ($sourceIds -contains $sourceId) "claim $($claim.id) references missing evidence $sourceId."
    }
    Assert-Condition ($null -ne $claim.epistemic_status) "claim $($claim.id) has no epistemic status."
    Assert-Condition ($null -ne $claim.valid_time) "claim $($claim.id) has no valid time."
}
foreach ($assertionId in $assertionIds) {
    Assert-Condition ($claimIds -contains $assertionId) "Assertion alias references missing Claim $assertionId."
}

foreach ($collectionName in @('relations', 'flows', 'states', 'mechanisms')) {
    foreach ($item in @($fixture.$collectionName)) {
        foreach ($claimId in @($item.claim_refs)) {
            Assert-Condition ($claimIds -contains $claimId) "$collectionName item $($item.id) references missing Claim $claimId."
        }
    }
}

foreach ($relation in @($fixture.relations)) {
    Assert-Condition ($nodeIds -contains $relation.subject_id) "Relation $($relation.id) has a missing subject Node."
    Assert-Condition ($nodeIds -contains $relation.object_id) "Relation $($relation.id) has a missing object Node."
}
foreach ($flow in @($fixture.flows)) {
    foreach ($nodeId in @($flow.path)) {
        Assert-Condition ($nodeIds -contains $nodeId) "Flow $($flow.id) references missing Node $nodeId."
    }
}
foreach ($state in @($fixture.states)) {
    Assert-Condition ($nodeIds -contains $state.subject_id) "State $($state.id) references missing Node $($state.subject_id)."
}
foreach ($action in @($fixture.actions)) {
    Assert-Condition ($nodeIds -contains $action.actor_node_id) "Action $($action.id) references missing actor Node."
    Assert-Condition ($positionIds -contains $action.target_position_id) "Action $($action.id) references missing target Position."
}
foreach ($transition in @($fixture.transitions)) {
    Assert-Condition ($positionIds -contains $transition.from_position_id) "Transition $($transition.id) has a missing source Position."
    Assert-Condition ($positionIds -contains $transition.to_position_id) "Transition $($transition.id) has a missing target Position."
    foreach ($causeId in @($transition.cause_refs)) {
        Assert-Condition ($allIds.Contains([string]$causeId)) "Transition $($transition.id) references missing cause $causeId."
    }
}
foreach ($trajectory in @($fixture.trajectories)) {
    foreach ($positionId in @($trajectory.position_ids)) {
        Assert-Condition ($positionIds -contains $positionId) "Trajectory $($trajectory.id) references missing Position $positionId."
    }
    foreach ($transitionId in @($trajectory.transition_ids)) {
        Assert-Condition ($transitionIds -contains $transitionId) "Trajectory $($trajectory.id) references missing Transition $transitionId."
    }
}

foreach ($event in @($fixture.events)) {
    Assert-Condition (@('actual', 'reconstructed') -contains $event.mode) "Main Line event $($event.id) is not actual or reconstructed."
    foreach ($claimId in @($event.claim_refs)) {
        Assert-Condition ($claimIds -contains $claimId) "event $($event.id) references missing claim $claimId."
    }
    Assert-Condition ($positionIds -contains $event.resulting_position_id) "event $($event.id) has no known resulting Position."
}

$record = @($fixture.game_records)[0]
Assert-Condition ($record.status -eq 'ongoing') 'synthetic Game Record must remain unfinished/ongoing.'
foreach ($eventId in @($record.main_line.event_ids)) {
    Assert-Condition ($eventIds -contains $eventId) "Main Line references missing Event $eventId."
}
Assert-Condition ($trajectoryIds -contains $record.main_line.trajectory_id) 'Main Line trajectory is missing.'
Assert-Condition ($positionIds -contains $record.frontier.position_id) 'frontier Position is missing.'
Assert-Condition (@($fixture.positions | Where-Object { $_.id -eq $record.frontier.position_id }).mode -ne 'hypothetical') 'frontier must be confirmed/reconstructed, not hypothetical.'
foreach ($actionId in @($record.frontier.unresolved_action_ids)) {
    Assert-Condition ($actionIds -contains $actionId) "frontier references missing Action $actionId."
}
Assert-Condition (@($record.promotion_records).Count -eq 0) 'unfinished fixture should have no promotion record.'
Assert-Condition ($fixture.promotion_policy.rewrite_forbidden -eq $true) 'promotion rewrite prohibition is missing.'

$variation = @($record.variations)[0]
Assert-Condition ($variation.mode -in @('hypothetical', 'predicted')) 'Variation must remain hypothetical or predicted.'
Assert-Condition ($positionIds -contains $variation.anchor_position_id) 'Variation anchor Position is missing.'
Assert-Condition ($trajectoryIds -contains $variation.trajectory_id) 'Variation trajectory is missing.'
Assert-Condition (@($fixture.trajectories | Where-Object { $_.id -eq $variation.trajectory_id }).mode -in @('hypothetical', 'predicted')) 'Variation trajectory must remain possible, not actual.'

$forbidden = '(?i)https?://|private[/\\]datasets|babata'
Assert-Condition ($fixtureRaw -notmatch $forbidden) 'fixture contains an external locator, private dataset path, or acquisition-tool marker.'

Write-Output "Synthetic contract validation passed: $($contract.version), $($fixture.fixture_id)"
