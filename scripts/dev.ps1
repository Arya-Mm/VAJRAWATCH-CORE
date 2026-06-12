$ErrorActionPreference = "Stop"
$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Set-Location $Root
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Local .venv not found. Run scripts/install.ps1 first."
}

& $Python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

