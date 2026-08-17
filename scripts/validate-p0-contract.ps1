[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$contractPath = Join-Path $repoRoot 'contracts\v0.2\contract.json'
$fixturePath = Join-Path $repoRoot 'contracts\v0.2\synthetic-organizational-learning-record.json'
$matrixPath = Join-Path $repoRoot 'contracts\v0.2\p0-acceptance-matrix.json'

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "P0 contract validation failed: $Message"
    }
}

function Get-NormalizedLfSha256 {
    param([string]$Path)
    $text = (Get-Content -Raw -LiteralPath $Path) -replace "`r`n", "`n"
    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        return [Convert]::ToHexString($sha256.ComputeHash($utf8.GetBytes($text)))
    } finally {
        $sha256.Dispose()
    }
}

function Copy-JsonObject {
    param($InputObject)
    return (($InputObject | ConvertTo-Json -Depth 100 -Compress) | ConvertFrom-Json)
}

function Test-PublicFixtureText {
    param([string]$Text)
    $forbidden = '(?i)https?://|kimi\.com|private[/\\]datasets|babata|(?:api|access)[_-]?key|ghp_[A-Za-z0-9_]+'
    return $Text -notmatch $forbidden
}

function Test-AssessmentEligibility {
    param($Fixture)
    $variations = @{}
    foreach ($variation in @($Fixture.variations)) { $variations[$variation.id] = $variation }
    foreach ($assessment in @($Fixture.forecast_assessments)) {
        if (-not $variations.ContainsKey([string]$assessment.forecast_variation_id)) { return $false }
        if ($variations[[string]$assessment.forecast_variation_id].purpose -ne 'forecast') { return $false }
    }
    return $true
}

function Test-ExpiredAssessmentRules {
    param($Fixture)
    $coverageById = @{}
    foreach ($coverage in @($Fixture.observation_coverages)) { $coverageById[$coverage.id] = $coverage }
    foreach ($assessment in @($Fixture.forecast_assessments)) {
        if ($assessment.status -ne 'expired-unobserved') { continue }
        if (-not $coverageById.ContainsKey([string]$assessment.observation_coverage_id)) { return $false }
        if ($coverageById[[string]$assessment.observation_coverage_id].status -ne 'adequate') { return $false }
        if (@($assessment.actual_event_refs).Count -ne 0) { return $false }
        if ([DateTimeOffset]::Parse($assessment.horizon.to) -ge [DateTimeOffset]::Parse($assessment.assessed_at)) { return $false }
    }
    return $true
}

function Test-FrozenVariationRoots {
    param($Fixture)
    $positionById = @{}
    $contextById = @{}
    foreach ($position in @($Fixture.positions)) { $positionById[$position.id] = $position }
    foreach ($context in @($Fixture.context_snapshots)) { $contextById[$context.id] = $context }
    foreach ($variation in @($Fixture.variations)) {
        if (-not $positionById.ContainsKey([string]$variation.anchor_position_id)) { return $false }
        if (-not $contextById.ContainsKey([string]$variation.root_context_snapshot_id)) { return $false }
        $anchor = $positionById[[string]$variation.anchor_position_id]
        $context = $contextById[[string]$variation.root_context_snapshot_id]
        if ($variation.root_profile_snapshot_id -ne $anchor.profile_snapshot_id) { return $false }
        if ($variation.root_profile_snapshot_id -ne $context.profile_snapshot_id) { return $false }
        if ($context.position_id -ne $variation.anchor_position_id) { return $false }
    }
    return $true
}

foreach ($path in @($contractPath, $fixturePath, $matrixPath)) {
    Assert-Condition (Test-Path -LiteralPath $path) "missing required artifact $path."
}

$contractRaw = Get-Content -Raw -LiteralPath $contractPath
$fixtureRaw = Get-Content -Raw -LiteralPath $fixturePath
$matrixRaw = Get-Content -Raw -LiteralPath $matrixPath
$contract = $contractRaw | ConvertFrom-Json
$fixture = $fixtureRaw | ConvertFrom-Json
$matrix = $matrixRaw | ConvertFrom-Json

