param([switch]$SkipContainers)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendRoot = Join-Path $repoRoot "backend"
$frontendRoot = Join-Path $repoRoot "frontend"
$pythonPath = Join-Path $backendRoot "venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath (Join-Path $backendRoot ".env"))) { throw "Create backend/.env from .env.example and replace local placeholders before starting." }
if (-not (Test-Path -LiteralPath $pythonPath)) { throw "Backend environment missing. Follow README.md setup first." }
if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot "node_modules"))) { throw "Frontend dependencies missing. Run npm.cmd ci in frontend first." }

if (-not $SkipContainers) {
    & docker compose --file (Join-Path $repoRoot "docker-compose.yml") up -d postgres redis
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL and Redis did not start." }
}

$backend = Start-Process -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru
$frontend = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--host", "127.0.0.1" -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru

try {
    Write-Output "CornellPulse starting: http://localhost:5173 (API http://localhost:8000/api/v1/health/ready)"
    Write-Output "Press Ctrl+C to stop both application processes."
    while (-not $backend.HasExited -and -not $frontend.HasExited) { Start-Sleep -Seconds 1 }
    if ($backend.HasExited) { throw "Backend exited with code $($backend.ExitCode)." }
    if ($frontend.HasExited) { throw "Frontend exited with code $($frontend.ExitCode)." }
}
finally {
    foreach ($process in @($backend, $frontend)) {
        if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id }
    }
}
