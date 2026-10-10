from typing import Dict

from fastapi import HTTPException, Request

from app.config import PUBLIC_DEMO


JUDGE_PROVIDER_DEFAULTS = {
    "groq": "openai/gpt-oss-20b",
    "gemini": "gemini-3.8-flash",
    "openai": "gpt-5-mini",
    "openrouter": "openai/gpt-6-luna-decisions",
}


def judge_llm_overrides(request: Request) -> Dict[str, str]:
    """Read request-scoped judge credentials without changing gateway state."""
    if not PUBLIC_DEMO:
        return {}

    api_key = (request.headers.get("x-judge-api-key") or "").strip()
    if not api_key:
        return {}
    if len(api_key) > 512 or any(ch.isspace() for ch in api_key):
        raise HTTPException(status_code=400, detail="The API key format is invalid.")

    provider = (request.headers.get("x-judge-llm-provider") or "").strip().lower()
    if provider not in JUDGE_PROVIDER_DEFAULTS:
        raise HTTPException(status_code=400, detail="Choose a supported AI provider.")

    model = (request.headers.get("x-judge-llm-model") or JUDGE_PROVIDER_DEFAULTS[provider]).strip()
    if not model or len(model) > 120 or any(ch in model for ch in "\r\n"):
        raise HTTPException(status_code=400, detail="The model name is invalid.")

    return {
        "request_api_key": api_key,
        "request_provider": provider,
        "request_model": model,
    }
