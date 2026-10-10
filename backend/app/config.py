import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
IS_VERCEL = os.getenv("VERCEL") == "1"
PUBLIC_DEMO = IS_VERCEL or os.getenv("VITALIS_PUBLIC_DEMO", "").lower() in {"1", "true", "yes"}
DEFAULT_DATA_DIR = Path("/tmp/vitalis-ai") if IS_VERCEL else BASE_DIR / "data"
DATA_DIR = Path(os.getenv("VITALIS_DATA_DIR", str(DEFAULT_DATA_DIR)))
UPLOADS_DIR = DATA_DIR / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "Vitalis AI - Personal Health Copilot"
    VERSION: str = "2.0.0"
    DB_PATH: Path = DATA_DIR / "vitalis.db"
    UPLOADS_PATH: Path = UPLOADS_DIR
    
    # LLM Settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq") # gemini | openai | groq | openrouter
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    LLM_FALLBACK_MODEL: str = os.getenv("LLM_FALLBACK_MODEL", "llama-3.1-8b-instant")
    
    # Fallback / Local simulation mode indicator
    ALLOW_MOCK_FALLBACK: bool = True

settings = Settings()