Assert-Condition ($contract.contract_id -eq 'stockmesh.domain') 'unexpected contract id.'
Assert-Condition ($contract.version -eq '0.2.0') 'contract version must be 0.2.0.'
Assert-Condition ($contract.status -eq 'candidate-for-review') 'contract must remain a review candidate.'
Assert-Condition ($fixture.contract -eq 'stockmesh.domain@0.2.0') 'fixture does not pin 0.2.0.'
Assert-Condition ($fixture.fixture_id -eq 'stockmesh.synthetic.organizational-learning-loop.v0.2') 'unexpected fixture id.'
Assert-Condition ($fixture.fixture_status -eq 'synthetic-only') 'fixture is not synthetic-only.'
Assert-Condition ($fixture.synthetic_notice -match '(?i)invented') 'fixture lacks an explicit invented-data notice.'
Assert-Condition ($fixture.source_policy.private_case_used -eq $false) 'fixture claims use of a private case.'
Assert-Condition ($fixture.source_policy.external_locators_allowed -eq $false) 'fixture permits external locators.'
Assert-Condition (Test-PublicFixtureText $fixtureRaw) 'fixture contains a locator, private marker, credential marker, or acquisition-tool marker.'

Assert-Condition ($matrix.phase_id -eq 'P0') 'acceptance matrix phase must be P0.'
Assert-Condition ($matrix.status -eq 'frozen') 'acceptance matrix is not frozen.'
Assert-Condition ($matrix.contract_target -eq 'stockmesh.domain@0.2.0') 'matrix targets the wrong contract.'
$criterionIds = @($matrix.criteria | ForEach-Object { $_.id })
$expectedCriterionIds = 1..12 | ForEach-Object { 'P0-{0:D2}' -f $_ }
Assert-Condition ($criterionIds.Count -eq $expectedCriterionIds.Count) 'acceptance matrix must contain exactly twelve criteria.'
Assert-Condition (@($criterionIds | Select-Object -Unique).Count -eq $criterionIds.Count) 'acceptance matrix contains duplicate criterion ids.'
foreach ($criterionId in $expectedCriterionIds) {
    Assert-Condition ($criterionIds -contains $criterionId) "acceptance criterion $criterionId is missing."
}
foreach ($criterion in @($matrix.criteria)) {
    Assert-Condition (@($criterion.requirement_refs).Count -gt 0) "criterion $($criterion.id) has no requirement reference."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$criterion.expected)) "criterion $($criterion.id) has no expected result."
    foreach ($relativePath in @($criterion.evidence_paths)) {
        Assert-Condition (Test-Path -LiteralPath (Join-Path $repoRoot ($relativePath -replace '/', '\'))) "criterion $($criterion.id) references missing evidence path $relativePath."
    }
}

Assert-Condition ($contract.compatibility.predecessor -eq 'stockmesh.domain@0.1.0') 'predecessor is not 0.1.0.'
Assert-Condition ($contract.compatibility.predecessor_artifacts_immutable -eq $true) 'predecessor immutability is not required.'
$predecessorHashes = $contract.compatibility.predecessor_normalized_lf_sha256
foreach ($property in $predecessorHashes.PSObject.Properties) {
    $path = Join-Path $repoRoot ($property.Name -replace '/', '\')
    Assert-Condition (Test-Path -LiteralPath $path) "predecessor artifact $($property.Name) is missing."
    Assert-Condition ((Get-NormalizedLfSha256 $path) -eq $property.Value) "predecessor artifact $($property.Name) changed."
}

$requiredUniversalTypes = @('Playground', 'Node', 'Relation', 'Flow', 'State', 'Event', 'Mechanism', 'Transition', 'Position', 'Timeline', 'Perspective', 'Evaluation', 'Action', 'Trajectory')
$requiredDerivedTypes = @('Utterance', 'StrategyStep', 'ProfileSnapshot', 'ContextSnapshot', 'Variation', 'ObservationCoverage', 'ForecastAssessment', 'ActualForecastOutcome', 'ProfileClaimRevisionProposal', 'MethodRun', 'AnalysisRun', 'SearchRun', 'CacheRecord', 'CalibrationRecord')
$universalTypeNames = @($contract.universal_types.PSObject.Properties.Name)
$derivedTypeNames = @($contract.derived_and_view_types.PSObject.Properties.Name)
foreach ($type in $requiredUniversalTypes) {
    Assert-Condition ($universalTypeNames -contains $type) "universal type $type is missing."
    Assert-Condition (@($contract.universal_types.$type.required).Count -gt 0) "universal type $type has no required fields."
}
foreach ($type in $requiredDerivedTypes) {
    Assert-Condition ($derivedTypeNames -contains $type) "derived/view type $type is missing."
    Assert-Condition (@($contract.derived_and_view_types.$type.required).Count -gt 0) "derived/view type $type has no required fields."
}
Assert-Condition ($contract.knowledge_types.Assertion.compatibility_alias_for -eq 'Claim') 'Assertion must remain a Claim alias.'
Assert-Condition (@($contract.enums.branch_purposes) -join ',' -eq 'forecast,counterfactual,exploratory') 'branch-purpose enum is incomplete or reordered unexpectedly.'
foreach ($status in @('pending', 'matched', 'partially-matched', 'diverged', 'expired-unobserved', 'unknown')) {
    Assert-Condition (@($contract.enums.forecast_assessment_statuses) -contains $status) "forecast assessment status $status is missing."
}
Assert-Condition ($contract.game_record_view.promotion_rule -match '(?i)never rewrites') 'game-record promotion rule must forbid rewrites.'
Assert-Condition ($contract.learning_boundaries.profile_learning_writer -ne $contract.learning_boundaries.calibration_writer) 'profile learning and calibration writers must be distinct.'

$idCollections = @(
    'sources', 'playgrounds', 'perspectives', 'objectives', 'nodes', 'relations', 'flows', 'claims',
    'review_decisions', 'profile_snapshots', 'states', 'utterances', 'actions', 'events', 'positions',
    'transitions', 'strategy_steps', 'trajectories', 'method_runs', 'context_snapshots', 'analysis_runs',
    'search_runs', 'variations', 'observation_coverages', 'forecast_assessments', 'actual_forecast_outcomes',
    'profile_claim_revision_proposals', 'calibration_records', 'evaluations', 'cache_records', 'episodes', 'game_records'
)
$allIds = [System.Collections.Generic.HashSet[string]]::new()
foreach ($collectionName in $idCollections) {
    foreach ($item in @($fixture.$collectionName)) {
        Assert-Condition ($null -ne $item.id) "$collectionName contains an item without id."
        Assert-Condition ($allIds.Add([string]$item.id)) "duplicate id $($item.id)."
    }
}
Assert-Condition ($allIds.Add([string]$fixture.timeline.id)) "duplicate timeline id $($fixture.timeline.id)."

$sourceIds = @($fixture.sources | ForEach-Object id)
$nodeIds = @($fixture.nodes | ForEach-Object id)
$claimIds = @($fixture.claims | ForEach-Object id)
$reviewIds = @($fixture.review_decisions | ForEach-Object id)
$profileSnapshotIds = @($fixture.profile_snapshots | ForEach-Object id)
$positionIds = @($fixture.positions | ForEach-Object id)
$eventIds = @($fixture.events | ForEach-Object id)
$actionIds = @($fixture.actions | ForEach-Object id)
$transitionIds = @($fixture.transitions | ForEach-Object id)
$stepIds = @($fixture.strategy_steps | ForEach-Object id)
$trajectoryIds = @($fixture.trajectories | ForEach-Object id)
$variationIds = @($fixture.variations | ForEach-Object id)
$coverageIds = @($fixture.observation_coverages | ForEach-Object id)
$assessmentIds = @($fixture.forecast_assessments | ForEach-Object id)
$methodRunIds = @($fixture.method_runs | ForEach-Object id)
$analysisRunIds = @($fixture.analysis_runs | ForEach-Object id)
$searchRunIds = @($fixture.search_runs | ForEach-Object id)
$objectiveIds = @($fixture.objectives | ForEach-Object id)

foreach ($source in @($fixture.sources)) {
    Assert-Condition ($null -eq $source.locator) "source $($source.id) has a locator."
    Assert-Condition ($source.sensitivity -eq 'public-synthetic') "source $($source.id) is not public-synthetic."
}
foreach ($claim in @($fixture.claims)) {
    Assert-Condition (@($claim.evidence_refs).Count -gt 0) "claim $($claim.id) has no evidence."
    foreach ($sourceId in @($claim.evidence_refs)) { Assert-Condition ($sourceIds -contains $sourceId) "claim $($claim.id) references missing evidence $sourceId." }
    Assert-Condition ($null -ne $claim.valid_time) "claim $($claim.id) has no valid time."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$claim.observed_at)) "claim $($claim.id) has no observation time."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$claim.recorded_at)) "claim $($claim.id) has no record time."
    Assert-Condition ([int]$claim.revision -ge 1) "claim $($claim.id) has no valid revision."
}
foreach ($assertionId in @($fixture.assertions)) { Assert-Condition ($claimIds -contains $assertionId) "Assertion references missing Claim $assertionId." }

