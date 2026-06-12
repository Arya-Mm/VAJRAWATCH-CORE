from __future__ import annotations

from functools import cached_property
from pathlib import Path
from typing import Any, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "VajraWatch Core API"
    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_cors_origins: str | list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
        alias="API_CORS_ORIGINS",
    )

    jwt_secret_key: str = Field(
        default="change-me-with-a-strong-local-secret",
        alias="JWT_SECRET_KEY",
        min_length=16,
    )
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    jwt_refresh_token_expire_minutes: int = Field(
        default=43_200, alias="JWT_REFRESH_TOKEN_EXPIRE_MINUTES"
    )

    neo4j_uri: str | None = Field(default=None, alias="NEO4J_URI")
    neo4j_username: str | None = Field(default=None, alias="NEO4J_USERNAME")
    neo4j_password: str | None = Field(default=None, alias="NEO4J_PASSWORD")
    neo4j_database: str | None = Field(default=None, alias="NEO4J_DATABASE")

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    antigravity_enabled: bool = Field(default=False, alias="ANTIGRAVITY_ENABLED")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")

    nvidia_api_key: str | None = Field(default=None, alias="NVIDIA_API_KEY")
    elevenlabs_api_key: str | None = Field(default=None, alias="ELEVENLABS_API_KEY")

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return [str(origin) for origin in value]
        raise TypeError("API_CORS_ORIGINS must be a comma-separated string or list.")

    @model_validator(mode="after")
    def validate_live_config(self) -> Self:
        if (
            self.app_env == "production"
            and self.jwt_secret_key == "change-me-with-a-strong-local-secret"  # noqa: S105
        ):
            raise ValueError("JWT_SECRET_KEY must be explicitly configured in production.")

        neo4j_values = [
            self.neo4j_uri,
            self.neo4j_username,
            self.neo4j_password,
            self.neo4j_database,
        ]
        if self.app_env == "production" and any(neo4j_values) and not all(neo4j_values):
            raise ValueError(
                "Neo4j config must include URI, username, password, "
                "and database together in production."
            )

        if self.antigravity_enabled and not self.gemini_api_key:
            raise ValueError("ANTIGRAVITY_ENABLED=true requires GEMINI_API_KEY.")

        return self

    @property
    def has_neo4j_config(self) -> bool:
        return all(
            [
                self.neo4j_uri,
                self.neo4j_username,
                self.neo4j_password,
                self.neo4j_database,
            ]
        )

    @property
    def neo4j_safe_config(self) -> dict[str, str | None]:
        return {
            "uri": self.neo4j_uri,
            "username": self.neo4j_username,
            "database": self.neo4j_database,
            "password": "***" if self.neo4j_password else None,
        }

    @cached_property
    def data_dir(self) -> Path:
        return ROOT_DIR / "data"


def get_settings() -> Settings:
    return Settings()
