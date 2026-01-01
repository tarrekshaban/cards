from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Path to project root (parent of backend directory)
PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    debug: bool = False
    
    # Comma-separated list of allowed emails (empty = allow all)
    allowed_emails: str = ""
    
    def is_email_allowed(self, email: str) -> bool:
        """Check if email is in the whitelist (or whitelist is disabled)."""
        if not self.allowed_emails:
            return True  # No whitelist = allow all
        allowed = [e.strip().lower() for e in self.allowed_emails.split(",")]
        return email.lower() in allowed

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
