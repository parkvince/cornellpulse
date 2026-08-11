param([switch]$SkipContainers)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendRoot = Join-Path $repoRoot "backend"
$frontendRoot = Join-Path $repoRoot "frontend"
$pythonPath = Join-Path $backendRoot "venv\Scripts\python.exe"
$backendEnvPath = Join-Path $backendRoot ".env"

if (-not (Test-Path -LiteralPath $backendEnvPath)) { throw "Create backend/.env from .env.example and replace local placeholders before starting." }
if (-not (Test-Path -LiteralPath $pythonPath)) { throw "Backend environment missing. Follow README.md setup first." }
if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot "node_modules"))) { throw "Frontend dependencies missing. Run npm.cmd ci in frontend first." }

if (-not $SkipContainers) {
    $databaseLine = Get-Content -LiteralPath $backendEnvPath | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -Last 1
    if (-not $databaseLine) { throw "DATABASE_URL is missing from backend/.env." }

    $databaseUrl = ($databaseLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
    try {
        $composeDatabaseUri = [Uri]($databaseUrl -replace '^postgresql\+asyncpg:', 'postgresql:')
        $databaseCredentials = $composeDatabaseUri.UserInfo -split ':', 2
        if ($databaseCredentials.Count -ne 2 -or [string]::IsNullOrWhiteSpace($databaseCredentials[1])) {
            throw "Database password missing"
        }
        $localPostgresPassword = [Uri]::UnescapeDataString($databaseCredentials[1])
    }
    catch {
        throw "DATABASE_URL in backend/.env must include a password for the local PostgreSQL container."
    }

    $hadPostgresPassword = Test-Path Env:POSTGRES_PASSWORD
    $previousPostgresPassword = $env:POSTGRES_PASSWORD
    try {
        $env:POSTGRES_PASSWORD = $localPostgresPassword
        & docker info *> $null
        if ($LASTEXITCODE -ne 0) { throw "Docker Desktop is not running or its engine is unavailable. Start Docker Desktop and try again." }

        & docker compose --file (Join-Path $repoRoot "docker-compose.yml") up -d --wait --wait-timeout 60 postgres redis
        if ($LASTEXITCODE -ne 0) { throw "Docker Compose could not make PostgreSQL and Redis healthy. Review the Docker output above." }
    }
    finally {
        if ($hadPostgresPassword) { $env:POSTGRES_PASSWORD = $previousPostgresPassword }
        else { Remove-Item Env:POSTGRES_PASSWORD -ErrorAction SilentlyContinue }
    }
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
