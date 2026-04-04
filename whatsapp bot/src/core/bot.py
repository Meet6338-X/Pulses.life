"""
Core bot dispatcher logic for Pulses.life.
Refactored to use modular data and persistent sessions.
"""

from src.data.triage import LANG_DETECT, EMERGENCY_KEYWORDS, SYMPTOM_TRIAGE
from src.data.messages import (
    WELCOME_EN, WELCOME_HI, EMERGENCY_EN, EMERGENCY_HI,
    NOT_UNDERSTOOD_EN, NOT_UNDERSTOOD_HI, HOSPITAL_GUIDE_EN, HOSPITAL_GUIDE_HI
)
from src.core.sessions import session_manager

def detect_language(text: str) -> str:
    """Best-effort language detection from keyword lists."""
    text_lower = text.lower()
    for lang, keywords in LANG_DETECT.items():
        if any(kw in text_lower for kw in keywords):
            return lang
    return "en"

def is_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in EMERGENCY_KEYWORDS)

def match_symptom(text: str) -> dict | None:
    text_lower = text.lower()
    for key, data in SYMPTOM_TRIAGE.items():
        if any(kw.lower() in text_lower for kw in data["keywords"]):
            return data
    return None

def handle_message(user_id: str, text: str, name: str = "User") -> str:
    session = session_manager.get_session(user_id)
    
    # 1. Detect language (if not already locked or if forced by menu)
    incoming_lang = detect_language(text)
    if incoming_lang != "en":
        session["language"] = incoming_lang
    
    lang = session["language"]
    use_hindi = lang in ("hi", "mr")  # Marathi falls back to Hindi advice in v1
    
    # ── Commands ────────────────────────────────
    upper = text.strip().upper()

    if upper in ("HI", "HELLO", "START", "HELP", "MENU", "नमस्ते"):
        session = session_manager.reset_session(user_id)
        return WELCOME_HI if use_hindi else WELCOME_EN

    if upper == "RESET":
        session = session_manager.reset_session(user_id)
        return "✅ Session reset. " + (WELCOME_HI if use_hindi else WELCOME_EN)

    if upper in ("HOSPITAL", "HOSPITALS", "FIND HOSPITAL", "अस्पताल"):
        return HOSPITAL_GUIDE_HI if use_hindi else HOSPITAL_GUIDE_EN

    # ── Emergency detection ──────────────────────
    if is_emergency(text):
        session["step"] = "emergency"
        session_manager.save_session(user_id, session)
        return EMERGENCY_HI if use_hindi else EMERGENCY_EN

    # ── Symptom triage ───────────────────────────
    matched = match_symptom(text)
    if matched:
        session["step"] = "triaged"
        session["symptom"] = matched["department"]
        session_manager.save_session(user_id, session)
        return matched["advice_hi"] if use_hindi else matched["advice_en"]

    # ── Follow-up after triage ───────────────────
    if session.get("step") == "triaged":
        return (
            f"ℹ️ You were asking about: *{session['symptom']}*\n\n"
            "Would you like to know:\n"
            "• How to find the nearest hospital? → type *HOSPITAL*\n"
            "• Start a new question? → type *RESET*\n"
            "• Something else? Just describe your symptoms again."
        )

    # ── Fallback ─────────────────────────────────
    return NOT_UNDERSTOOD_HI if use_hindi else NOT_UNDERSTOOD_EN
