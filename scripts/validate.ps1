$ErrorActionPreference = "Stop"
$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Set-Location $Root
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Local .venv not found. Run scripts/install.ps1 first."
}

& $Python scripts\verify_env.py
& $Python scripts\verify_antigravity.py
& $Python scripts\verify_neo4j.py
& $Python -m ruff check .
& $Python -m black --check .
& $Python -m mypy backend scripts tests
& $Python -m pytest
