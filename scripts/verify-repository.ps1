param(
    [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Test-RecoveryHook([string]$content) {
    $marker = [regex]::Match($content, '(?s)<!-- STOCKMESH-RECOVERY-HOOK:START -->(.*?)<!-- STOCKMESH-RECOVERY-HOOK:END -->')
    if (-not $marker.Success) { return $false }
    $hook = $marker.Groups[1].Value
    $goalIndex = $hook.IndexOf('Goal/task-state API', [System.StringComparison]::Ordinal)
    $planIndex = $hook.IndexOf('[docs/delivery/active-plan.md]', [System.StringComparison]::Ordinal)
    return $goalIndex -ge 0 -and $planIndex -ge 0 -and $goalIndex -lt $planIndex
}

$agentsPath = Join-Path $RepositoryRoot 'AGENTS.md'
$agents = Get-Content -Raw -LiteralPath $agentsPath
if (-not (Test-RecoveryHook $agents)) {
    $failures.Add('AGENTS.md must order Goal/task-state API before the active-plan link.')
}

# Negative mutation: a reversed hook must be rejected by the same rule.
$mutatedHook = [regex]::Replace(
    $agents,
    'At every recovery boundary, first call the environment Goal/task-state API\.\r?\nThen read \[docs/delivery/active-plan\.md\]',
    "At every recovery boundary, first read [docs/delivery/active-plan.md]`nThen call the environment Goal/task-state API"
)
if ($mutatedHook -eq $agents -or (Test-RecoveryHook $mutatedHook)) {
    $failures.Add('Recovery-hook negative mutation was not rejected.')
}

$gitDirectory = Join-Path $RepositoryRoot '.git'
if (Test-Path -LiteralPath $gitDirectory) {
    $candidateRelativePaths = & git -C $RepositoryRoot ls-files --cached --others --exclude-standard
    if ($LASTEXITCODE -ne 0) {
        $failures.Add('Unable to enumerate tracked and non-ignored repository candidates.')
        $trackedCandidates = @()
    } else {
        $trackedCandidates = @($candidateRelativePaths | ForEach-Object {
            Get-Item -LiteralPath (Join-Path $RepositoryRoot $_)
        })
    }
} else {
    $trackedCandidates = Get-ChildItem -LiteralPath $RepositoryRoot -Recurse -File -Force |
        Where-Object {
            $_.FullName -notmatch '[\\/]\.git[\\/]' -and
            $_.FullName -notmatch '[\\/](private|data|runtime|artifacts|evidence-private|source-locators)[\\/]'
        }
}

$forbiddenContentPatterns = @(
    'https?://(?:www\.)?kimi\.com/chat/',
    'ghp_[A-Za-z0-9_]{20,}',
    'tvly-(?:dev-)?[A-Za-z0-9_-]{20,}',
    '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
)

foreach ($file in $trackedCandidates) {
    if ($file.Extension -notin @('.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ps1', '.ts', '.tsx', '.js', '.mjs', '.cjs')) {
        continue
    }
    $content = Get-Content -Raw -LiteralPath $file.FullName
    foreach ($pattern in $forbiddenContentPatterns) {
        if ($content -match $pattern) {
            $relative = [IO.Path]::GetRelativePath($RepositoryRoot, $file.FullName)
            $failures.Add("Forbidden public-repository content in ${relative}: ${pattern}")
        }
    }
}

$markdownFiles = $trackedCandidates | Where-Object Extension -eq '.md'
foreach ($file in $markdownFiles) {
    $content = Get-Content -Raw -LiteralPath $file.FullName
    $links = [regex]::Matches($content, '(?<!\!)\[[^\]]+\]\(([^)]+)\)')
    foreach ($match in $links) {
        $target = $match.Groups[1].Value.Trim('<', '>')
        if ($target -match '^(?:https?://|mailto:|#)') { continue }
        $pathPart = ($target -split '#', 2)[0]
        if ([string]::IsNullOrWhiteSpace($pathPart)) { continue }
        $resolved = [IO.Path]::GetFullPath((Join-Path $file.DirectoryName $pathPart))
        if (-not (Test-Path -LiteralPath $resolved)) {
            $relative = [IO.Path]::GetRelativePath($RepositoryRoot, $file.FullName)
            $failures.Add("Broken Markdown link in ${relative}: ${target}")
        }
    }
}

$forbiddenPaths = @('cases', 'evidence-private', 'source-locators')
foreach ($relativePath in $forbiddenPaths) {
    if (Test-Path -LiteralPath (Join-Path $RepositoryRoot $relativePath)) {
        $failures.Add("Private/default-excluded path exists in repository: ${relativePath}")
    }
}

$contractValidator = Join-Path $RepositoryRoot 'scripts\validate-synthetic-contract.ps1'
if (-not (Test-Path -LiteralPath $contractValidator)) {
    $failures.Add('0.1.0 synthetic contract validator is missing.')
} else {
    $contractValidationOutput = & $contractValidator 2>&1
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("0.1.0 synthetic contract validation failed: $($contractValidationOutput -join ' ')")
    }
}

$p0ContractValidator = Join-Path $RepositoryRoot 'scripts\validate-p0-contract.ps1'
if (-not (Test-Path -LiteralPath $p0ContractValidator)) {
    $failures.Add('P0 contract validator is missing.')
} else {
    $p0ContractValidationOutput = & $p0ContractValidator 2>&1
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("P0 contract validation failed: $($p0ContractValidationOutput -join ' ')")
    }
}

