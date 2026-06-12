$ErrorActionPreference = "Stop"
$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw "uv is required. Install uv first, then rerun scripts/install.ps1."
}

uv venv --python 3.13 .venv
$Python = Join-Path $Root ".venv\Scripts\python.exe"
uv pip install --python $Python pip
& $Python -m pip install --upgrade pip

if (Test-Path -LiteralPath "requirements-dev.txt") {
    uv pip sync --python $Python requirements-dev.txt
} else {
    uv pip install --python $Python -r requirements-dev.in
}

& $Python scripts\verify_env.py
& $Python scripts\verify_antigravity.py
