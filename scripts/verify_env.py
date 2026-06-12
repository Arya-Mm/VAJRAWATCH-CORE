from __future__ import annotations

import importlib.metadata
import json
import site
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_VENV = (ROOT / ".venv").resolve()
REQUIRED_PACKAGES = (
    "fastapi",
    "pydantic",
    "pydantic-settings",
    "neo4j",
    "redis",
    "arq",
    "google-antigravity",
    "ruff",
    "black",
    "mypy",
    "pytest",
)


def _fail(message: str, details: dict[str, Any]) -> None:
    print(json.dumps({"status": "failed", "message": message, "details": details}, indent=2))
    raise SystemExit(1)


def main() -> None:
    executable = Path(sys.executable).resolve()
    prefix = Path(sys.prefix).resolve()
    base_prefix = Path(sys.base_prefix).resolve()
    site_packages = [str(Path(path).resolve()) for path in site.getsitepackages()]

    details: dict[str, Any] = {
        "project_root": str(ROOT),
        "expected_venv": str(EXPECTED_VENV),
        "executable": str(executable),
        "prefix": str(prefix),
        "base_prefix": str(base_prefix),
        "version": sys.version,
        "site_packages": site_packages,
    }

    if sys.version_info[:2] != (3, 13):
        _fail("Python 3.13 is required for this project environment.", details)

    if prefix != EXPECTED_VENV:
        _fail("Interpreter is not running from the project .venv.", details)

    if EXPECTED_VENV not in executable.parents:
        _fail("sys.executable is not inside .venv/Scripts.", details)

    if not all(str(EXPECTED_VENV) in package_path for package_path in site_packages):
        _fail("site-packages is not isolated to the project .venv.", details)

    pip_result = subprocess.run(
        [str(executable), "-m", "pip", "--version"],
        check=True,
        capture_output=True,
        text=True,
    )
    details["pip"] = pip_result.stdout.strip()

    packages: dict[str, str] = {}
    missing: list[str] = []
    for package in REQUIRED_PACKAGES:
        try:
            packages[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            missing.append(package)

    details["packages"] = packages
    if missing:
        details["missing_packages"] = missing
        _fail("Required packages are missing from the local .venv.", details)

    print(
        json.dumps(
            {"status": "ok", "message": "Local .venv is isolated and valid.", "details": details},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
