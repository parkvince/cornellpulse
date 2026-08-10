param(
    [ValidateSet("local", "staging", "production", "all")]
    [string]$Environment = "all",
    [switch]$RequireReady,
    [string]$Path = (Join-Path $PSScriptRoot "..\RELEASE_EVIDENCE_MATRIX.csv")
)

$ErrorActionPreference = "Stop"
$requiredColumns = @("ID", "Exercise", "Command", "Environment", "Commit", "ExpectedResult", "ActualResult", "TimestampUTC", "Artifact", "Owner", "Status")
$allowedStatuses = @("PASS", "FAIL", "BLOCKED", "NOT EXECUTED")
$rows = @(Import-Csv -LiteralPath $Path)
if ($rows.Count -eq 0) { throw "Release evidence matrix is empty." }

foreach ($column in $requiredColumns) {
    if (-not ($rows[0].PSObject.Properties.Name -contains $column)) { throw "Missing required column: $column" }
}

$selected = if ($Environment -eq "all") { $rows } else { @($rows | Where-Object Environment -eq $Environment) }
if ($selected.Count -eq 0) { throw "No rows found for environment: $Environment" }

foreach ($row in $selected) {
    foreach ($field in @("ID", "Exercise", "Command", "Environment", "Commit", "ExpectedResult", "ActualResult", "TimestampUTC", "Artifact", "Owner", "Status")) {
        if ([string]::IsNullOrWhiteSpace($row.$field)) { throw "Row $($row.ID) is missing $field." }
    }
    if ($allowedStatuses -notcontains $row.Status) { throw "Row $($row.ID) has invalid status $($row.Status)." }
    if ($row.Commit -notmatch "^[0-9a-f]{40}$") {
        throw "Row $($row.ID) must identify the exact 40-character Git commit under review."
    }
}

$counts = $selected | Group-Object Status | Sort-Object Name
foreach ($count in $counts) { Write-Output "$($count.Name): $($count.Count)" }
if ($RequireReady -and @($selected | Where-Object Status -ne "PASS").Count -gt 0) {
    [Console]::Error.WriteLine("Fail-closed release gate: non-PASS evidence remains for $Environment.")
    exit 2
}
Write-Output "Release evidence matrix structure is valid for $Environment."
