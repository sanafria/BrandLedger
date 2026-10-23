"""Optional AI-assisted Analysis Service for BrandLedger.

Provides isolated, optional LLM analysis for:
1. Tone and brand voice analysis when required by policy.
2. Ambiguous claim interpretation that deterministic logic cannot reliably classify.

Safety Guarantees:
- Uses at most ONE LLM provider (OpenAI-compatible endpoint via standard HTTP).
- Completely disabled when credentials are not configured in environment variables.
- Never hardcodes API keys or secrets.
- Network failures, timeouts, rate limits, or invalid responses degrade gracefully to [].
- AI output is validated with Pydantic and verified against actual policy evidence.
- AI cannot override, remove, or suppress deterministic findings.
"""

import json
import logging
import os
from typing import Any, Optional
import httpx

from backend.app.schemas.finding import Finding, FindingCategory, FindingSeverity
from backend.app.schemas.policy import PolicyCard
from backend.app.services.evidence_verifier import verify_finding

logger = logging.getLogger(__name__)

# Single provider environment variable configuration
LLM_API_KEY_ENV = "BRANDLEDGER_LLM_API_KEY"
LLM_FALLBACK_KEY_ENV = "OPENAI_API_KEY"
LLM_BASE_URL_ENV = "BRANDLEDGER_LLM_BASE_URL"
LLM_MODEL_ENV = "BRANDLEDGER_LLM_MODEL"

DEFAULT_BASE_URL = "https://api.openai.com/v1"
DEFAULT_MODEL = "gpt-4o-mini"
REQUEST_TIMEOUT_SECONDS = 10.0


def is_ai_enabled() -> bool:
    """Check whether optional AI analysis is configured and enabled.

    Returns False if API key is missing or explicit disable flag is set.
    """
    disable_flag = os.environ.get("BRANDLEDGER_DISABLE_AI", "false").lower()
    if disable_flag in ("1", "true", "yes"):
        return False

    api_key = os.environ.get(LLM_API_KEY_ENV) or os.environ.get(LLM_FALLBACK_KEY_ENV)
    return bool(api_key and api_key.strip())


def _get_api_key() -> Optional[str]:
    """Retrieve API key strictly from environment variables."""
    key = os.environ.get(LLM_API_KEY_ENV) or os.environ.get(LLM_FALLBACK_KEY_ENV)
    return key.strip() if key else None


def _get_base_url() -> str:
    """Retrieve configured base URL or default."""
    return os.environ.get(LLM_BASE_URL_ENV, DEFAULT_BASE_URL).rstrip("/")


def _get_model() -> str:
    """Retrieve configured model name or default."""
    return os.environ.get(LLM_MODEL_ENV, DEFAULT_MODEL)


def _build_prompt(content_text: str, policy_cards: list[PolicyCard]) -> str:
    """Construct a constrained prompt enforcing strict JSON output and policy citations."""
    policies_context = []
    for card in policy_cards:
        policies_context.append(
            f"Policy ID: {card.id}\nVersion: {card.version}\nContent: {card.content}\n"
        )

    return (
        "You are BrandLedger's Tone and Ambiguous Claim Verifier.\n"
        "Analyze the following draft text ONLY for tone violations and ambiguous claims "
        "governed by the approved policies below.\n"
        "STRICT CONSTRAINTS:\n"
        "1. Cite ONLY actual Policy ID and Policy Version provided below.\n"
        "2. The source_quote MUST be an EXACT, literal substring from the referenced policy content.\n"
        "3. Do NOT invent policies or quotes.\n"
        "4. Return a JSON array of objects with the exact schema:\n"
        "   [\n"
        "     {\n"
        '       "policy_card_id": "...",\n'
        '       "policy_version": "...",\n'
        '       "category": "tone",\n'
        '       "severity": "medium",\n'
        '       "matched_text": "...",\n'
        '       "source_quote": "...",\n'
        '       "explanation": "...",\n'
        '       "suggested_fix": "...",\n'
        '       "confidence": 0.8\n'
        "     }\n"
        "   ]\n"
        "If no violations exist, return an empty array [].\n\n"
        f"--- APPROVED POLICIES ---\n{''.join(policies_context)}\n"
        f"--- DRAFT TEXT ---\n{content_text}\n"
    )


def run_optional_ai_checks(
    content_text: str,
    policy_cards: list[PolicyCard]
) -> list[Finding]:
    """Execute optional AI analysis when enabled and credentials exist.

    All AI findings are strictly verified against actual policy evidence.
    Any fabricated quotations, invalid card IDs, or mismatched versions are rejected.
    """
    if not is_ai_enabled():
        return []

    if not content_text or not content_text.strip() or not policy_cards:
        return []

    # Tone or brand voice policy cards are the primary candidates for AI analysis
    tone_cards = [
        c for c in policy_cards
        if c.category in ("tone", "voice", "brand_voice")
        or "tone" in c.content.lower()
        or "voice" in c.content.lower()
    ]

    # If no policy relates to tone/voice, skip LLM call to save latency and tokens
    cards_for_ai = tone_cards if tone_cards else policy_cards

    api_key = _get_api_key()
    if not api_key:
        return []

    base_url = _get_base_url()
    model = _get_model()
    prompt = _build_prompt(content_text, cards_for_ai)

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a brand compliance auditor returning strict JSON."
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }

        with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload
            )

        if response.status_code != 200:
            logger.warning(
                "AI provider returned non-200 status %d: %s",
                response.status_code,
                response.text[:200]
            )
            return []

        data = response.json()
        raw_content = data["choices"][0]["message"]["content"]
        parsed_json = json.loads(raw_content)

        # Accommodate object wrapper {"findings": [...]} or raw list [...]
        raw_items = parsed_json if isinstance(parsed_json, list) else parsed_json.get("findings", [])
        if not isinstance(raw_items, list):
            return []

        cards_by_id = {c.id: c for c in policy_cards}
        verified_ai_findings: list[Finding] = []

        for item in raw_items:
            try:
                candidate = Finding(**item)
                # Verify AI finding against policy evidence to prevent hallucinations
                is_valid, _ = verify_finding(candidate, cards_by_id)
                if is_valid:
                    verified_ai_findings.append(candidate)
                else:
                    logger.info("Rejected unverified AI finding: %s", candidate.explanation)
            except Exception as val_err:
                logger.debug("Skipping invalid AI item: %s", val_err)
                continue

        return verified_ai_findings

    except (httpx.RequestError, httpx.TimeoutException) as net_err:
        logger.warning("AI provider request failed or timed out: %s", net_err)
        return []
    except json.JSONDecodeError as json_err:
        logger.warning("Failed to decode AI response JSON: %s", json_err)
        return []
    except Exception as exc:
        logger.warning("Unexpected error during AI analysis: %s", exc)
        return []
