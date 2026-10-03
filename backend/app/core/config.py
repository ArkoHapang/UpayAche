import os
import sys
from pathlib import Path
from typing import List

# Ensure project root is accessible for imports like ml, data
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def _load_env_fallback(env_file_path: Path) -> dict:
    env_vars = {}
    if env_file_path.exists():
        for line in env_file_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            env_vars[k.strip()] = v
    return env_vars


try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        PROJECT_NAME: str = "UpayAche"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        ENVIRONMENT: str = "development"
        DEBUG: bool = True
        
        HOST: str = "0.0.0.0"
        PORT: int = 8000
        ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

        SUPABASE_URL: str = ""
        SUPABASE_SERVICE_ROLE_KEY: str = ""
        SUPABASE_JWT_SECRET: str = ""
        GEMINI_API_KEY: str = ""
        GEMINI_MODEL: str = "gemini-1.5-flash"

        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore"
        )

        @property
        def cors_origins(self) -> List[str]:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    settings = Settings()

except ImportError:
    # Graceful fallback when running standalone CLI tools without pydantic-settings installed
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    file_vars = _load_env_fallback(env_file)

    class SettingsFallback:
        def __init__(self):
            self.PROJECT_NAME: str = os.getenv("PROJECT_NAME", file_vars.get("PROJECT_NAME", "UpayAche"))
            self.VERSION: str = "1.0.0"
            self.API_V1_STR: str = "/api/v1"
            self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", file_vars.get("ENVIRONMENT", "development"))
            self.DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
            self.HOST: str = os.getenv("HOST", file_vars.get("HOST", "0.0.0.0"))
            self.PORT: int = int(os.getenv("PORT", file_vars.get("PORT", "8000")))
            self.ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", file_vars.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"))
            self.SUPABASE_URL: str = os.getenv("SUPABASE_URL", file_vars.get("SUPABASE_URL", ""))
            self.SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", file_vars.get("SUPABASE_SERVICE_ROLE_KEY", ""))
            self.SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", file_vars.get("SUPABASE_JWT_SECRET", ""))
            self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", file_vars.get("GEMINI_API_KEY", ""))
            self.GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", file_vars.get("GEMINI_MODEL", "gemini-1.5-flash"))

        @property
        def cors_origins(self) -> List[str]:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    settings = SettingsFallback()  # type: ignore

