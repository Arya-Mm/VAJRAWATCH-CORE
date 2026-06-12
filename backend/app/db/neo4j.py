from __future__ import annotations

from backend.app.core.config import Settings
from neo4j import AsyncDriver, AsyncGraphDatabase


class Neo4jConnectionManager:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._driver: AsyncDriver | None = None

    @property
    def database(self) -> str:
        if not self._settings.neo4j_database:
            raise RuntimeError("Neo4j database is not configured.")
        return self._settings.neo4j_database

    @property
    def driver(self) -> AsyncDriver:
        if self._driver is None:
            raise RuntimeError("Neo4j driver has not been connected.")
        return self._driver

    async def connect(self) -> None:
        if not self._settings.has_neo4j_config:
            raise RuntimeError("Neo4j connection requires complete settings.")
        if self._driver is not None:
            return
        uri = self._settings.neo4j_uri
        username = self._settings.neo4j_username
        password = self._settings.neo4j_password
        assert uri is not None
        assert username is not None
        assert password is not None
        self._driver = AsyncGraphDatabase.driver(
            uri,
            auth=(username, password),
        )
        await self._driver.verify_connectivity()

    async def close(self) -> None:
        if self._driver is not None:
            await self._driver.close()
            self._driver = None

    async def health_check(self) -> dict[str, object]:
        if not self._settings.has_neo4j_config:
            return {"configured": False, "connected": False}
        if self._driver is None:
            return {"configured": True, "connected": False}
        async with self.driver.session(database=self.database) as session:
            result = await session.run("RETURN 1 AS ok")
            record = await result.single(strict=True)
            return {"configured": True, "connected": record["ok"] == 1, "database": self.database}
