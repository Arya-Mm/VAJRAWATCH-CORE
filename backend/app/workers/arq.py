from __future__ import annotations

from arq.connections import RedisSettings

from backend.app.core.config import Settings


def get_worker_settings() -> type[object]:
    settings = Settings()

    class WorkerSettings:
        redis_settings = RedisSettings.from_dsn(settings.redis_url)
        functions: list[object] = []

    return WorkerSettings
