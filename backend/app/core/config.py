from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "LeetCode Friends Tracker API"
    API_V1_STR: str = "/api/v1"
    
    # Database: SQLite default for local zero-config, PostgreSQL supported via env var
    DATABASE_URL: str = "sqlite+aiosqlite:///./leetcode_tracker.db"
    
    # LeetCode API & Polling Config
    LEETCODE_GRAPHQL_URL: str = "https://leetcode.com/graphql"
    POLL_INTERVAL_MINUTES: int = 3
    RATE_LIMIT_DELAY_SECONDS: float = 1.0
    
    # Points Configuration
    POINTS_EASY: int = 1
    POINTS_MEDIUM: int = 3
    POINTS_HARD: int = 5
    
    # Optional Notification & AI Keys
    FCM_SERVER_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
