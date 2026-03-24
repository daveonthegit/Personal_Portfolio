#Requires -Version 5.1
<#
.SYNOPSIS
  Prepares the repo and starts the local dev stack (watch + go run).

.DESCRIPTION
  Stops any process listening on the configured HTTP port (PORT env or 8080),
  installs npm packages, downloads Go modules, then runs npm run dev.
#>
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 0
)

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$listenPort = 8080
if ($env:PORT -match '^\d+$') {
    $listenPort = [int]$env:PORT
}
elseif ($Port -gt 0) {
    $listenPort = $Port
}

Write-Host "Stopping listeners on port $listenPort..." -ForegroundColor Cyan
try {
    $conns = @(Get-NetTCPConnection -LocalPort $listenPort -State Listen -ErrorAction SilentlyContinue)
    foreach ($c in $conns) {
        $owning = $c.OwningProcess
        if (-not $owning -or $owning -eq $PID) { continue }
        $p = Get-Process -Id $owning -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "  Stopping PID $($p.Id) ($($p.ProcessName))" -ForegroundColor DarkGray
            Stop-Process -Id $owning -Force -ErrorAction SilentlyContinue
        }
    }
}
catch {
    Write-Host "  Warning: could not inspect port $listenPort : $_" -ForegroundColor Yellow
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js and ensure it is on PATH."
    exit 1
}
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "go not found. Install Go and ensure it is on PATH."
    exit 1
}

Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Downloading Go modules..." -ForegroundColor Cyan
go mod download
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting dev server (npm run dev)..." -ForegroundColor Green
npm run dev
exit $LASTEXITCODE
