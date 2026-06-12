from __future__ import annotations

import argparse
import asyncio
import json

from backend.app.core.config import Settings
from backend.app.db.neo4j import Neo4jConnectionManager


async def _run(require_live: bool) -> None:
    settings = Settings()
    if not settings.has_neo4j_config:
        payload = {
            "status": "skipped" if not require_live else "failed",
            "message": "Neo4j live validation requires NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, and NEO4J_DATABASE.",
            "configured": settings.neo4j_safe_config,
        }
        print(json.dumps(payload, indent=2))
        raise SystemExit(1 if require_live else 0)

    manager = Neo4jConnectionManager(settings)
    try:
        await manager.connect()
        health = await manager.health_check()
    finally:
        await manager.close()

    print(
        json.dumps(
            {"status": "ok", "message": "Neo4j Aura connection validated.", "details": health},
            indent=2,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Neo4j Aura connectivity.")
    parser.add_argument(
        "--require-live",
        action="store_true",
        help="Fail instead of skipping when Neo4j secrets are absent.",
    )
    args = parser.parse_args()
    asyncio.run(_run(require_live=args.require_live))


if __name__ == "__main__":
    main()