foreach ($relation in @($fixture.relations)) {
    Assert-Condition ($nodeIds -contains $relation.subject_id) "relation $($relation.id) has a missing subject."
    Assert-Condition ($nodeIds -contains $relation.object_id) "relation $($relation.id) has a missing object."
    foreach ($claimId in @($relation.claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "relation $($relation.id) references missing Claim $claimId." }
}
foreach ($flow in @($fixture.flows)) {
    foreach ($nodeId in @($flow.path)) { Assert-Condition ($nodeIds -contains $nodeId) "flow $($flow.id) references missing Node $nodeId." }
    foreach ($claimId in @($flow.claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "flow $($flow.id) references missing Claim $claimId." }
}
foreach ($state in @($fixture.states)) {
    Assert-Condition ($nodeIds -contains $state.subject_id) "state $($state.id) references missing Node."
    foreach ($claimId in @($state.claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "state $($state.id) references missing Claim $claimId." }
}
foreach ($snapshot in @($fixture.profile_snapshots)) {
    foreach ($claimId in @($snapshot.claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "profile snapshot $($snapshot.id) references missing Claim $claimId." }
}
foreach ($position in @($fixture.positions)) {
    Assert-Condition ($profileSnapshotIds -contains $position.profile_snapshot_id) "position $($position.id) references missing profile snapshot."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$position.projection_identity)) "position $($position.id) has no projection identity."
}
foreach ($utterance in @($fixture.utterances)) {
    Assert-Condition ($nodeIds -contains $utterance.speaker_node_id) "utterance $($utterance.id) has a missing speaker."
    foreach ($nodeId in @($utterance.audience_node_ids)) { Assert-Condition ($nodeIds -contains $nodeId) "utterance $($utterance.id) references missing audience Node $nodeId." }
    Assert-Condition ($sourceIds -contains $utterance.evidence_ref) "utterance $($utterance.id) references missing evidence."
    Assert-Condition ($claimIds -contains $utterance.claim_ref) "utterance $($utterance.id) references missing Claim."
}
foreach ($action in @($fixture.actions)) {
    Assert-Condition ($nodeIds -contains $action.actor_node_id) "action $($action.id) references missing actor."
    Assert-Condition ($positionIds -contains $action.target_position_id) "action $($action.id) references missing target Position."
}
foreach ($event in @($fixture.events)) {
    Assert-Condition ($positionIds -contains $event.resulting_position_id) "event $($event.id) references missing resulting Position."
    foreach ($claimId in @($event.claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "event $($event.id) references missing Claim $claimId." }
}
foreach ($transition in @($fixture.transitions)) {
    Assert-Condition ($positionIds -contains $transition.from_position_id) "transition $($transition.id) has a missing source Position."
    Assert-Condition ($positionIds -contains $transition.to_position_id) "transition $($transition.id) has a missing target Position."
    foreach ($causeId in @($transition.cause_refs)) { Assert-Condition ($allIds.Contains([string]$causeId)) "transition $($transition.id) references missing cause $causeId." }
}
foreach ($step in @($fixture.strategy_steps)) {
    Assert-Condition ($positionIds -contains $step.before_position_id) "step $($step.id) has a missing before Position."
    Assert-Condition ($positionIds -contains $step.after_position_id) "step $($step.id) has a missing after Position."
    Assert-Condition ($transitionIds -contains $step.transition_id) "step $($step.id) has a missing Transition."
    $transition = @($fixture.transitions | Where-Object id -eq $step.transition_id)[0]
    Assert-Condition ($transition.from_position_id -eq $step.before_position_id -and $transition.to_position_id -eq $step.after_position_id) "step $($step.id) disagrees with its Transition endpoints."
    foreach ($eventId in @($step.event_refs)) { Assert-Condition ($eventIds -contains $eventId) "step $($step.id) references missing Event $eventId." }
    foreach ($actionId in @($step.action_refs)) { Assert-Condition ($actionIds -contains $actionId) "step $($step.id) references missing Action $actionId." }
    foreach ($sourceId in @($step.evidence_refs)) { Assert-Condition ($sourceIds -contains $sourceId) "step $($step.id) references missing evidence $sourceId." }
}
foreach ($trajectory in @($fixture.trajectories)) {
    foreach ($positionId in @($trajectory.position_ids)) { Assert-Condition ($positionIds -contains $positionId) "trajectory $($trajectory.id) references missing Position $positionId." }
    foreach ($transitionId in @($trajectory.transition_ids)) { Assert-Condition ($transitionIds -contains $transitionId) "trajectory $($trajectory.id) references missing Transition $transitionId." }
    Assert-Condition (@($trajectory.position_ids).Count -eq @($trajectory.transition_ids).Count + 1) "trajectory $($trajectory.id) does not form a Position/Transition chain."
}

$askStep = @($fixture.strategy_steps | Where-Object id -eq 'step-syn-ask')[0]
$askUtterance = @($fixture.utterances | Where-Object id -eq 'utterance-syn-ask')[0]
$askEvent = @($fixture.events | Where-Object id -eq 'event-syn-ask')[0]
Assert-Condition ($askStep.input_refs -contains $askUtterance.id) 'reviewed Utterance is not the Strategy Step input.'
Assert-Condition ($askEvent.claim_refs -contains $askUtterance.claim_ref) 'Utterance Claim does not reach its communication Event.'
Assert-Condition ($askStep.before_position_id -eq 'position-syn-000' -and $askStep.after_position_id -eq 'position-syn-001') 'Utterance Strategy Step has wrong Position endpoints.'
Assert-Condition ($askStep.branch_membership -eq 'main-line') 'Utterance Strategy Step is not in Main Line.'

Assert-Condition (Test-FrozenVariationRoots $fixture) 'a Variation does not retain its anchor context/profile snapshot.'
$purposeSet = @($fixture.variations | ForEach-Object purpose | Select-Object -Unique)
foreach ($purpose in @('forecast', 'counterfactual', 'exploratory')) { Assert-Condition ($purposeSet -contains $purpose) "fixture lacks $purpose Variation." }
Assert-Condition (@($fixture.variations | Where-Object state -eq 'pinned').Count -ge 2) 'fixture does not preserve multiple pinned branches.'
foreach ($variation in @($fixture.variations)) {
    Assert-Condition ($positionIds -contains $variation.anchor_position_id) "Variation $($variation.id) references missing anchor."
    Assert-Condition ($trajectoryIds -contains $variation.trajectory_id) "Variation $($variation.id) references missing trajectory."
    Assert-Condition ($analysisRunIds -contains $variation.created_by_analysis_run_id) "Variation $($variation.id) references missing analysis run."
    $trajectory = @($fixture.trajectories | Where-Object id -eq $variation.trajectory_id)[0]
    $step = @($fixture.strategy_steps | Where-Object branch_membership -eq $variation.id)[0]
    Assert-Condition ($null -ne $step) "Variation $($variation.id) has no branch Strategy Step."
    Assert-Condition ($trajectory.transition_ids -contains $step.transition_id -and $trajectory.position_ids -contains $step.after_position_id) "Variation $($variation.id) disagrees with its branch Strategy Step."
}
Assert-Condition (Test-AssessmentEligibility $fixture) 'a Forecast Assessment targets a non-forecast Variation.'
foreach ($variation in @($fixture.variations | Where-Object purpose -ne 'forecast')) {
    Assert-Condition (@($fixture.forecast_assessments | Where-Object forecast_variation_id -eq $variation.id).Count -eq 0) "non-forecast Variation $($variation.id) has an assessment."
}

$assessmentStatuses = @($fixture.forecast_assessments | ForEach-Object status)
foreach ($status in @('matched', 'partially-matched', 'diverged', 'expired-unobserved', 'unknown')) { Assert-Condition ($assessmentStatuses -contains $status) "fixture lacks $status assessment." }
foreach ($assessment in @($fixture.forecast_assessments)) {
    Assert-Condition ($variationIds -contains $assessment.forecast_variation_id) "assessment $($assessment.id) references missing Variation."
    Assert-Condition ($coverageIds -contains $assessment.observation_coverage_id) "assessment $($assessment.id) references missing coverage."
    foreach ($transitionId in @($assessment.forecast_transition_refs)) { Assert-Condition ($transitionIds -contains $transitionId) "assessment $($assessment.id) references missing forecast Transition." }
    foreach ($eventId in @($assessment.actual_event_refs)) {
        $event = @($fixture.events | Where-Object id -eq $eventId)[0]
        Assert-Condition ($null -ne $event -and $event.mode -eq 'actual') "assessment $($assessment.id) references a non-actual Event."
    }
    foreach ($transitionId in @($assessment.actual_transition_refs)) { Assert-Condition ($transitionIds -contains $transitionId) "assessment $($assessment.id) references missing actual Transition." }
}
Assert-Condition (Test-ExpiredAssessmentRules $fixture) 'expired-unobserved assessment lacks elapsed horizon, adequate coverage, or empty actual links.'
$unknownAssessment = @($fixture.forecast_assessments | Where-Object status -eq 'unknown')[0]
$unknownCoverage = @($fixture.observation_coverages | Where-Object id -eq $unknownAssessment.observation_coverage_id)[0]
Assert-Condition ($unknownCoverage.status -eq 'inadequate') 'unknown forecast does not demonstrate inadequate coverage.'
Assert-Condition (@($fixture.forecast_assessments | Where-Object { @($_.actual_event_refs).Count -gt 1 }).Count -gt 0) 'fixture does not demonstrate one forecast linked to several actual Events.'
Assert-Condition (@($fixture.actual_forecast_outcomes | Where-Object { @($_.assessment_refs).Count -gt 1 }).Count -gt 0) 'fixture does not demonstrate one actual Event linked to several forecasts.'
$surprise = @($fixture.actual_forecast_outcomes | Where-Object outcome -eq 'unmatched-actual')[0]
Assert-Condition ($null -ne $surprise -and @($surprise.assessment_refs).Count -eq 0) 'fixture lacks a clean unmatched-actual surprise.'
foreach ($outcome in @($fixture.actual_forecast_outcomes)) {
    $actualEvent = @($fixture.events | Where-Object id -eq $outcome.actual_event_id)[0]
    Assert-Condition ($null -ne $actualEvent -and $actualEvent.mode -eq 'actual') "actual outcome $($outcome.id) references a non-actual Event."
    Assert-Condition ($searchRunIds -contains $outcome.forecast_set_id) "actual outcome $($outcome.id) references a missing forecast set/search run."
    foreach ($assessmentId in @($outcome.assessment_refs)) { Assert-Condition ($assessmentIds -contains $assessmentId) "actual outcome $($outcome.id) references missing assessment $assessmentId." }
}

$proposalIds = @($fixture.profile_claim_revision_proposals | ForEach-Object id)
foreach ($proposal in @($fixture.profile_claim_revision_proposals)) {
    Assert-Condition ($nodeIds -contains $proposal.subject_node_id) "profile proposal $($proposal.id) references a missing subject Node."
    foreach ($claimId in @($proposal.prior_claim_refs)) { Assert-Condition ($claimIds -contains $claimId) "profile proposal $($proposal.id) references missing prior Claim $claimId." }
    Assert-Condition ($claimIds -contains $proposal.proposed_claim_id) "profile proposal $($proposal.id) references a missing proposed Claim."
    foreach ($sourceId in @($proposal.evidence_refs)) { Assert-Condition ($sourceIds -contains $sourceId) "profile proposal $($proposal.id) references missing evidence $sourceId." }
    Assert-Condition ($reviewIds -contains $proposal.review_decision_ref) "profile proposal $($proposal.id) references a missing review decision."
    $review = @($fixture.review_decisions | Where-Object id -eq $proposal.review_decision_ref)[0]
    Assert-Condition ($review.target_ref -eq $proposal.id) "profile proposal $($proposal.id) and its review decision disagree."
}
foreach ($review in @($fixture.review_decisions)) { Assert-Condition ($proposalIds -contains $review.target_ref) "review decision $($review.id) references a missing profile proposal." }

$acceptedProposal = @($fixture.profile_claim_revision_proposals | Where-Object review_status -eq 'accepted')[0]
Assert-Condition ($null -ne $acceptedProposal) 'fixture lacks an accepted profile Claim revision.'
Assert-Condition ($nodeIds -contains $acceptedProposal.subject_node_id) 'accepted proposal references a missing subject Node.'
Assert-Condition ($claimIds -contains $acceptedProposal.proposed_claim_id) 'accepted proposal references a missing proposed Claim.'
Assert-Condition ($reviewIds -contains $acceptedProposal.review_decision_ref) 'accepted proposal references a missing review decision.'
$acceptedClaim = @($fixture.claims | Where-Object id -eq $acceptedProposal.proposed_claim_id)[0]
$acceptedReview = @($fixture.review_decisions | Where-Object id -eq $acceptedProposal.review_decision_ref)[0]
Assert-Condition ($acceptedClaim.revision_of -eq $acceptedProposal.prior_claim_refs[0]) 'accepted Claim does not append from its prior Claim.'
Assert-Condition ([int]$acceptedClaim.revision -gt 1) 'accepted Claim is not a later revision.'
Assert-Condition ($acceptedReview.decision -eq 'accept' -and $acceptedReview.target_ref -eq $acceptedProposal.id) 'accepted proposal lacks a matching human review decision.'
Assert-Condition (@($fixture.profile_claim_revision_proposals | Where-Object review_status -eq 'unresolved').Count -ge 2) 'competing unresolved profile explanations are not preserved.'
$rootSnapshot = @($fixture.profile_snapshots | Where-Object id -eq 'profile-snapshot-syn-root')[0]
$currentSnapshot = @($fixture.profile_snapshots | Where-Object id -eq 'profile-snapshot-syn-current')[0]
Assert-Condition ($rootSnapshot.claim_refs -contains 'claim-syn-sponsor-style-v1') 'root profile snapshot lost the earlier Claim.'
Assert-Condition ($rootSnapshot.claim_refs -notcontains 'claim-syn-sponsor-style-v2') 'later Claim leaked into the root profile snapshot.'
Assert-Condition ($currentSnapshot.claim_refs -contains 'claim-syn-sponsor-style-v2') 'current profile snapshot lacks the accepted revision.'
foreach ($position in @($fixture.positions | Where-Object mode -in @('predicted', 'hypothetical'))) {
    Assert-Condition ($position.profile_snapshot_id -eq 'profile-snapshot-syn-root') "possible Position $($position.id) uses hindsight profile data."
}

Assert-Condition (@($fixture.calibration_records).Count -gt 0) 'fixture lacks separate calibration.'
foreach ($calibration in @($fixture.calibration_records)) {
    Assert-Condition ($analysisRunIds -contains $calibration.analysis_run_id) "calibration $($calibration.id) references missing analysis run."
    Assert-Condition ($searchRunIds -contains $calibration.search_run_id) "calibration $($calibration.id) references missing search run."
    foreach ($methodRunId in @($calibration.method_run_ids)) { Assert-Condition ($methodRunIds -contains $methodRunId) "calibration $($calibration.id) references missing Method run." }
    foreach ($assessmentId in @($calibration.assessment_refs)) { Assert-Condition ($assessmentIds -contains $assessmentId) "calibration $($calibration.id) references missing assessment." }
    Assert-Condition (($calibration | ConvertTo-Json -Depth 30) -notmatch 'claim-syn-') "calibration $($calibration.id) improperly references subject Claims."
}

$evaluatedPositionIds = @($fixture.evaluations | ForEach-Object target_position_id)
Assert-Condition ($evaluatedPositionIds.Count -eq $positionIds.Count) 'Evaluation count does not equal materialized Position count.'
Assert-Condition (@($evaluatedPositionIds | Select-Object -Unique).Count -eq $positionIds.Count) 'a materialized Position has duplicate or missing Evaluation.'
foreach ($positionId in $positionIds) { Assert-Condition ($evaluatedPositionIds -contains $positionId) "materialized Position $positionId has no Evaluation." }
foreach ($evaluation in @($fixture.evaluations)) {
    Assert-Condition (@($evaluation.party_scorecards).Count -ge 2) "Evaluation $($evaluation.id) is not multi-party."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$evaluation.risk_policy)) "Evaluation $($evaluation.id) has no risk policy."
    Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$evaluation.evidence_cutoff)) "Evaluation $($evaluation.id) has no evidence cutoff."
    foreach ($scorecard in @($evaluation.party_scorecards)) {
        Assert-Condition ($nodeIds -contains $scorecard.party_node_id) "Evaluation $($evaluation.id) references missing Party."
        foreach ($objectiveId in @($scorecard.objective_refs)) {
            Assert-Condition ($objectiveIds -contains $objectiveId) "Evaluation $($evaluation.id) references missing Objective $objectiveId."
            $objective = @($fixture.objectives | Where-Object id -eq $objectiveId)[0]
            Assert-Condition ($objective.party_node_id -eq $scorecard.party_node_id) "Evaluation $($evaluation.id) assigns Objective $objectiveId to the wrong Party."
        }
        Assert-Condition (@($scorecard.dimensions.PSObject.Properties).Count -gt 0) "Evaluation $($evaluation.id) has an empty score vector."
    }
}
Assert-Condition (($fixture.evaluations | ConvertTo-Json -Depth 100) -match '"unknown"') 'Evaluations do not preserve unknown values.'