$p1MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p1-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p1MatrixPath)) {
    $failures.Add('P1 acceptance matrix is missing.')
} else {
    try {
        $p1Matrix = Get-Content -Raw -LiteralPath $p1MatrixPath | ConvertFrom-Json
        if ($p1Matrix.phase_id -ne 'P1' -or $p1Matrix.status -ne 'frozen') {
            $failures.Add('P1 acceptance matrix must be frozen and identify phase P1.')
        }
        foreach ($criterion in @($p1Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P1 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P1 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

foreach ($runtimePath in @('package.json', 'package-lock.json', '.node-version', 'tsconfig.json', 'vitest.config.ts', 'src', 'tests')) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $runtimePath))) {
        $failures.Add("P1 runtime artifact is missing: $runtimePath")
    }
}

$p2MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p2-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p2MatrixPath)) {
    $failures.Add('P2 acceptance matrix is missing.')
} else {
    try {
        $p2Matrix = Get-Content -Raw -LiteralPath $p2MatrixPath | ConvertFrom-Json
        if ($p2Matrix.phase_id -ne 'P2' -or $p2Matrix.status -ne 'frozen') {
            $failures.Add('P2 acceptance matrix must be frozen and identify phase P2.')
        }
        $expectedP2Ids = 1..10 | ForEach-Object { 'P2-{0:D2}' -f $_ }
        $actualP2Ids = @($p2Matrix.criteria | ForEach-Object { $_.id })
        if (($actualP2Ids -join ',') -ne ($expectedP2Ids -join ',')) {
            $failures.Add('P2 acceptance matrix must contain ordered criteria P2-01 through P2-10 exactly once.')
        }
        foreach ($criterion in @($p2Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P2 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P2 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

try {
    $package = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'package.json') | ConvertFrom-Json
    $expectedGraphologyDependencies = @{
        'graphology' = '0.26.0'
        'graphology-components' = '1.5.4'
        'graphology-shortest-path' = '2.1.0'
        'graphology-metrics' = '2.4.0'
        'graphology-communities-louvain' = '2.0.2'
    }
    foreach ($entry in $expectedGraphologyDependencies.GetEnumerator()) {
        if ($package.dependencies.($entry.Key) -ne $entry.Value) {
            $failures.Add("P2 dependency must be exact-versioned: $($entry.Key)=$($entry.Value)")
        }
    }
} catch {
    $failures.Add("Unable to validate P2 dependencies: $($_.Exception.Message)")
}

foreach ($p2RuntimePath in @(
    'src\methods\identity.ts',
    'src\methods\types.ts',
    'src\methods\graph-adapter.ts',
    'src\methods\registry.ts',
    'src\methods\runner.ts',
    'src\methods\metrics.ts',
    'src\methods\builtins.ts',
    'tests\p2-workflow.test.ts'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $p2RuntimePath))) {
        $failures.Add("P2 runtime artifact is missing: $p2RuntimePath")
    }
}

$p3MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p3-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p3MatrixPath)) {
    $failures.Add('P3 acceptance matrix is missing.')
} else {
    try {
        $p3Matrix = Get-Content -Raw -LiteralPath $p3MatrixPath | ConvertFrom-Json
        if ($p3Matrix.phase_id -ne 'P3' -or $p3Matrix.status -ne 'frozen') {
            $failures.Add('P3 acceptance matrix must be frozen and identify phase P3.')
        }
        $expectedP3Ids = 1..12 | ForEach-Object { 'P3-{0:D2}' -f $_ }
        $actualP3Ids = @($p3Matrix.criteria | ForEach-Object { $_.id })
        if (($actualP3Ids -join ',') -ne ($expectedP3Ids -join ',')) {
            $failures.Add('P3 acceptance matrix must contain ordered criteria P3-01 through P3-12 exactly once.')
        }
        foreach ($criterion in @($p3Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P3 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P3 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

foreach ($p3RuntimePath in @(
    'src\analysis\types.ts',
    'src\analysis\validation.ts',
    'src\analysis\deterministic-adapter.ts',
    'src\analysis\structured-llm-adapter.ts',
    'src\possibilities\store.ts',
    'src\search\coordinator.ts',
    'src\forecasting\service.ts',
    'tests\p3-workflow.test.ts'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $p3RuntimePath))) {
        $failures.Add("P3 runtime artifact is missing: $p3RuntimePath")
    }
}

$p4MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p4-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p4MatrixPath)) {
    $failures.Add('P4 acceptance matrix is missing.')
} else {
    try {
        $p4Matrix = Get-Content -Raw -LiteralPath $p4MatrixPath | ConvertFrom-Json
        if ($p4Matrix.phase_id -ne 'P4' -or $p4Matrix.status -ne 'frozen') {
            $failures.Add('P4 acceptance matrix must be frozen and identify phase P4.')
        }
        $expectedP4Ids = 1..12 | ForEach-Object { 'P4-{0:D2}' -f $_ }
        $actualP4Ids = @($p4Matrix.criteria | ForEach-Object { $_.id })
        if (($actualP4Ids -join ',') -ne ($expectedP4Ids -join ',')) {
            $failures.Add('P4 acceptance matrix must contain ordered criteria P4-01 through P4-12 exactly once.')
        }
        foreach ($criterion in @($p4Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P4 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P4 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

foreach ($p4RuntimePath in @(
    'src\workbench\service.ts',
    'src\workbench\types.ts',
    'src\server\app.ts',
    'web\src\App.tsx',
    'web\src\components\GraphBoard.tsx',
    'web\src\components\TimelineChart.tsx',
    'web\src\components\ScoreView.tsx',
    'tests\p4-workbench.test.ts',
    'tests\p4-http.test.ts',
    'tests\e2e\p4-workflow.spec.ts',
    'scripts\verify-dependency-licenses.mjs',
    'scripts\normalize-lockfile-registry.mjs',
    'playwright.config.ts',
    'vite.config.ts'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $p4RuntimePath))) {
        $failures.Add("P4 runtime artifact is missing: $p4RuntimePath")
    }
}

$p5MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p5-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p5MatrixPath)) {
    $failures.Add('P5 acceptance matrix is missing.')
} else {
    try {
        $p5Matrix = Get-Content -Raw -LiteralPath $p5MatrixPath | ConvertFrom-Json
        if ($p5Matrix.phase_id -ne 'P5' -or $p5Matrix.status -ne 'frozen') {
            $failures.Add('P5 acceptance matrix must be frozen and identify phase P5.')
        }
        $expectedP5Ids = 1..12 | ForEach-Object { 'P5-{0:D2}' -f $_ }
        $actualP5Ids = @($p5Matrix.criteria | ForEach-Object { $_.id })
        if (($actualP5Ids -join ',') -ne ($expectedP5Ids -join ',')) {
            $failures.Add('P5 acceptance matrix must contain ordered criteria P5-01 through P5-12 exactly once.')
        }
        foreach ($criterion in @($p5Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P5 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P5 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

foreach ($p5RuntimePath in @(
    'src\clients\capabilities.ts',
    'src\cli\stockmesh.ts',
    'skills\stockmesh\SKILL.md',
    'skills\stockmesh\agents\openai.yaml',
    'tests\p5-capabilities.test.ts',
    'tests\p5-cli.test.ts'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $p5RuntimePath))) {
        $failures.Add("P5 runtime artifact is missing: $p5RuntimePath")
    }
}

$p6MatrixPath = Join-Path $RepositoryRoot 'docs\verification\p6-acceptance-matrix.json'
if (-not (Test-Path -LiteralPath $p6MatrixPath)) {
    $failures.Add('P6 acceptance matrix is missing.')
} else {
    try {
        $p6Matrix = Get-Content -Raw -LiteralPath $p6MatrixPath | ConvertFrom-Json
        if ($p6Matrix.phase_id -ne 'P6' -or $p6Matrix.status -ne 'frozen') {
            $failures.Add('P6 acceptance matrix must be frozen and identify phase P6.')
        }
        $expectedP6Ids = 1..10 | ForEach-Object { 'P6-{0:D2}' -f $_ }
        $actualP6Ids = @($p6Matrix.criteria | ForEach-Object { $_.id })
        if (($actualP6Ids -join ',') -ne ($expectedP6Ids -join ',')) {
            $failures.Add('P6 acceptance matrix must contain ordered criteria P6-01 through P6-10 exactly once.')
        }
        foreach ($criterion in @($p6Matrix.criteria)) {
            foreach ($evidencePath in @($criterion.evidence_paths)) {
                if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $evidencePath))) {
                    $failures.Add("P6 evidence path is missing for $($criterion.id): $evidencePath")
                }
            }
        }
    } catch {
        $failures.Add("P6 acceptance matrix is not valid JSON: $($_.Exception.Message)")
    }
}

