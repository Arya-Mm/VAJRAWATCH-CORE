from __future__ import annotations

import asyncio
import json

from backend.app.core.config import Settings
from backend.app.db.neo4j import Neo4jConnectionManager
from backend.app.db.schema import initialize_schema, seed_demo_graph


async def _run() -> None:
    settings = Settings()
    if not settings.has_neo4j_config:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "message": "Neo4j schema initialization requires complete Neo4j settings in .env.",
                    "configured": settings.neo4j_safe_config,
                },
                indent=2,
            )
        )
        raise SystemExit(1)

    manager = Neo4jConnectionManager(settings)
    try:
        await manager.connect()
        await initialize_schema(manager)
        await seed_demo_graph(manager)
    finally:
        await manager.close()

    print(
        json.dumps(
            {"status": "ok", "message": "Neo4j schema and demo graph initialized."}, indent=2
        )
    )


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