$search = @($fixture.search_runs)[0]
Assert-Condition ([int]$search.unexpanded_candidate_count -gt 0) 'search fixture does not distinguish unexpanded candidates.'
Assert-Condition ($null -ne $search.budgets.max_depth -and $null -ne $search.budgets.max_materialized_positions -and $null -ne $search.budgets.max_elapsed_ms) 'search budgets are incomplete.'
foreach ($positionId in @($search.materialized_position_ids)) { Assert-Condition ($evaluatedPositionIds -contains $positionId) "search materialized Position $positionId lacks Evaluation." }
foreach ($context in @($fixture.context_snapshots)) {
    Assert-Condition ($positionIds -contains $context.position_id) "context $($context.id) references missing Position."
    Assert-Condition ($profileSnapshotIds -contains $context.profile_snapshot_id) "context $($context.id) references missing profile snapshot."
    foreach ($objectiveId in @($context.objective_refs)) { Assert-Condition ($objectiveIds -contains $objectiveId) "context $($context.id) references missing Objective $objectiveId." }
}
foreach ($analysis in @($fixture.analysis_runs)) {
    foreach ($methodRunId in @($analysis.method_run_ids)) { Assert-Condition ($methodRunIds -contains $methodRunId) "analysis $($analysis.id) references missing Method run." }
    foreach ($outputRef in @($analysis.output_refs)) { Assert-Condition ($variationIds -contains $outputRef) "analysis $($analysis.id) references missing Variation output $outputRef." }
}
$cache = @($fixture.cache_records)[0]
Assert-Condition ($cache.profile_snapshot_id -eq 'profile-snapshot-syn-root' -and $cache.context_snapshot_id -eq 'context-snapshot-syn-root') 'cache does not preserve the frozen branch root.'
foreach ($variationId in @($cache.variation_refs)) {
    $variation = @($fixture.variations | Where-Object id -eq $variationId)[0]
    Assert-Condition ($null -ne $variation -and $variation.state -eq 'pinned') "cache references a missing or unpinned Variation $variationId."
}

