$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$patterns = @(
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'AKIA[0-9A-Z]{16}',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    're_[A-Za-z0-9]{20,}',
    'sk-[A-Za-z0-9]{20,}'
)
$excluded = @("scripts/secret-scan.ps1", "scripts/history-secret-scan.ps1", ".env.example", "frontend/package-lock.json")
$findings = @()

Push-Location $repoRoot
try {
    $tracked = & git ls-files
    foreach ($relativePath in $tracked) {
        if ($excluded -contains $relativePath) { continue }
        $absolutePath = Join-Path $repoRoot $relativePath
        if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { continue }
        try { $content = Get-Content -LiteralPath $absolutePath -Raw -ErrorAction Stop } catch { continue }
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) { $findings += $relativePath; break }
        }
    }
    $bundleRoot = Join-Path $repoRoot "frontend/dist"
    if (Test-Path -LiteralPath $bundleRoot -PathType Container) {
        foreach ($bundleFile in Get-ChildItem -LiteralPath $bundleRoot -File -Recurse) {
            try { $content = Get-Content -LiteralPath $bundleFile.FullName -Raw -ErrorAction Stop } catch { continue }
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) { $findings += $bundleFile.FullName.Substring($repoRoot.Length + 1); break }
            }
        }
    }
} finally { Pop-Location }

if ($findings.Count -gt 0) {
    Write-Error ("Potential secret material detected in tracked files: " + (($findings | Sort-Object -Unique) -join ", "))
    exit 1
}
Write-Output "Secret scan passed for tracked repository files and the current production bundle."
