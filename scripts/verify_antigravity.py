from __future__ import annotations

import importlib.metadata
import json
from typing import Any


def main() -> None:
    details: dict[str, Any] = {}
    try:
        from google.antigravity import Agent, LocalAgentConfig
    except Exception as exc:  # pragma: no cover - exercised by local environment.
        print(
            json.dumps(
                {
                    "status": "failed",
                    "message": "google-antigravity could not be imported from the active environment.",
                    "error": repr(exc),
                },
                indent=2,
            )
        )
        raise SystemExit(1) from exc

    details["package_version"] = importlib.metadata.version("google-antigravity")
    details["agent_class"] = f"{Agent.__module__}.{Agent.__name__}"
    details["config_class"] = f"{LocalAgentConfig.__module__}.{LocalAgentConfig.__name__}"
    print(
        json.dumps(
            {"status": "ok", "message": "Antigravity SDK import validated.", "details": details},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