foreach ($p6RuntimePath in @(
    'src\pilot\types.ts',
    'src\pilot\validation.ts',
    'src\pilot\evaluator.ts',
    'src\cli\pilot.ts',
    'tests\p6-private-pilot.test.ts',
    'tests\p6-pilot-cli.test.ts'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryRoot $p6RuntimePath))) {
        $failures.Add("P6 runtime artifact is missing: $p6RuntimePath")
    }
}

try {
    $package = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'package.json') | ConvertFrom-Json
    $expectedP4Dependencies = @{
        '@fastify/static' = '10.1.3'
        'cytoscape' = '3.33.1'
        'echarts' = '6.1.0'
        'fastify' = '5.10.0'
        'lucide-react' = '0.468.0'
        'react' = '19.2.0'
        'react-dom' = '19.2.0'
    }
    foreach ($entry in $expectedP4Dependencies.GetEnumerator()) {
        if ($package.dependencies.($entry.Key) -ne $entry.Value) {
            $failures.Add("P4 dependency must be exact-versioned: $($entry.Key)=$($entry.Value)")
        }
    }
    if ($package.packageManager -ne 'npm@11.19.0') {
        $failures.Add('P4 packageManager must pin npm@11.19.0.')
    }
    if ($package.scripts.'verify:licenses' -ne 'node scripts/verify-dependency-licenses.mjs') {
        $failures.Add('P4 must expose the direct dependency license gate.')
    }
    if ($package.scripts.'normalize:lock-registry' -ne 'node scripts/normalize-lockfile-registry.mjs') {
        $failures.Add('P4 must expose the lockfile registry normalization command.')
    }
    if ($package.scripts.stockmesh -ne 'tsx src/cli/stockmesh.ts') {
        $failures.Add('P5 must expose the StockMesh CLI through the pinned local tsx runtime.')
    }
    if ($package.scripts.pilot -ne 'tsx src/cli/pilot.ts') {
        $failures.Add('P6 must expose the private pilot evaluator through the pinned local tsx runtime.')
    }
} catch {
    $failures.Add("Unable to validate P4 dependencies: $($_.Exception.Message)")
}

$npmConfigPath = Join-Path $RepositoryRoot '.npmrc'
if (-not (Test-Path -LiteralPath $npmConfigPath)) {
    $failures.Add('Repository npm security configuration is missing.')
} else {
    $npmConfig = Get-Content -LiteralPath $npmConfigPath
    if ($npmConfig -notcontains 'min-release-age=20160') {
        $failures.Add('Repository npm release-age policy must enforce 14 days (20160 minutes).')
    }
    if ($npmConfig -notcontains 'save-exact=true') {
        $failures.Add('Repository npm configuration must save exact versions.')
    }
}

$lockfileContent = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'package-lock.json')
if ($lockfileContent -match 'registry\.npmmirror\.com|registry\.npm\.taobao\.org') {
    $failures.Add('Temporary npm mirror hosts must not be retained in package-lock.json.')
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Repository documentation, public-content, 0.1.0/P0 compatibility, and P1/P2/P3/P4/P5/P6 delivery checks passed ($($markdownFiles.Count) Markdown files)."
