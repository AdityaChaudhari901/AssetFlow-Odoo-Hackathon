"""Environment-backed settings for the AssetFlow API."""

from functools import lru_cache
from typing import Literal, Optional

from pydantic import AliasChoices, AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="ASSETFLOW_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "AssetFlow API"
    app_version: str = "0.1.0"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    supabase_url: AnyHttpUrl
    supabase_publishable_key: SecretStr
    supabase_secret_key: SecretStr
    # Legacy HS256 JWT secret. Leave unset on projects using the new asymmetric
    # signing keys; verification then falls back to the project JWKS endpoint.
    supabase_jwt_secret: Optional[SecretStr] = None
    frontend_url: str = "http://localhost:5173"
    storage_bucket: str = "assetflow-files"
    # Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Accept the bare
    # CRON_SECRET name (Vercel convention) as well as the prefixed one.
    cron_secret: Optional[SecretStr] = Field(
        default=None,
        validation_alias=AliasChoices("cron_secret", "assetflow_cron_secret"),
    )

    @field_validator("api_v1_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        """Require a normalized absolute API prefix."""
        normalized = f"/{value.strip('/')}"
        if normalized == "/":
            raise ValueError("API prefix cannot be the root path")
        return normalized

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins as a normalized list."""
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings object per process."""
    return Settings()
