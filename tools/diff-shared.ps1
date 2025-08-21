param(
  [string]$BaseRef = "origin/main",
  [string[]]$Paths = @(
    "src/app/api/auth",
    "src/lib",
    "src/models",
    "packages/auth"
  )
)

Write-Host "Comparing current branch against $BaseRef`n" -ForegroundColor Cyan

# Verify ref exists locally; fetch if not
git rev-parse --verify $BaseRef 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Fetching $BaseRef..." -ForegroundColor DarkGray
  git fetch origin | Out-Null
}

# Build proper git diff args: <ref>...HEAD -- <path1> <path2> ...
$diffRange  = "$BaseRef...HEAD"
$commonArgs = @($diffRange, "--") + $Paths

# Show a summary table first
Write-Host "=== Summary (files changed in shared paths) ===" -ForegroundColor Yellow
$summary = git diff --name-status @commonArgs
if (-not $summary) {
  Write-Host "No changes in shared paths." -ForegroundColor Green
} else {
  $summary | ForEach-Object { $_ }
}

# Optional: show per-file shortstat to gauge size of change
Write-Host "`n=== Per-file change size (added/deleted lines) ===" -ForegroundColor Yellow
$stats = git diff --numstat @commonArgs
if ($stats) {
  $stats | ForEach-Object {
    $cols = $_ -split "`t"
    if ($cols.Length -ge 3) {
      $added = $cols[0]; $deleted = $cols[1]; $file = $cols[2]
      "{0,5} +  {1,5} -   {2}" -f $added, $deleted, $file
    }
  }
} else {
  Write-Host "No line changes detected." -ForegroundColor Green
}

Write-Host "`nTip: To move a change across repos, cherry-pick its commit or make a patch:" -ForegroundColor DarkGray
Write-Host "  git log --oneline -- $($Paths -join ' ')" -ForegroundColor DarkGray
Write-Host "  git format-patch -1 <sha> -o .\patches\" -ForegroundColor DarkGray
