$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$standardPatterns = @(
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'AKIA[0-9A-Z]{16}',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    're_[A-Za-z0-9]{20,}',
    'sk-[A-Za-z0-9]{20,}'
)

# These structural patterns detect the retired CornellPulse browser-side
# administrator credential without embedding or printing its plaintext value.
$legacyAdminPatterns = @(
    '(?i)\b(?:admin[_a-z0-9]*password|admin[_a-z0-9]*credential)\b\s*(?:=|:)\s*["''][^"'']{4,}["'']',
    '(?i)\b(?:password|credential)\b\s*===?\s*["''][^"'']{4,}["'']'
)

$excludedPaths = @('scripts/secret-scan.ps1', 'scripts/history-secret-scan.ps1')
$findings = [System.Collections.Generic.HashSet[string]]::new()

function Add-Finding([string]$commit, [string]$path) {
    if ($excludedPaths -contains $path) { return }
    [void]$findings.Add("$commit`:$path")
}

Push-Location $repoRoot
try {
    $commits = @(& git rev-list --all)
    foreach ($commit in $commits) {
        foreach ($pattern in $standardPatterns) {
            $matches = @(& git grep -I -l -E -e $pattern $commit -- . 2>$null)
            if ($LASTEXITCODE -notin @(0, 1)) { throw "git grep failed while scanning history" }
            foreach ($match in $matches) {
                $separator = $match.IndexOf(':')
                if ($separator -ge 0) { Add-Finding $commit $match.Substring($separator + 1) }
            }
        }

        $candidates = @(& git grep -I -l -i -E -e 'admin|password|credential' $commit -- frontend 2>$null)
        if ($LASTEXITCODE -notin @(0, 1)) { throw "git grep failed while scanning project-specific history" }
        foreach ($candidate in $candidates) {
            $separator = $candidate.IndexOf(':')
            if ($separator -lt 0) { continue }
            $path = $candidate.Substring($separator + 1)
            if ($path -notmatch '\.(cjs|html|js|jsx|mjs|ts|tsx)$') { continue }
            $content = (& git show "$commit`:$path" 2>$null) -join "`n"
            foreach ($pattern in $legacyAdminPatterns) {
                if ($content -match $pattern) {
                    Add-Finding $commit $path
                    break
                }
            }
        }
    }
} finally { Pop-Location }

if ($findings.Count -gt 0) {
    Write-Output "Credential material exists in Git history at these redacted locations (values were not printed):"
    foreach ($finding in ($findings | Sort-Object)) {
        $separator = $finding.IndexOf(':')
        $commit = $finding.Substring(0, $separator)
        $path = $finding.Substring($separator + 1)
        Write-Output " - $commit`:$path"
        $refs = @(& git for-each-ref --contains $commit --format='%(refname)' refs/heads refs/remotes refs/tags)
        foreach ($ref in ($refs | Sort-Object -Unique)) { Write-Output "   ref: $ref" }
    }
    Write-Output "History remediation remains BLOCKED pending provider/repository-owner authorization."
    exit 2
}

Write-Output "No standard or CornellPulse legacy administrator credential formats were found in complete Git history. Values were never printed."
