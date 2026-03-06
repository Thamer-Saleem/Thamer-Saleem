from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Muaafah"
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ANTHROPIC_API_KEY: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./muaafah.db"
    REDIS_URL: str = "redis://localhost:6379"

    NPHIES_BASE_URL: str = "https://api.nphies.sa"
    NPHIES_API_KEY: str = ""

    NAFATH_CLIENT_ID: str = ""
    NAFATH_CLIENT_SECRET: str = ""
    NAFATH_REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    SMS_GATEWAY_API_KEY: str = ""
    FIREBASE_SERVER_KEY: str = ""

    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_FILE_TYPES: str = "pdf,jpg,jpeg,png,heic"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
