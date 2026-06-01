"""Pydantic settings, hydrated from env vars or a .env file at import time."""
from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    env: str = Field("development", validation_alias="ENV")

    # Inbound: callers (Next.js /api/pricing/*, cron) present this as Bearer.
    pricing_api_key: SecretStr = Field(..., validation_alias="PRICING_API_KEY")

    # Outbound: dedicated least-privilege PG role. asyncpg driver scheme.
    database_url: SecretStr = Field(..., validation_alias="DATABASE_URL")

    # WeSellCellular dealer-portal credentials and URLs.
    wesell_username: SecretStr = Field(..., validation_alias="WESELL_USERNAME")
    wesell_password: SecretStr = Field(..., validation_alias="WESELL_PASSWORD")
    wesell_login_url: str = Field(..., validation_alias="WESELL_LOGIN_URL")
    wesell_inventory_url: str = Field(..., validation_alias="WESELL_INVENTORY_URL")
    wesell_source_name: str = Field("WeSellCellular", validation_alias="WESELL_SOURCE_NAME")
    wesell_base_url: str = Field("", validation_alias="WESELL_BASE_URL")
    wesell_login_username_field: str = Field("username", validation_alias="WESELL_LOGIN_USERNAME_FIELD")
    wesell_login_password_field: str = Field("password", validation_alias="WESELL_LOGIN_PASSWORD_FIELD")

    request_timeout_s: float = Field(30.0, validation_alias="REQUEST_TIMEOUT_S")
    max_retries: int = Field(3, validation_alias="MAX_RETRIES")
    user_agent: str = Field("ShopMansa-Pricing/0.1", validation_alias="USER_AGENT")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