$record = @($fixture.game_records)[0]
Assert-Condition ($record.status -eq 'ongoing') 'synthetic Game Record must remain ongoing.'
Assert-Condition ($record.frontier.position_id -eq 'position-syn-005') 'Game Record frontier is not the latest confirmed Position.'
foreach ($eventId in @($record.main_line.event_ids)) {
    $event = @($fixture.events | Where-Object id -eq $eventId)[0]
    Assert-Condition ($null -ne $event -and $event.mode -in @('actual', 'reconstructed')) "Main Line contains non-confirmed Event $eventId."
}
foreach ($stepId in @($record.main_line.strategy_step_ids)) {
    $step = @($fixture.strategy_steps | Where-Object id -eq $stepId)[0]
    Assert-Condition ($null -ne $step -and $step.branch_membership -eq 'main-line') "Main Line references non-main Strategy Step $stepId."
}
foreach ($variationId in @($record.variations)) { Assert-Condition ($variationIds -contains $variationId) "Game Record references missing Variation $variationId." }
foreach ($assessmentId in @($record.forecast_assessment_refs)) { Assert-Condition ($assessmentIds -contains $assessmentId) "Game Record references missing Forecast Assessment $assessmentId." }

$privacyMutation = "$fixtureRaw`nhttps://example.invalid/private"
Assert-Condition (-not (Test-PublicFixtureText $privacyMutation)) 'privacy negative mutation was not rejected.'
$coverageMutation = Copy-JsonObject $fixture
@($coverageMutation.observation_coverages | Where-Object id -eq 'coverage-syn-shared-adequate')[0].status = 'inadequate'
Assert-Condition (-not (Test-ExpiredAssessmentRules $coverageMutation)) 'expired-without-coverage negative mutation was not rejected.'
$purposeMutation = Copy-JsonObject $fixture
@($purposeMutation.variations | Where-Object id -eq 'variation-syn-match')[0].purpose = 'exploratory'
Assert-Condition (-not (Test-AssessmentEligibility $purposeMutation)) 'non-forecast-assessment negative mutation was not rejected.'
$snapshotMutation = Copy-JsonObject $fixture
@($snapshotMutation.variations | Where-Object id -eq 'variation-syn-match')[0].root_profile_snapshot_id = 'profile-snapshot-syn-current'
Assert-Condition (-not (Test-FrozenVariationRoots $snapshotMutation)) 'hindsight-profile-leak negative mutation was not rejected.'

Write-Output "P0 contract validation passed: $($contract.version), 12/12 criteria, $(@($fixture.positions).Count) Positions, $(@($fixture.variations).Count) Variations, $(@($fixture.forecast_assessments).Count) Forecast Assessments, 4 negative mutations rejected."
