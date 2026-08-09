$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$standardPatterns = @(
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'AKIA[0-9A-Z]{16}',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    're_[A-Za-z0-9]{20,}',
    'sk-[A-Za-z0-9]{20,}'
)

# Project-specific detection is structural: it recognizes the retired browser-side
# administrator password assignment/comparison without storing the credential text.
$legacyAdminPatterns = @(
    '(?i)\b(?:admin[_a-z0-9]*password|admin[_a-z0-9]*credential)\b\s*(?:=|:)\s*["''][^"'']{4,}["'']',
    '(?i)\b(?:password|credential)\b\s*===?\s*["''][^"'']{4,}["'']'
)

$textExtensions = @('.cjs', '.css', '.env', '.example', '.html', '.ini', '.js', '.json', '.jsx', '.log', '.md', '.mjs', '.out', '.ps1', '.py', '.sql', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml')
$excludedDirectoryFragments = @('\.git\', '\backend\venv\', '\frontend\node_modules\', '\frontend\android\build\', '\frontend\android\app\build\')
$scannerPaths = @('scripts/secret-scan.ps1', 'scripts/history-secret-scan.ps1')
$findings = [System.Collections.Generic.HashSet[string]]::new()
$scanned = [System.Collections.Generic.HashSet[string]]::new()

function Test-TextCandidate([string]$absolutePath) {
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { return $false }
    foreach ($fragment in $excludedDirectoryFragments) {
        if ($absolutePath.IndexOf($fragment, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { return $false }
    }
    return $textExtensions -contains ([System.IO.Path]::GetExtension($absolutePath).ToLowerInvariant())
}

function Test-File([string]$relativePath) {
    $normalized = $relativePath.Replace('\', '/')
    if ($scannerPaths -contains $normalized) { return }
    $absolutePath = Join-Path $repoRoot $relativePath
    if (-not (Test-TextCandidate $absolutePath)) { return }
    if (-not $scanned.Add($normalized)) { return }

    try { $content = Get-Content -LiteralPath $absolutePath -Raw -ErrorAction Stop } catch { return }
    foreach ($pattern in $standardPatterns) {
        if ($content -match $pattern) {
            [void]$findings.Add($normalized)
            return
        }
    }

    if ($normalized -match '^frontend/(src|dist|android/app/src/main/assets/public|ios/App/App/public)/') {
        foreach ($pattern in $legacyAdminPatterns) {
            if ($content -match $pattern) {
                [void]$findings.Add($normalized)
                return
            }
        }
    }
}

Push-Location $repoRoot
try {
    $repositoryFiles = @(& git ls-files) + @(& git ls-files --others --exclude-standard)
    foreach ($relativePath in $repositoryFiles) { Test-File $relativePath }

    # Explicitly include build/native bundles and operational text artifacts even when ignored.
    foreach ($root in @('frontend/dist', 'frontend/android/app/src/main/assets/public', 'frontend/ios/App/App/public')) {
        $absoluteRoot = Join-Path $repoRoot $root
        if (-not (Test-Path -LiteralPath $absoluteRoot -PathType Container)) { continue }
        foreach ($file in Get-ChildItem -LiteralPath $absoluteRoot -File -Recurse -ErrorAction SilentlyContinue) {
            Test-File $file.FullName.Substring($repoRoot.Length + 1)
        }
    }
    foreach ($file in Get-ChildItem -LiteralPath $repoRoot -File -Recurse -ErrorAction SilentlyContinue) {
        if ($file.Extension -in @('.log', '.out')) { Test-File $file.FullName.Substring($repoRoot.Length + 1) }
    }
} finally { Pop-Location }

if ($findings.Count -gt 0) {
    Write-Output "Potential active credential material exists at these redacted paths (values were not printed):"
    $findings | Sort-Object | ForEach-Object { Write-Output " - $_" }
    exit 2
}

Write-Output "Secret scan passed for $($scanned.Count) current text files, including tracked/untracked source, examples, logs, generated native assets, and the production bundle. Values were never printed."
