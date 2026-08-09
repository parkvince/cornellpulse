$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$patterns = @(
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'AKIA[0-9A-Z]{16}',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    're_[A-Za-z0-9]{20,}',
    'sk-[A-Za-z0-9]{20,}'
)
$excludedPaths = @("scripts/secret-scan.ps1", "scripts/history-secret-scan.ps1", ".env.example", "frontend/package-lock.json")
$findings = [System.Collections.Generic.HashSet[string]]::new()

Push-Location $repoRoot
try {
    $commits = & git rev-list --all
    foreach ($commit in $commits) {
        foreach ($pattern in $patterns) {
            $matches = & git grep -I -l -E -e $pattern $commit -- . 2>$null
            if ($LASTEXITCODE -notin @(0, 1)) { throw "git grep failed while scanning history" }
            foreach ($match in $matches) {
                $separator = $match.IndexOf(":")
                if ($separator -lt 0) { continue }
                $path = $match.Substring($separator + 1)
                if ($excludedPaths -contains $path) { continue }
                [void]$findings.Add("$($commit.Substring(0, 12)):$path")
            }
        }
    }
} finally { Pop-Location }

if ($findings.Count -gt 0) {
    Write-Output "Potential credential material exists in Git history at these redacted locations (values were not printed):"
    $findings | Sort-Object | ForEach-Object { Write-Output " - $_" }
    exit 2
}
Write-Output "No known credential formats were found in Git history. Values were never printed."
