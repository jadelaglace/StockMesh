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
    '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
)

foreach ($file in $trackedCandidates) {
    if ($file.Extension -notin @('.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ps1')) {
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

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Repository documentation, public-content, 0.1.0 compatibility, and P0 contract checks passed ($($markdownFiles.Count) Markdown files)."
